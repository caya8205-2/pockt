export type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'name_asc'
  | 'name_desc'
  | 'amount_desc'
  | 'amount_asc'
  | 'due_date_asc'
  | 'due_date_desc'
  | 'custom';

export interface SortableItem {
  id: string;
  title?: string;
  name?: string;
  person?: string;
  billName?: string;
  amount?: number;
  totalAmount?: number;
  remainingAmount?: number;
  totalPaid?: number;
  date?: string;
  dueDate?: number | string | null;
  createdAt?: string;
  settledAt?: string | null;
  [key: string]: any;
}

export function sortItems<T extends SortableItem>(
  items: T[],
  sortBy: SortOption,
  storageKey?: string
): T[] {
  if (!items || items.length <= 1) return items;

  // Custom ordering from drag & drop
  if (sortBy === 'custom' && storageKey && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const orderIds: string[] = JSON.parse(saved);
        const map = new Map<string, T>();
        items.forEach((item) => map.set(item.id, item));

        const ordered: T[] = [];
        for (const id of orderIds) {
          if (map.has(id)) {
            ordered.push(map.get(id)!);
            map.delete(id);
          }
        }
        for (const item of map.values()) {
          ordered.push(item);
        }
        return ordered;
      }
    } catch {
      // fallback to date_desc if parse fails
    }
  }

  const copy = [...items];

  const getDateVal = (item: T): number => {
    const raw = item.settledAt || item.date || item.createdAt;
    if (raw) {
      const ts = new Date(raw).getTime();
      if (!isNaN(ts)) return ts;
    }
    // Fallback if dueDate is string
    if (typeof item.dueDate === 'string' && item.dueDate) {
      const ts = new Date(item.dueDate).getTime();
      if (!isNaN(ts)) return ts;
    }
    // Fallback if dueDate is number (1-31)
    if (typeof item.dueDate === 'number') {
      return item.dueDate;
    }
    return 0;
  };

  const getNameVal = (item: T): string => {
    return (item.title || item.name || item.person || item.billName || '').toLowerCase();
  };

  const getAmountVal = (item: T): number => {
    if (typeof item.amount === 'number') return item.amount;
    if (typeof item.remainingAmount === 'number') return item.remainingAmount;
    if (typeof item.totalAmount === 'number') return item.totalAmount;
    if (typeof item.totalPaid === 'number') return item.totalPaid;
    return 0;
  };

  const getDueDateVal = (item: T): number => {
    if (typeof item.dueDate === 'number') return item.dueDate;
    if (typeof item.dueDate === 'string' && item.dueDate) {
      const parsed = new Date(item.dueDate).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    return 999;
  };

  copy.sort((a, b) => {
    switch (sortBy) {
      case 'date_desc': {
        const diff = getDateVal(b) - getDateVal(a);
        if (diff !== 0) return diff;
        // tie breaker by createdAt if available
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      }

      case 'date_asc': {
        const diff = getDateVal(a) - getDateVal(b);
        if (diff !== 0) return diff;
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return 0;
      }

      case 'name_asc': {
        return getNameVal(a).localeCompare(getNameVal(b));
      }

      case 'name_desc': {
        return getNameVal(b).localeCompare(getNameVal(a));
      }

      case 'amount_desc': {
        return getAmountVal(b) - getAmountVal(a);
      }

      case 'amount_asc': {
        return getAmountVal(a) - getAmountVal(b);
      }

      case 'due_date_asc': {
        const diff = getDueDateVal(a) - getDueDateVal(b);
        if (diff !== 0) return diff;
        return getNameVal(a).localeCompare(getNameVal(b));
      }

      case 'due_date_desc': {
        const diff = getDueDateVal(b) - getDueDateVal(a);
        if (diff !== 0) return diff;
        return getNameVal(a).localeCompare(getNameVal(b));
      }

      default:
        return 0;
    }
  });

  return copy;
}
