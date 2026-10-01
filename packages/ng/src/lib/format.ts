/** 12 345 with the locale's grouping, as tables show counts. */
export function count(n: number | null | undefined): string {
  return n === null || n === undefined ? '—' : n.toLocaleString();
}

/** "1 memory", "3 memories": a count with the noun in the right number. */
export function plural(n: number, one: string, many: string = `${one}s`): string {
  return `${count(n)} ${n === 1 ? one : many}`;
}

/** 1536 → "1.5 KiB". */
export function bytes(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let v = n;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${u === 0 ? v : v.toFixed(v < 10 ? 1 : 0)} ${units[u]}`;
}

/**
 * An identifier shortened for display: "sha256:" and twelve hex digits for a
 * digest or revision, the first twelve characters for a bare hash, other
 * identifiers cut in the middle so both ends stay readable.
 */
export function shortId(id: string | null | undefined, keep = 12): string {
  if (!id) return '—';
  const digest = id.match(/^([a-z0-9]+):([0-9a-f]+)$/i);
  if (digest) return `${digest[1]}:${digest[2]!.slice(0, keep)}`;
  if (/^[0-9a-f]+$/i.test(id)) return id.slice(0, keep);
  if (id.length <= keep * 2 + 1) return id;
  return `${id.slice(0, keep)}…${id.slice(-keep)}`;
}
