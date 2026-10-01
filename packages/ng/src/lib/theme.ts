import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { MP_CONFIG, readStored, writeStored } from './config';

export type Theme = 'light' | 'dark';

/**
 * The brand's themes follow prefers-color-scheme until the viewer picks one; a
 * pick sets data-theme on <html>, which @metapatrol/style honours, and is
 * remembered across visits. Dark is the brand's home: without an explicit
 * light preference it stays dark.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly key = `${inject(MP_CONFIG).storagePrefix}.theme`;
  private readonly chosen = signal<Theme | null>(this.readChoice());
  private readonly system = signal<Theme>(this.systemTheme());

  /** The theme in effect. */
  readonly theme = (): Theme => this.chosen() ?? this.system();

  constructor() {
    const media = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: light)');
    media?.addEventListener?.('change', (event) => this.system.set(event.matches ? 'light' : 'dark'));
    effect(() => {
      const chosen = this.chosen();
      if (chosen) this.document.documentElement.setAttribute('data-theme', chosen);
      else this.document.documentElement.removeAttribute('data-theme');
    });
  }

  set(theme: Theme | null): void {
    this.chosen.set(theme);
    writeStored(this.key, theme ?? '');
  }

  toggle(): void {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private readChoice(): Theme | null {
    const value = readStored(this.key);
    return value === 'dark' || value === 'light' ? value : null;
  }

  private systemTheme(): Theme {
    return this.document.defaultView?.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
}
