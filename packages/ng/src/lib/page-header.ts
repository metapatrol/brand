import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * The top of a page: its title — after the section it belongs to, for a page
 * inside one — a short note beside it (a count, the API it calls, the kind),
 * and the page's actions on the right, from the content. (From the engram
 * console.)
 *
 *   <mp-page-header title="Memories" note="1 204" />
 *   <mp-page-header section="Memories" link="/memories" [title]="id" mono>
 *     <button class="mp-btn">Find similar</button>
 *   </mp-page-header>
 */
@Component({
  selector: 'mp-page-header',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @layer components {
      :host { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
    }
    .section { font-size: var(--mp-font-size-md); font-weight: var(--mp-font-weight-regular); color: var(--mp-fg-muted); text-decoration: none; }
    .section:hover { color: var(--mp-signal-fg); }
    .slash { font-size: var(--mp-font-size-md); font-weight: var(--mp-font-weight-regular); color: var(--mp-fg-subtle); }
    .title { min-width: 0; overflow-wrap: anywhere; }
    .mono { font-family: var(--mp-font-family-mono); }
    .note { font: var(--mp-font-weight-regular) var(--mp-font-size-sm) var(--mp-font-family-mono); color: var(--mp-fg-subtle); }
    .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .actions:empty { display: none; }
  `,
  template: `
    <h1 class="mp-page-title">
      @if (section(); as s) {
        <a class="section" [routerLink]="link()">{{ s }}</a>
        <span class="slash" aria-hidden="true">/</span>
      }
      <span class="title" [class.mono]="mono()">{{ title() }}</span>
      @if (note()) {
        <span class="note"> {{ note() }}</span>
      }
    </h1>
    <div class="actions"><ng-content /></div>
  `,
})
export class MpPageHeader {
  readonly title = input.required<string>();
  /** The section a page inside one belongs to, linked to `link`. */
  readonly section = input<string>();
  readonly link = input<string | unknown[]>('/');
  /** A short remark beside the title: a count, the API it calls, the kind. */
  readonly note = input<string | null | undefined>();
  /** The title is an identifier: set in the monospace face. */
  readonly mono = input(false, { transform: booleanAttribute });
}
