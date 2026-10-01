import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { mpQueryParams } from './query';

let next = 0;

/**
 * The search field above a list, bound to ?q= (or another parameter), with
 * how many rows it leaves. Enter is passed on, for a page that has something
 * to open. Typing replaces the history entry rather than adding one per key.
 */
@Component({
  selector: 'mp-list-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
    form { flex: 1 1 16rem; max-width: 28rem; }
    .count { font-size: var(--mp-font-size-xs); color: var(--mp-fg-subtle); white-space: nowrap; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  `,
  template: `
    <form role="search" (submit)="$event.preventDefault(); submitted.emit()">
      <label [for]="id" class="sr-only">{{ placeholder() }}</label>
      <input
        [id]="id"
        class="mp-input"
        [placeholder]="placeholder()"
        [value]="query() ?? ''"
        (input)="search($any($event.target).value)"
        autocomplete="off"
        spellcheck="false"
      />
    </form>
    <span class="count">{{ shown() }} of {{ total() }}</span>
  `,
})
export class MpListSearch {
  /** The page's current search (its ?q=). */
  readonly query = input<string | null | undefined>('');
  readonly shown = input(0);
  readonly total = input(0);
  readonly placeholder = input('Filter');
  readonly param = input('q');
  readonly submitted = output<void>();
  protected readonly id = `mp-list-search-${next++}`;
  private readonly setQuery = mpQueryParams();

  protected search(value: string): void {
    this.setQuery({ [this.param()]: value || null, cursor: null, page: null }, { replace: true });
  }
}
