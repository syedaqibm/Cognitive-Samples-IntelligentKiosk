import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/hooks/AuthContext';
import {
  CATEGORIES,
  categoryColor,
  categoryIcon,
  formatMoney,
  monthKey,
  monthLabel,
} from '@/lib/categories';
import { getBudgets, setBudget, type BudgetItem } from '@/services/budgets';
import {
  createExpense,
  deleteExpense,
  getExpenses,
  type ExpenseItem,
} from '@/services/expenses';

export function HomePage() {
  const { signOut, user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => monthKey(new Date()));

  const refresh = useCallback(async () => {
    const [e, b] = await Promise.all([getExpenses(), getBudgets()]);
    setExpenses(e);
    setBudgets(b);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const months = useMemo(() => {
    const keys = new Set(expenses.map((e) => monthKey(e.spentAt)));
    keys.add(monthKey(new Date()));
    return [...keys].sort().reverse();
  }, [expenses]);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => monthKey(e.spentAt) === month),
    [expenses, month]
  );

  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of monthExpenses) {
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
    }
    return map;
  }, [monthExpenses]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Spend</h1>
        <div className="flex items-center gap-4">
          {user?.email && (
            <span className="text-sm text-gray-600" title={user.email}>
              {user.email}
            </span>
          )}
          <button
            onClick={() => void signOut()}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none"
            aria-label="Select month"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile label="Spent this month" value={formatMoney(totalSpent)} />
          <StatTile
            label="Monthly budget"
            value={totalBudget > 0 ? formatMoney(totalBudget) : '—'}
          />
          <StatTile
            label="Remaining"
            value={totalBudget > 0 ? formatMoney(totalBudget - totalSpent) : '—'}
            tone={
              totalBudget === 0
                ? undefined
                : totalSpent > totalBudget
                  ? 'over'
                  : 'under'
            }
          />
        </section>

        {loading ? (
          <p className="text-center text-gray-400 text-sm py-16">Loading...</p>
        ) : (
          <>
            <CategoryBreakdown
              spentByCategory={spentByCategory}
              budgets={budgets}
              onSetBudget={async (category, limit) => {
                await setBudget(category, limit);
                await refresh();
              }}
            />
            <AddExpenseForm
              onAdd={async (input) => {
                await createExpense(input);
                await refresh();
              }}
            />
            <ExpenseList
              expenses={monthExpenses}
              onDelete={async (id) => {
                await deleteExpense(id);
                await refresh();
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'over' | 'under';
}) {
  const valueColor =
    tone === 'over'
      ? 'text-[#d03b3b]'
      : tone === 'under'
        ? 'text-[#006300]'
        : 'text-gray-900';
  return (
    <div className="rounded-xl bg-white px-5 py-4 shadow-sm border border-gray-100">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

/**
 * Per-category horizontal bars. Bars are scaled to the largest of
 * (spent, budget) across categories so lengths are comparable on one axis.
 * Every bar carries a visible direct label with its amount.
 */
function CategoryBreakdown({
  spentByCategory,
  budgets,
  onSetBudget,
}: {
  spentByCategory: Map<string, number>;
  budgets: BudgetItem[];
  onSetBudget: (category: string, limit: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draftLimit, setDraftLimit] = useState('');

  const budgetFor = (category: string) =>
    budgets.find((b) => b.category === category)?.monthlyLimit ?? 0;

  const rows = CATEGORIES.filter(
    (c) => (spentByCategory.get(c.name) ?? 0) > 0 || budgetFor(c.name) > 0
  );
  const maxValue = Math.max(
    1,
    ...rows.map((c) =>
      Math.max(spentByCategory.get(c.name) ?? 0, budgetFor(c.name))
    )
  );

  const submitBudget = async (category: string) => {
    const limit = parseFloat(draftLimit);
    setEditing(null);
    if (!Number.isNaN(limit) && limit >= 0) {
      await onSetBudget(category, limit);
    }
  };

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
        By category
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">
          No spending or budgets yet this month.
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((c) => {
            const spent = spentByCategory.get(c.name) ?? 0;
            const budget = budgetFor(c.name);
            const over = budget > 0 && spent > budget;
            return (
              <li key={c.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-900">
                    {c.icon} {c.name}
                  </span>
                  <span className="text-gray-600">
                    {formatMoney(spent)}
                    {budget > 0 && (
                      <span className={over ? 'text-[#d03b3b] font-semibold' : 'text-gray-400'}>
                        {' '}
                        / {formatMoney(budget)}
                      </span>
                    )}
                  </span>
                </div>
                <div
                  className="relative h-4 rounded bg-gray-100"
                  role="img"
                  aria-label={`${c.name}: spent ${formatMoney(spent)}${budget > 0 ? ` of ${formatMoney(budget)} budget` : ''}`}
                >
                  {budget > 0 && (
                    <div
                      className="absolute inset-y-0 rounded border border-dashed border-gray-300"
                      style={{ width: `${(budget / maxValue) * 100}%` }}
                    />
                  )}
                  <div
                    className="absolute inset-y-0 rounded transition-all"
                    style={{
                      width: `${(Math.min(spent, maxValue) / maxValue) * 100}%`,
                      backgroundColor: over ? '#d03b3b' : c.color,
                    }}
                  />
                </div>
                <div className="mt-1 text-right">
                  {editing === c.name ? (
                    <span className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        autoFocus
                        value={draftLimit}
                        onChange={(e) => setDraftLimit(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void submitBudget(c.name);
                          if (e.key === 'Escape') setEditing(null);
                        }}
                        className="w-24 rounded border border-gray-300 px-2 py-0.5 text-xs"
                        aria-label={`Monthly budget for ${c.name}`}
                      />
                      <button
                        onClick={() => void submitBudget(c.name)}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Save
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setEditing(c.name);
                        setDraftLimit(budget > 0 ? String(budget) : '');
                      }}
                      className="text-xs text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      {budget > 0 ? 'Edit budget' : 'Set budget'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function AddExpenseForm({
  onAdd,
}: {
  onAdd: (input: {
    description: string;
    amount: number;
    category: string;
    spentAt: Date;
  }) => Promise<void>;
}) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const valid = description.trim().length > 0 && parseFloat(amount) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onAdd({
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        spentAt: new Date(`${date}T12:00:00`),
      });
      setDescription('');
      setAmount('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
        Add expense
      </h2>
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="grid grid-cols-1 sm:grid-cols-[1fr_7rem_10rem_9.5rem_auto] gap-3"
      >
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did you spend on?"
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none"
        />
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          aria-label="Amount"
          className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Category"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Date"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!valid || saving}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </section>
  );
}

function ExpenseList({
  expenses,
  onDelete,
}: {
  expenses: ExpenseItem[];
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
        Expenses ({expenses.length})
      </h2>
      {expenses.length === 0 ? (
        <p className="text-sm text-gray-400">
          No expenses this month. Add one above!
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {expenses.map((e) => (
            <li key={e.id} className="group flex items-center gap-3 py-3">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: categoryColor(e.category) }}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">
                  {e.description}
                </p>
                <p className="text-xs text-gray-400">
                  {categoryIcon(e.category)} {e.category} ·{' '}
                  {e.spentAt.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatMoney(e.amount)}
              </span>
              <button
                onClick={() => void onDelete(e.id)}
                className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                aria-label={`Delete ${e.description}`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
