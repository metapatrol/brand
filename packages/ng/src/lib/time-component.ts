import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, Injectable, input, signal } from '@angular/core';
import { ago, Instant, isoInstant, timestamp } from './time';

/** One clock for every <mp-time> on the page, ticking while any is shown. */
@Injectable({ providedIn: 'root' })
export class MpClock {
  readonly now = signal(Date.now());
  private users = 0;
  private timer: ReturnType<typeof setInterval> | undefined;

  attach(destroy: DestroyRef): void {
    if (this.users++ === 0) this.timer = setInterval(() => this.now.set(Date.now()), 1000);
    destroy.onDestroy(() => {
      if (--this.users === 0) clearInterval(this.timer);
    });
  }
}

/**
 * When something happened, as "42s ago" that keeps counting, with the absolute
 * time on hover and in the markup (<time datetime>).
 */
@Component({
  selector: 'mp-time',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `time { white-space: nowrap; }`,
  template: `<time [attr.datetime]="iso()" [title]="absolute()">{{ relative() }}</time>`,
})
export class MpTime {
  readonly value = input.required<Instant>();
  private readonly clock = inject(MpClock);
  protected readonly iso = computed(() => isoInstant(this.value()));
  protected readonly absolute = computed(() => timestamp(this.value()));
  protected readonly relative = computed(() => ago(this.value(), this.clock.now()));

  constructor() {
    this.clock.attach(inject(DestroyRef));
  }
}
