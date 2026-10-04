import { booleanAttribute, ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MP_CONFIG } from './config';
import { Condition, ConditionTone, conditionTone } from './conditions';
import { ago } from './time';
import { MpTime } from './time-component';
import { MpTip } from './tip';

/** A state as a pill (mp-pill): a dot and a word, in the tone's colour; the tip on hover and focus. */
@Component({
  selector: 'mp-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [MpTip],
  host: { class: 'mp-pill', '[attr.data-tone]': 'tone()' },
  template: `<ng-content />`,
})
export class MpPill {
  readonly tone = input<ConditionTone | 'info'>('neutral');
  /** What is behind the pill, on hover and focus. */
  readonly tip = input<string | undefined>();

  constructor() {
    inject(MpTip).from(() => this.tip(), { focusable: true });
  }
}

/**
 * A condition as a pill: its type (or, `bare`, only its reason), its reason;
 * its message and age on hover. A False whose reason is in the configured
 * inherited reasons is a warning, not an error.
 */
@Component({
  selector: 'mp-condition',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [MpTip],
  host: { class: 'mp-pill', '[attr.data-tone]': 'tone()' },
  styles: `.reason { font-weight: var(--mp-font-weight-regular); opacity: 0.85; }`,
  template: `
    @if (!bare()) {
      {{ label() || condition()?.type }}
    }
    <span [class.reason]="!bare()">{{ condition()?.reason ?? (condition()?.status ?? 'Unknown') }}</span>
  `,
})
export class MpCondition {
  readonly condition = input<Condition | undefined>();
  /** What to call it; the condition's type by default. */
  readonly label = input('');
  /** Only the reason, for a table column whose header already names the condition. */
  readonly bare = input(false, { transform: booleanAttribute });
  private readonly inherited = inject(MP_CONFIG).inheritedReasons;
  protected readonly tone = computed(() => conditionTone(this.condition(), this.inherited));
  /** The message and age, as the tooltip shows them. */
  readonly tip = computed(() => {
    const c = this.condition();
    if (!c) return 'Not reported yet.';
    const since = c.lastTransitionTime ? ` since ${ago(c.lastTransitionTime)}` : '';
    return `${c.message ? c.message + '\n' : ''}${c.type} ${c.status}${since}`;
  });

  constructor() {
    inject(MpTip).from(() => this.tip(), { focusable: true });
  }
}

/** A resource's conditions as a panel: type, status, message, since; and the observed generation. */
@Component({
  selector: 'mp-conditions',
  imports: [MpCondition, MpTime],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mp-panel mp-panel-flush', role: 'region', 'aria-label': 'Conditions' },
  styles: `
    @layer components { :host { display: block; min-width: 0; } }
    .scroll { overflow-x: auto; }
    .meta { font-size: var(--mp-font-size-xs); color: var(--mp-fg-subtle); }
    .muted { color: var(--mp-fg-muted); }
    .nowrap { white-space: nowrap; }
    .empty { margin: 0; padding: 12px 16px; font-size: var(--mp-font-size-sm); color: var(--mp-fg-subtle); }
  `,
  template: `
    <div class="mp-panel-head">
      <h2 class="mp-label">{{ title() }}</h2>
      @if (observedGeneration() !== undefined) {
        <span class="meta">observed generation {{ observedGeneration() }} of {{ generation() }}</span>
      }
    </div>
    @if (conditions().length) {
      <div class="scroll">
        <table class="mp-table">
          <thead>
            <tr><th>type</th><th>status</th><th>message</th><th>since</th></tr>
          </thead>
          <tbody>
            @for (c of conditions(); track c.type) {
              <tr>
                <td class="nowrap">{{ c.type }}</td>
                <td><mp-condition [condition]="c" [label]="c.status" /></td>
                <td class="muted">{{ c.message }}</td>
                <td class="nowrap muted"><mp-time [value]="c.lastTransitionTime" /></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <p class="empty">Not reported yet.</p>
    }
  `,
})
export class MpConditions {
  readonly conditions = input<readonly Condition[]>([]);
  readonly observedGeneration = input<number | undefined>();
  readonly generation = input<number | undefined>();
  readonly title = input('conditions');
}
