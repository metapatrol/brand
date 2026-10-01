import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** "tool sets / memory-engram": where the page is, and what it is, in one line. */
@Component({
  selector: 'mp-detail-title',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .section { font-size: var(--mp-font-size-md); font-weight: var(--mp-font-weight-regular); color: var(--mp-fg-muted); text-decoration: none; }
    .section:hover { color: var(--mp-signal-fg); }
    .slash { font-size: var(--mp-font-size-md); font-weight: var(--mp-font-weight-regular); color: var(--mp-fg-subtle); }
    .name { min-width: 0; font-family: var(--mp-font-family-mono); overflow-wrap: anywhere; }
  `,
  template: `
    <h1 class="mp-page-title">
      <a class="section" [routerLink]="link()">{{ section() }}</a>
      <span class="slash" aria-hidden="true">/</span>
      <span class="name">{{ name() }}</span>
      <ng-content />
    </h1>
  `,
})
export class MpDetailTitle {
  readonly section = input.required<string>();
  readonly link = input.required<string>();
  readonly name = input.required<string>();
}
