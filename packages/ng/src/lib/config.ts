import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

export interface MetapatrolConfig {
  /** Prefix for what the components remember in localStorage (theme, sidebar). */
  storagePrefix: string;
  /** Condition reasons that only pass on a dependency's trouble: shown as warnings. */
  inheritedReasons: string[];
  /** How errors name the backend when it does not answer: "engram is not reachable". */
  serviceName: string;
}

const DEFAULTS: MetapatrolConfig = { storagePrefix: 'mp', inheritedReasons: [], serviceName: 'the service' };

export const MP_CONFIG = new InjectionToken<MetapatrolConfig>('MP_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULTS,
});

/**
 * Optional application-wide settings:
 *
 *   providers: [provideMetapatrol({ storagePrefix: 'engram', serviceName: 'engram' })]
 */
export function provideMetapatrol(config: Partial<MetapatrolConfig>): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: MP_CONFIG, useValue: { ...DEFAULTS, ...config } satisfies MetapatrolConfig },
  ]);
}

/** localStorage that may be missing (private windows, blocked storage, SSR). */
export function readStored(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // without storage the choice lasts for this page
  }
}
