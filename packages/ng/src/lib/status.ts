import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type MpStatusKind = 'success' | 'warning' | 'error' | 'info' | 'active' | 'idle';

/** A coloured dot and its text (the mp-status pattern); idle shows the dot in the subtle tone. */
@Component({
  selector: 'mp-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mp-status', '[attr.data-status]': 'status() === "idle" ? null : status()' },
  template: `<ng-content />`,
})
export class MpStatus {
  readonly status = input<MpStatusKind>('idle');
}
