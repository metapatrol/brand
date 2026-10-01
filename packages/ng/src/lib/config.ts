import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

export interface MetapatrolConfig {
  /** Prefix for what the components remember in localStorage (theme, sidebar). */
  storagePrefix: string;
}

export const MP_CONFIG = new InjectionToken<MetapatrolConfig>('MP_CONFIG', {
  providedIn: 'root',
  factory: () => ({ storagePrefix: 'mp' }),
});

/**
 * Optional application-wide settings:
 *
 *   providers: [provideMetapatrol({ storagePrefix: 'engram' })]
 */
export function provideMetapatrol(config: Partial<MetapatrolConfig>): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: MP_CONFIG, useValue: { storagePrefix: 'mp', ...config } satisfies MetapatrolConfig },
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
