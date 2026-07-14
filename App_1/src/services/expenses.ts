import { getRayfinClient, isLocalBackend } from './rayfinClient';

export interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  spentAt: Date;
}

export interface NewExpense {
  description: string;
  amount: number;
  category: string;
  spentAt: Date;
}

// Local-dev fallback: when no Fabric backend is configured, keep expenses in
// memory so the sample is fully functional without a database.
let inMemoryExpenses: ExpenseItem[] = [];

function normalize(raw: ExpenseItem): ExpenseItem {
  return {
    ...raw,
    amount: Number(raw.amount),
    spentAt: new Date(raw.spentAt),
  };
}

export async function getExpenses(): Promise<ExpenseItem[]> {
  if (isLocalBackend()) {
    return [...inMemoryExpenses].sort(
      (a, b) => b.spentAt.getTime() - a.spentAt.getTime()
    );
  }

  const client = getRayfinClient();
  const results = await client.data.Expense.select([
    'id',
    'description',
    'amount',
    'category',
    'spentAt',
  ])
    .orderBy({ spentAt: 'desc' })
    .execute();
  return (results as ExpenseItem[]).map(normalize);
}

export async function createExpense(input: NewExpense): Promise<ExpenseItem> {
  if (isLocalBackend()) {
    const expense: ExpenseItem = { id: crypto.randomUUID(), ...input };
    inMemoryExpenses.push(expense);
    return expense;
  }

  const client = getRayfinClient();
  const session = client.auth.getSession();
  if (!session.isAuthenticated || !session.user) {
    throw new Error('Cannot create expense: user is not authenticated.');
  }
  const expense = await client.data.Expense.create({
    ...input,
    user_id: session.user.id,
  });
  return normalize(expense as ExpenseItem);
}

export async function deleteExpense(id: string): Promise<void> {
  if (isLocalBackend()) {
    inMemoryExpenses = inMemoryExpenses.filter((e) => e.id !== id);
    return;
  }

  const client = getRayfinClient();
  await client.data.Expense.delete({ id });
}
