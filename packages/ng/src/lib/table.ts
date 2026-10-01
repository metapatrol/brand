/** A sort as the URL has it: a column key, prefixed with - for descending. */
export interface Sort {
  key: string;
  desc: boolean;
}

/** Lists come sorted by name unless a page says otherwise; the URL leaves the default out. */
export const DEFAULT_SORT: Sort = { key: 'name', desc: false };

export function parseSort(param: string | null | undefined, fallback: Sort = DEFAULT_SORT): Sort {
  if (!param) return fallback;
  return param.startsWith('-') ? { key: param.slice(1), desc: true } : { key: param, desc: false };
}

/** The ?sort= value, or null for the page's default sort. */
export function formatSort(sort: Sort, fallback: Sort = DEFAULT_SORT): string | null {
  if (sort.key === fallback.key && sort.desc === fallback.desc) return null;
  return (sort.desc ? '-' : '') + sort.key;
}

/** What clicking a column header does: sort by it, or turn it around. */
export function nextSort(current: Sort, key: string): Sort {
  return current.key === key ? { key, desc: !current.desc } : { key, desc: false };
}

export type SortValue = string | number | undefined;

/**
 * Sorts rows by a column. Numbers compare as numbers, text naturally
 * ("agent-2" before "agent-10"), and rows without a value go last either way.
 * Ties fall back to the name, so the order is stable. An unknown column sorts
 * by name.
 */
export function sortRows<T>(
  rows: readonly T[],
  sort: Sort,
  columns: Record<string, (row: T) => SortValue>,
  name: (row: T) => string,
): T[] {
  const value = columns[sort.key] ?? name;
  const dir = sort.desc ? -1 : 1;
  return [...rows].sort((a, b) => {
    const x = value(a);
    const y = value(b);
    if (x === undefined || y === undefined) {
      return x === y ? name(a).localeCompare(name(b)) : x === undefined ? 1 : -1;
    }
    const c =
      typeof x === 'number' && typeof y === 'number'
        ? x - y
        : String(x).localeCompare(String(y), undefined, { numeric: true });
    return c ? c * dir : name(a).localeCompare(name(b));
  });
}

/** Rows any of whose texts contain the query, ignoring case. */
export function searchRows<T>(rows: readonly T[], query: string | null | undefined, texts: (row: T) => (string | undefined)[]): T[] {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return [...rows];
  return rows.filter((r) => texts(r).some((t) => t?.toLowerCase().includes(q)));
}
