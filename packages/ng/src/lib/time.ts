/** Anything a timestamp arrives as. */
export type Instant = string | number | Date | null | undefined;

function millis(value: Instant): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const ms = value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
}

/** "42s ago", "3h 12m ago", "5d ago": precise enough to tell stale from fresh. */
export function ago(value: Instant, now: number = Date.now()): string {
  const ms = millis(value);
  if (ms === undefined) return '—';
  const seconds = Math.max(0, Math.round((now - ms) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** An absolute timestamp for tooltips and detail pages, in the viewer's locale. */
export function timestamp(value: Instant): string {
  const ms = millis(value);
  if (ms === undefined) return typeof value === 'string' && value ? value : '—';
  return new Date(ms).toLocaleString();
}

/** The ISO form for <time datetime>, or null. */
export function isoInstant(value: Instant): string | null {
  const ms = millis(value);
  return ms === undefined ? null : new Date(ms).toISOString();
}

/** "1.2 s", "340 ms". */
export function duration(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`;
}

/** 4_320_000 → "1 h 12 min", 185_000 → "3 min 5 s", 12_400 → "12.4 s". */
export function span(ms: number): string {
  if (ms < 60_000) return duration(ms);
  const s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min ${s % 60} s`;
}
