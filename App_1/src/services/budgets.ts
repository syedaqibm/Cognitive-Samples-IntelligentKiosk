import { getRayfinClient, isLocalBackend } from './rayfinClient';

export interface BudgetItem {
  id: string;
  category: string;
  monthlyLimit: number;
}

// Local-dev fallback mirror of expenses.ts.
let inMemoryBudgets: BudgetItem[] = [];

function normalize(raw: BudgetItem): BudgetItem {
  return { ...raw, monthlyLimit: Number(raw.monthlyLimit) };
}

export async function getBudgets(): Promise<BudgetItem[]> {
  if (isLocalBackend()) {
    return [...inMemoryBudgets];
  }

  const client = getRayfinClient();
  const results = await client.data.Budget.select([
    'id',
    'category',
    'monthlyLimit',
  ]).execute();
  return (results as BudgetItem[]).map(normalize);
}

/** Create or update the budget for a category. */
export async function setBudget(
  category: string,
  monthlyLimit: number
): Promise<BudgetItem> {
  if (isLocalBackend()) {
    const existing = inMemoryBudgets.find((b) => b.category === category);
    if (existing) {
      existing.monthlyLimit = monthlyLimit;
      return { ...existing };
    }
    const budget: BudgetItem = {
      id: crypto.randomUUID(),
      category,
      monthlyLimit,
    };
    inMemoryBudgets.push(budget);
    return budget;
  }

  const client = getRayfinClient();
  const session = client.auth.getSession();
  if (!session.isAuthenticated || !session.user) {
    throw new Error('Cannot set budget: user is not authenticated.');
  }

  const existing = await client.data.Budget.select(['id', 'category'])
    .where({ category: { eq: category } })
    .execute();
  if (existing.length > 0) {
    const id = (existing[0] as BudgetItem).id;
    await client.data.Budget.update({ id }, { monthlyLimit });
    const updated = await client.data.Budget.findById(id);
    return normalize(updated as BudgetItem);
  }

  const budget = await client.data.Budget.create({
    category,
    monthlyLimit,
    user_id: session.user.id,
  });
  return normalize(budget as BudgetItem);
}

export async function deleteBudget(id: string): Promise<void> {
  if (isLocalBackend()) {
    inMemoryBudgets = inMemoryBudgets.filter((b) => b.id !== id);
    return;
  }

  const client = getRayfinClient();
  await client.data.Budget.delete({ id });
}
