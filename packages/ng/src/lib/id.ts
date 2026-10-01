import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { shortId } from './format';
import { MpIcon } from './icon';

/**
 * A technical identifier — digest, revision, image reference, UID — in the
 * monospace face, shortened (sha256:3f2a9c1e0b7d), the whole value on hover and
 * one click from the clipboard.
 */
@Component({
  selector: 'mp-id',
  imports: [MpIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 4px; max-width: 100%; vertical-align: baseline; }
    code { font-size: 0.925em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    button {
      display: inline-grid; place-items: center; width: 20px; height: 20px; padding: 0; flex: none;
      font-size: 12px; color: var(--mp-fg-subtle); background: none; border: 0;
      border-radius: var(--mp-radius-sm); cursor: pointer;
    }
    button:hover { color: var(--mp-fg); background: var(--mp-surface-2); }
    button.copied { color: var(--mp-success); }
  `,
  template: `
    <code [title]="value()">{{ short() }}</code>
    @if (value() && copyable()) {
      <button type="button" [class.copied]="copied()" (click)="copy()" [attr.aria-label]="copied() ? 'Copied' : 'Copy ' + value()" [title]="copied() ? 'Copied' : 'Copy'">
        <mp-icon [name]="copied() ? 'check' : 'copy'" />
      </button>
    }
  `,
})
export class MpId {
  readonly value = input.required<string | null | undefined>();
  /** Hex digits or characters kept on each end. */
  readonly keep = input(12);
  readonly copyable = input(true);
  protected readonly short = computed(() => shortId(this.value(), this.keep()));
  protected readonly copied = signal(false);

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.value() ?? '');
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // no clipboard: the value is in the tooltip and selectable
    }
  }
}
