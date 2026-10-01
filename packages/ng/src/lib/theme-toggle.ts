import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MpIcon } from './icon';
import { ThemeService } from './theme';

/** Switches between the dark and the light theme; the icon shows where it goes. */
@Component({
  selector: 'mp-theme-toggle',
  imports: [MpIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    button {
      display: grid; place-items: center; width: 28px; height: 28px; padding: 0;
      color: var(--mp-fg-muted); background: transparent; border: 0;
      border-radius: var(--mp-radius-md); cursor: pointer; font-size: 16px;
    }
    button:hover { color: var(--mp-fg); background: var(--mp-surface-2); }
  `,
  template: `<button type="button" (click)="theme.toggle()" [attr.aria-label]="label()" [title]="label()">
    <mp-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" />
  </button>`,
})
export class MpThemeToggle {
  protected readonly theme = inject(ThemeService);
  protected readonly label = computed(() => (this.theme.theme() === 'dark' ? 'Use the light theme' : 'Use the dark theme'));
}
