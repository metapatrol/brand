import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

/**
 * How far a value has come towards a limit, as a thin bar: the signal below
 * warnAt, a warning from there, an error from errorAt (the limit, by
 * default). (From websearch and webfetch.)
 *
 *   <mp-meter [value]="used" [max]="quota" label="requests today" />
 */
@Component({
  selector: 'mp-meter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @layer components { :host { display: block; } }
    .track { height: 6px; overflow: hidden; border-radius: 999px; background: var(--mp-surface-2); }
    .fill { display: block; height: 100%; border-radius: 999px; background: var(--mp-signal); }
    .fill.warn { background: var(--mp-warning); }
    .fill.bad { background: var(--mp-error); }
  `,
  template: `
    <div
      class="track"
      role="meter"
      [attr.aria-label]="label() || null"
      [attr.aria-valuenow]="value()"
      aria-valuemin="0"
      [attr.aria-valuemax]="max()"
    >
      <span class="fill" [class.warn]="tone() === 'warn'" [class.bad]="tone() === 'bad'" [style.width.%]="percent()"></span>
    </div>
  `,
})
export class MpMeter {
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  readonly label = input('');
  /** The share of max from which it shows as a warning. */
  readonly warnAt = input(0.75);
  /** The share of max from which it shows as an error. */
  readonly errorAt = input(1);

  private readonly ratio = computed(() => (this.max() > 0 ? this.value() / this.max() : 0));
  protected readonly percent = computed(() => Math.min(100, Math.max(0, this.ratio() * 100)));
  protected readonly tone = computed(() => {
    const r = this.ratio();
    return r >= this.errorAt() ? 'bad' : r >= this.warnAt() ? 'warn' : 'ok';
  });
}

/** "8 Nov": a UTC day (YYYY-MM-DD) in the viewer's locale, without the year. */
export function shortDay(day: string | undefined, locale?: string): string {
  if (!day) return '';
  const d = new Date(day + 'T00:00:00Z');
  return Number.isNaN(d.getTime()) ? day : d.toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** The chart's drawing height; the bars use all but a pixel of it. */
const HEIGHT = 80;
const STEP = 10;
const GAP = 1;

/**
 * One measure per day as bars, the first day on the left, with a part of
 * each bar lighter (the requests the cache answered, say). The scale starts
 * at zero and its top is the largest day, written at the top left; the first
 * and the last day stand under it. Pointing at a day says its date and
 * figures in place of the total. A few rects, no chart library.
 * (From websearch and webfetch.)
 *
 *   <mp-day-bars label="Requests per day" [days]="days" [values]="requests"
 *                [lighter]="cached" darkerLabel="asked" lighterLabel="cached" />
 */
@Component({
  selector: 'mp-day-bars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @layer components { :host { display: flex; flex-direction: column; gap: 4px; } }
    .head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; font-size: var(--mp-font-size-xs); }
    .label { color: var(--mp-fg-muted); }
    .figure { color: var(--mp-fg); font-variant-numeric: tabular-nums; }
    .total { font-weight: var(--mp-font-weight-medium); }
    .chart { position: relative; }
    svg { display: block; width: 100%; height: 80px; }
    .grid { stroke: var(--mp-line); stroke-width: 1; vector-effect: non-scaling-stroke; }
    .bar { fill: color-mix(in srgb, var(--mp-signal) 70%, transparent); }
    .bar.on { fill: var(--mp-signal); }
    .base { fill: var(--mp-surface-2); }
    .light { fill: color-mix(in srgb, var(--mp-signal) 30%, transparent); }
    .top { position: absolute; top: 0; left: 4px; font-size: 10px; color: var(--mp-fg-subtle); pointer-events: none; }
    .foot { display: flex; justify-content: space-between; font-size: 10px; color: var(--mp-fg-subtle); font-variant-numeric: tabular-nums; }
    .legend { display: flex; align-items: center; gap: 4px; }
    .swatch { display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: color-mix(in srgb, var(--mp-signal) 70%, transparent); }
    .swatch.light { margin-left: 8px; background: color-mix(in srgb, var(--mp-signal) 30%, transparent); }
  `,
  template: `
    <div class="head">
      <span class="label">{{ label() }}</span>
      @if (hovered(); as h) {
        <span class="figure">{{ h }}</span>
      } @else {
        <span class="figure total">{{ total() }}</span>
      }
    </div>
    <div class="chart">
      <svg
        [attr.viewBox]="'0 0 ' + width() + ' ' + height"
        preserveAspectRatio="none"
        role="img"
        [attr.aria-label]="label() + ': ' + total()"
        (mouseleave)="hover.set(null)"
      >
        <line class="grid" x1="0" [attr.x2]="width()" [attr.y1]="height - 0.5" [attr.y2]="height - 0.5" />
        @for (b of bars(); track $index) {
          <!-- the hit area is the whole column, the bar only what it measures -->
          <rect [attr.x]="b.x" y="0" [attr.width]="step" [attr.height]="height" fill="transparent" (mouseenter)="hover.set($index)" />
          @if (b.h > 0) {
            <rect class="bar" [class.on]="hover() === $index" [attr.x]="b.x + gap" [attr.y]="height - b.h" [attr.width]="step - 2 * gap" [attr.height]="b.h" pointer-events="none" />
          }
          @if (b.lighter > 0) {
            <rect class="base" [attr.x]="b.x + gap" [attr.y]="height - b.lighter" [attr.width]="step - 2 * gap" [attr.height]="b.lighter" pointer-events="none" />
            <rect class="light" [attr.x]="b.x + gap" [attr.y]="height - b.lighter" [attr.width]="step - 2 * gap" [attr.height]="b.lighter" pointer-events="none" />
          }
        }
      </svg>
      <span class="top">{{ top() }}</span>
    </div>
    <div class="foot">
      <span>{{ first() }}</span>
      @if (lighterLabel()) {
        <span class="legend"><span class="swatch"></span>{{ darkerLabel() }}<span class="swatch light"></span>{{ lighterLabel() }}</span>
      }
      <span>{{ last() }}</span>
    </div>
  `,
})
export class MpDayBars {
  readonly label = input.required<string>();
  /** The UTC days (YYYY-MM-DD), in order. */
  readonly days = input.required<readonly string[]>();
  /** Each day's whole value. */
  readonly values = input.required<readonly number[]>();
  /** The part of each day's value shown lighter, at the bar's foot. */
  readonly lighter = input<readonly number[]>([]);
  /** What the lighter part counts, and what the rest does, for the legend. */
  readonly lighterLabel = input('');
  readonly darkerLabel = input('');
  readonly format = input<(n: number) => string>((n) => n.toLocaleString());
  /** The locale the days are written in; the viewer's by default. */
  readonly locale = input<string>();

