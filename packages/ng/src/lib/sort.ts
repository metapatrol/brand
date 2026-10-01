import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input } from '@angular/core';
import { mpQueryParams } from './query';
import { DEFAULT_SORT, formatSort, nextSort, parseSort, Sort } from './table';

/**
 * The content of a column header that sorts its table by that column, through
 * ?sort=. A second click turns the order around; the header cell gets
 * aria-sort. A new order starts at the top: the page's cursor parameters are
 * reset.
 *
 *   <th><mp-sort key="size" [sort]="sort()">size</mp-sort></th>
 */
@Component({
  selector: 'mp-sort',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    button {
      display: inline-flex; align-items: center; gap: 4px; padding: 0;
      font: inherit; letter-spacing: inherit; text-transform: inherit; color: inherit;
      background: none; border: 0; cursor: pointer;
    }
    button:hover, button.active { color: var(--mp-fg); }
    .arrow { display: inline-block; width: 8px; font-size: 10px; }
  `,
  template: `
    <button type="button" [class.active]="active()" (click)="toggle()">
      <ng-content />
      <span class="arrow" aria-hidden="true">{{ active() ? (current().desc ? '↓' : '↑') : '' }}</span>
    </button>
  `,
})
export class MpSort {
  /** The column's key in ?sort=. */
  readonly key = input.required<string>();
  /** The page's ?sort=. */
  readonly sort = input<string | null | undefined>();
  /** The page's sort when ?sort= is absent. */
  readonly fallback = input<Sort>(DEFAULT_SORT);
  /** Parameters that belong to an order and start over with a new one. */
  readonly reset = input<string[]>(['cursor', 'page']);

  protected readonly current = computed(() => parseSort(this.sort(), this.fallback()));
  protected readonly active = computed(() => this.current().key === this.key());
  private readonly setQuery = mpQueryParams();

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    effect(() => {
      const th = host.closest('th');
      const value = this.active() ? (this.current().desc ? 'descending' : 'ascending') : null;
      if (value) th?.setAttribute('aria-sort', value);
      else th?.removeAttribute('aria-sort');
    });
  }

  protected toggle(): void {
    const next = nextSort(this.current(), this.key());
    const params: Record<string, string | null> = { sort: formatSort(next, this.fallback()) };
    for (const p of this.reset()) params[p] = null;
    this.setQuery(params, { replace: true });
  }
}
