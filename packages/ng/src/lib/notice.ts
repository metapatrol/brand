import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type MpNoticeTone = 'warn' | 'bad' | 'info' | 'ok' | 'neutral';

/** What is wrong with the resource on this page (or worth knowing), above everything else. */
@Component({
  selector: 'mp-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mp-notice',
    '[attr.data-tone]': 'tone()',
    '[attr.role]': 'tone() === "bad" ? "alert" : "status"',
  },
  styles: `@layer components { :host { display: block; } }`,
  template: `<ng-content />`,
})
export class MpNotice {
  readonly tone = input<MpNoticeTone>('warn');
}
