import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/rayfinClient', () => ({
  isLocalBackend: () => true,
  getRayfinClient: () => {
    throw new Error('not used in local mode');
  },
}));

import { createExpense, deleteExpense, getExpenses } from '@/services/expenses';
import { getBudgets, setBudget } from '@/services/budgets';

describe('expenses (local in-memory mode)', () => {
  beforeEach(async () => {
    for (const e of await getExpenses()) {
      await deleteExpense(e.id);
    }
  });

  it('creates, lists, and deletes expenses', async () => {
    const created = await createExpense({
      description: 'Lunch',
      amount: 12.5,
      category: 'Food',
      spentAt: new Date('2026-07-14T12:00:00'),
    });
    expect(created.id).toBeTruthy();

    let all = await getExpenses();
    expect(all).toHaveLength(1);
    expect(all[0].description).toBe('Lunch');
    expect(all[0].amount).toBe(12.5);

    await deleteExpense(created.id);
    all = await getExpenses();
    expect(all).toHaveLength(0);
  });

  it('sorts expenses newest first', async () => {
    await createExpense({
      description: 'Old',
      amount: 1,
      category: 'Other',
      spentAt: new Date('2026-07-01T12:00:00'),
    });
    await createExpense({
      description: 'New',
      amount: 2,
      category: 'Other',
      spentAt: new Date('2026-07-10T12:00:00'),
    });

    const all = await getExpenses();
    expect(all.map((e) => e.description)).toEqual(['New', 'Old']);
  });
});

describe('budgets (local in-memory mode)', () => {
  it('upserts a budget per category', async () => {
    await setBudget('Food', 300);
    await setBudget('Food', 450);

    const budgets = await getBudgets();
    const food = budgets.filter((b) => b.category === 'Food');
    expect(food).toHaveLength(1);
    expect(food[0].monthlyLimit).toBe(450);
  });
});
