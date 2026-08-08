export function sortWithCustomOrder<T extends { id: string }>(items: T[], storageKey: string): T[] {
  if (typeof window === 'undefined') return items;
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return items;
    const orderIds: string[] = JSON.parse(saved);
    const map = new Map<string, T>();
    items.forEach((item) => map.set(item.id, item));

    const ordered: T[] = [];
    // First push items according to saved order
    for (const id of orderIds) {
      if (map.has(id)) {
        ordered.push(map.get(id)!);
        map.delete(id);
      }
    }
    // Then append any new items that weren't in saved order
    for (const item of map.values()) {
      ordered.push(item);
    }
    return ordered;
  } catch (err) {
    return items;
  }
}

export function saveCustomOrder<T extends { id: string }>(items: T[], storageKey: string) {
  if (typeof window === 'undefined') return;
  try {
    const orderIds = items.map((item) => item.id);
    localStorage.setItem(storageKey, JSON.stringify(orderIds));
  } catch (err) {
    console.error('Failed to save custom order:', err);
  }
}
