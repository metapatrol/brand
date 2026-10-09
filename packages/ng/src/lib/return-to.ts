/** Where safeReturnTo may not send anybody, and where it sends them instead. */
export interface ReturnToOptions {
  /** The route when there is none, or none that is safe. */
  fallback?: string;
  /** Routes not to return to: the sign-in pages themselves. */
  exclude?: readonly string[];
}

/**
 * A route to return to after signing in, from a ?returnTo= the browser
 * brought: only a route of the console itself — no other origin, no scheme,
 * not the sign-in pages — and the fallback otherwise. Relative to the
 * console, without a leading slash. (From the soulforge console.)
 */
export function safeReturnTo(raw: string | null | undefined, opts: ReturnToOptions = {}): string {
  const fallback = opts.fallback ?? 'overview';
  const exclude = opts.exclude ?? ['sign-in', 'callback'];
  if (!raw) return fallback;
  const route = raw.replace(/^\/+/, '');
  if (
    raw.startsWith('//') ||
    raw.includes('\\') ||
    /^[a-z][a-z0-9+.-]*:/i.test(route) ||
    route === '' ||
    exclude.some((page) => isRoute(route, page))
  ) {
    return fallback;
  }
  return route;
}

/** Whether a route (relative to the console, maybe with a query or fragment) is that page or below it. */
export function isRoute(route: string, page: string): boolean {
  const path = route.replace(/^\/+/, '').split(/[?#]/)[0];
  return path === page || path.startsWith(page + '/');
}