  protected readonly height = HEIGHT;
  protected readonly step = STEP;
  protected readonly gap = GAP;
  protected readonly hover = signal<number | null>(null);
  protected readonly width = computed(() => Math.max(1, this.values().length) * STEP);
  private readonly max = computed(() => Math.max(0, ...this.values()));
  protected readonly bars = computed(() => {
    const max = this.max() || 1;
    const scale = (v: number) => (v > 0 ? Math.max(2, (v / max) * (HEIGHT - 1)) : 0);
    const light = this.lighter();
    return this.values().map((v, i) => ({
      x: i * STEP,
      h: scale(v),
      // the lighter part never stands above its bar
      lighter: Math.min(scale(v), scale(light[i] ?? 0)),
    }));
  });
  protected readonly total = computed(() => this.format()(this.values().reduce((a, b) => a + b, 0)));
  protected readonly top = computed(() => (this.max() > 0 ? this.format()(this.max()) : ''));
  protected readonly first = computed(() => shortDay(this.days()[0], this.locale()));
  protected readonly last = computed(() => {
    const d = this.days();
    return d.length > 1 ? shortDay(d[d.length - 1], this.locale()) : '';
  });
  protected readonly hovered = computed(() => {
    const i = this.hover();
    if (i === null) return null;
    const day = shortDay(this.days()[i], this.locale());
    const v = this.format()(this.values()[i] ?? 0);
    const light = this.lighter()[i];
    return light !== undefined && this.lighterLabel() ? `${day} · ${v} · ${this.lighterLabel()} ${this.format()(light)}` : `${day} · ${v}`;
  });
}
