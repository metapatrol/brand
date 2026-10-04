import { HttpErrorResponse } from '@angular/common/http';

/** The HTTP status of a failed call, if it was one. */
export function statusOf(err: unknown): number | undefined {
  return err instanceof HttpErrorResponse ? err.status : undefined;
}

export const isForbidden = (err: unknown) => statusOf(err) === 403;
export const isNotFound = (err: unknown) => statusOf(err) === 404;
export const isUnavailable = (err: unknown) => statusOf(err) === 503;

/**
 * One line for an error: the API's own message where it sent one
 * ({"error": "…"}, {"message": "…"}, or a problem's title and detail as RFC 9457
 * has them), the status otherwise, and for a call that never got an answer,
 * that the service is not reachable.
 */
export function describeError(err: unknown, service = 'the service'): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { error?: unknown; message?: unknown; title?: unknown; detail?: unknown } | null;
    const text = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
    const problem = [text(body?.title), text(body?.detail)].filter(Boolean).join(': ') || undefined;
    const said = text(body?.error) ?? text(body?.message) ?? problem;
    if (said) return `${err.status} · ${said}`;
    return err.status ? `${err.status} · ${err.statusText || 'request failed'}` : `${service} is not reachable`;
  }
  if (err instanceof Error) return err.message;
  return String(err ?? 'unknown error');
}
