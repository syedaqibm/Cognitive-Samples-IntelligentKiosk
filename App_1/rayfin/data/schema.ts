import { Expense } from './Expense.js';
import { Budget } from './Budget.js';

export type ExpenseAppSchema = {
  Expense: Expense;
  Budget: Budget;
};

export const schema = [Expense, Budget];
