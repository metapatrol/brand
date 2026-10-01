import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** What is wrong with the resource on this page (or worth knowing), above everything else. */
@Component({
  selector: 'mp-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mp-notice',
    '[attr.data-tone]': 'tone()',
    '[attr.role]': 'tone() === "bad" ? "alert" : "status"',
  },
  styles: `:host { display: block; }`,
  template: `<ng-content />`,
})
export class MpNotice {
  readonly tone = input<'warn' | 'bad' | 'info'>('warn');
}
