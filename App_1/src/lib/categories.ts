/**
 * Fixed expense categories with their display colors.
 *
 * Colors are a CVD-validated categorical palette assigned in FIXED order —
 * a category keeps its hue no matter how many categories are visible, so
 * filtering never repaints the survivors.
 */
export interface Category {
  name: string;
  color: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { name: 'Food', color: '#2a78d6', icon: '🍽️' },
  { name: 'Transport', color: '#1baf7a', icon: '🚗' },
  { name: 'Housing', color: '#eda100', icon: '🏠' },
  { name: 'Health', color: '#008300', icon: '💊' },
  { name: 'Entertainment', color: '#4a3aa7', icon: '🎬' },
  { name: 'Shopping', color: '#e34948', icon: '🛍️' },
  { name: 'Utilities', color: '#e87ba4', icon: '💡' },
  { name: 'Other', color: '#eb6834', icon: '📦' },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export function categoryColor(name: string): string {
  return CATEGORIES.find((c) => c.name === name)?.color ?? '#898781';
}

export function categoryIcon(name: string): string {
  return CATEGORIES.find((c) => c.name === name)?.icon ?? '📦';
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/** "2026-07" key for a date, used to group expenses by month. */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}
