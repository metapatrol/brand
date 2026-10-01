import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { MpIcon } from './icon';

/**
 * Code or a command with a copy button. `prompt` adds a "$" before each line
 * for shell commands (not copied).
 */
@Component({
  selector: 'mp-code-block',
  imports: [MpIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @layer components { :host { display: block; position: relative; min-width: 0; } }
    pre { padding-right: 44px; font-variant-ligatures: none; }
    .prompt { color: var(--mp-signal-fg); user-select: none; }
    button {
      position: absolute; top: 8px; right: 8px; display: grid; place-items: center;
      width: 28px; height: 28px; padding: 0; font-size: 14px; color: var(--mp-fg-muted);
      background: var(--mp-surface); border: 1px solid var(--mp-line); border-radius: var(--mp-radius-md);
      cursor: pointer;
    }
    button:hover { color: var(--mp-fg); border-color: var(--mp-line-strong); }
    button.copied { color: var(--mp-success); }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  `,
  template: `
    <pre><code>@for (line of lines(); track $index) {@if (prompt()) {<span class="prompt">$ </span>}{{ line }}
}</code></pre>
    <button type="button" [class.copied]="copied()" (click)="copy()" [attr.aria-label]="copied() ? 'Copied' : 'Copy'" [title]="copied() ? 'Copied' : 'Copy'">
      <mp-icon [name]="copied() ? 'check' : 'copy'" />
    </button>
    <span class="sr-only" aria-live="polite">{{ copied() ? 'Copied to the clipboard' : '' }}</span>
  `,
})
export class MpCodeBlock {
  readonly code = input.required<string>();
  readonly prompt = input(false);
  protected readonly copied = signal(false);
  protected readonly lines = () => this.code().replace(/\n$/, '').split('\n');
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // no clipboard (insecure context, denied): the text stays selectable
    }
  }
}
