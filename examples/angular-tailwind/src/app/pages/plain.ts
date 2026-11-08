import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MpDayBars, MpFrame, MpIcon, MpLockup, MpMeter } from '@metapatrol/ng';

/**
 * The other shell, for a tool that does one thing: a start page with the
 * large lockup and one field, no sidebar. The root puts mp-footer-bar under
 * every page with route data shell: 'plain'.
 */
@Component({
  selector: 'app-plain-home',
  imports: [MpLockup, MpIcon],
  host: { class: 'flex flex-1 flex-col items-center justify-center px-4 pt-10 pb-[18vh]' },
  template: `
    <h1 class="m-0 mb-10"><span class="sr-only">angular-tailwind</span><mp-lockup project="angular-tailwind" size="lg" aria-hidden="true" /></h1>
    <form class="flex w-full max-w-[40rem] items-center gap-2" role="search" (submit)="$event.preventDefault(); go()">
      <label class="flex flex-1 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2 focus-within:border-signal-fg">
        <mp-icon class="size-5 text-fg-subtle" name="search" />
        <span class="sr-only">Search the usage</span>
        <input class="min-w-0 flex-1 bg-transparent text-md text-fg outline-none" [value]="q()" (input)="q.set($any($event.target).value)" />
      </label>
      <button type="submit" class="mp-btn" [disabled]="!q().trim()">Search</button>
    </form>
    <p class="mt-4 text-xs text-fg-subtle">A start page with one field; the usage page shows the frame.</p>
  `,
})
export class PlainHome {
  private readonly router = inject(Router);
  protected readonly q = signal('');
  protected go(): void {
    void this.router.navigateByUrl('/plain/usage');
  }
}

const days = Array.from({ length: 30 }, (_, i) => new Date(Date.UTC(2026, 9, 10 + i)).toISOString().slice(0, 10));
const requests = days.map((_, i) => Math.max(4, Math.round(40 + 30 * Math.sin(i / 3) + (i % 7 === 5 ? -25 : 0) + i)));
const cached = requests.map((r, i) => Math.round(r * (0.3 + 0.2 * Math.cos(i / 4))));

/** A page of the plain shell: the frame, figures, a chart, a meter. */
@Component({
  selector: 'app-plain-usage',
  imports: [MpFrame, MpDayBars, MpMeter],
  template: `
    <mp-frame project="angular-tailwind" home="/plain">
      <div mpFrameTop class="mp-segmented" role="group" aria-label="Range">
        @for (r of ranges; track r) {
          <button type="button" [attr.aria-pressed]="range() === r" (click)="range.set(r)">{{ r }}</button>
        }
      </div>
      <h1 class="mp-page-title mb-4">Usage</h1>
      <div class="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div class="mp-tile"><span class="mp-tile-value">{{ total() }}</span><span class="mp-tile-label">requests</span><span class="mp-tile-sub">{{ range() }}</span></div>
        <div class="mp-tile"><span class="mp-tile-value">{{ share() }}%</span><span class="mp-tile-label">answered from the cache</span><span class="mp-tile-sub">at no cost</span></div>
        <div class="mp-tile"><span class="mp-tile-value">3</span><span class="mp-tile-label">failed</span><span class="mp-tile-sub">no backend answered</span></div>
        <div class="mp-tile"><span class="mp-tile-value">0</span><span class="mp-tile-label">cost in credit</span><span class="mp-tile-sub">mean latency 412 ms</span></div>
      </div>
      <section class="mp-panel mb-4">
        <mp-day-bars label="Requests per day" [days]="shown().days" [values]="shown().requests" [lighter]="shown().cached" darkerLabel="asked" lighterLabel="cached" />
      </section>
      <section class="mp-panel grid gap-2">
        <div class="flex justify-between text-sm"><span class="text-fg-muted">Requests today</span><span class="tabular-nums">812 of 1 000</span></div>
        <mp-meter [value]="812" [max]="1000" label="Requests today" />
        <p class="m-0 text-xs text-fg-subtle">A warning from three quarters of the quota, an error at it.</p>
      </section>
    </mp-frame>
  `,
})
export class PlainUsage {
  protected readonly ranges = ['7 days', '30 days'];
  protected readonly range = signal('30 days');
  protected readonly shown = computed(() => {
    const n = this.range() === '7 days' ? 7 : 30;
    return { days: days.slice(-n), requests: requests.slice(-n), cached: cached.slice(-n) };
  });
  protected readonly total = computed(() => this.shown().requests.reduce((a, b) => a + b, 0).toLocaleString());
  protected readonly share = computed(() => {
    const s = this.shown();
    return Math.round((100 * s.cached.reduce((a, b) => a + b, 0)) / s.requests.reduce((a, b) => a + b, 0));
  });
}
