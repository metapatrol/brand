import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EnvironmentProviders,
  inject,
  InjectionToken,
  input,
  makeEnvironmentProviders,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { BUILT_IN_ICONS, BuiltInIconName } from './generated/icons';

export type { BuiltInIconName };

/** Inner markup of 24×24 stroke icons, keyed by name. */
export type IconSet = Record<string, string>;

export const MP_ICONS = new InjectionToken<IconSet[]>('MP_ICONS');

/**
 * Adds icons to the built-in set — inner markup of a 24×24, stroke-based SVG,
 * e.g. copied from lucide.dev. Constants of the application, never user input.
 *
 *   providers: [provideMpIcons({ brain: '<path d="…"/>' })]
 */
export function provideMpIcons(icons: IconSet): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: MP_ICONS, useValue: icons, multi: true }]);
}

/** An icon in the current text colour; decorative (aria-hidden), label the control around it. */
@Component({
  selector: 'mp-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mp-icon', 'aria-hidden': 'true' },
  styles: `
    @layer components { :host { display: inline-block; flex: none; width: 1em; height: 1em; } }
    svg { display: block; width: 100%; height: 100%; }
  `,
  template: `<svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    [innerHTML]="markup()"
  ></svg>`,
})
export class MpIcon {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly extra = inject(MP_ICONS, { optional: true }) ?? [];
  readonly name = input.required<BuiltInIconName | (string & {})>();

  protected readonly markup = computed(() => {
    const name = this.name();
    const found = [...this.extra].reverse().find((set) => name in set)?.[name]
      ?? (BUILT_IN_ICONS as Record<string, string>)[name];
    if (found === undefined) {
      console.warn(`mp-icon: no icon "${name}"; register it with provideMpIcons()`);
      return '';
    }
    // markup from this package or the application's own constants
    return this.sanitizer.bypassSecurityTrustHtml(found);
  });
}
