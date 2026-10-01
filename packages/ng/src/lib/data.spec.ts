import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideMetapatrol } from './config';
import { MpId } from './id';
import { MpListSearch } from './list-search';
import { MpLoadState } from './load-state';
import { MpCondition, MpConditions } from './pill';
import { MpSort } from './sort';
import { MpTime, MpClock } from './time-component';

@Component({
  imports: [MpSort],
  template: `<table><thead><tr>
    <th class="name"><mp-sort key="name" [sort]="sort()">name</mp-sort></th>
    <th class="size"><mp-sort key="size" [sort]="sort()">size</mp-sort></th>
  </tr></thead></table>`,
})
class SortHost {
  sort = signal<string | undefined>(undefined);
}

describe('MpSort', () => {
  it('sorts through ?sort=, resets the cursor and marks the header cell', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/?cursor=abc&q=x');
    const fixture = TestBed.createComponent(SortHost);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('th.name')?.getAttribute('aria-sort')).toBe('ascending');
    (el.querySelector('th.size button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(router.url).toBe('/?q=x&sort=size');
    fixture.componentInstance.sort.set('size');
    await fixture.whenStable();
    expect(el.querySelector('th.size')?.getAttribute('aria-sort')).toBe('ascending');
    expect(el.querySelector('th.name')?.hasAttribute('aria-sort')).toBe(false);
  });
});

describe('MpListSearch', () => {
  it('writes the query to ?q= and shows how many rows remain', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/?page=3');
    const fixture = TestBed.createComponent(MpListSearch);
    fixture.componentRef.setInput('shown', 2);
    fixture.componentRef.setInput('total', 9);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const input = el.querySelector('input')!;
    input.value = 'mem';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(router.url).toBe('/?q=mem');
    expect(el.textContent).toContain('2 of 9');
    expect(el.querySelector('label')?.getAttribute('for')).toBe(input.id);
  });
});

describe('MpTime', () => {
  afterEach(() => vi.useRealTimers());

  it('shows how long ago, the absolute time on hover, and keeps counting', () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-01T12:00:40Z') });
    const fixture = TestBed.createComponent(MpTime);
    fixture.componentRef.setInput('value', '2026-10-01T12:00:00Z');
    // whenStable() waits on timers itself, which fake timers never run
    fixture.detectChanges();
    const time: HTMLTimeElement = fixture.nativeElement.querySelector('time');
    expect(time.getAttribute('datetime')).toBe('2026-10-01T12:00:00.000Z');
    expect(time.textContent).toBe('40s ago');
    expect(time.title).not.toBe('');
    vi.advanceTimersByTime(30_000);
    fixture.detectChanges();
    expect(time.textContent).toBe('1m ago');
    fixture.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('shares one clock', () => {
    expect(TestBed.inject(MpClock)).toBe(TestBed.inject(MpClock));
  });
});

describe('MpLoadState', () => {
  function render(inputs: Record<string, unknown>) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideMetapatrol({ serviceName: 'engram', forbiddenHint: 'The console needs the engram:admin scope.' }),
      ],
    });
    const fixture = TestBed.createComponent(MpLoadState);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('says it is loading, quietly', () => {
    expect(render({ loading: true }).textContent).toContain('Loading…');
  });

  it("explains a failure in the API's words and names the service when unreachable", () => {
    const el = render({ what: 'memories', error: new HttpErrorResponse({ status: 0 }) });
    expect(el.querySelector('[role=alert]')?.textContent).toContain('The memories could not be loaded.');
    expect(el.textContent).toContain('engram is not reachable');
  });

  it('says plainly what does not exist', () => {
    const el = render({ what: 'server', name: 'grep', error: new HttpErrorResponse({ status: 404 }) });
    expect(el.textContent).toContain('No server named grep.');
  });

  it('says what is missing without a name, and leads back to the list', () => {
    const el = render({ what: 'job', back: '/queue', error: new HttpErrorResponse({ status: 404 }) });
    expect(el.textContent).toContain('No job found.');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/queue');
  });

  it('says what the token lacks for a 403', () => {
    const el = render({ what: 'memories', error: new HttpErrorResponse({ status: 403 }) });
    expect(el.textContent).toContain('Your token may not read memories.');
    expect(el.textContent).toContain('engram:admin');
  });

  it('shows nothing once loaded', () => {
    expect(render({ loading: false }).textContent?.trim()).toBe('');
  });
});

describe('MpCondition and MpConditions', () => {
  it('colours a condition by its tone and explains it on hover', async () => {
    TestBed.configureTestingModule({ providers: [provideMetapatrol({ inheritedReasons: ['ServerUnavailable'] })] });
    const fixture = TestBed.createComponent(MpCondition);
    fixture.componentRef.setInput('condition', { type: 'Ready', status: 'False', reason: 'ServerUnavailable', message: 'grep is down' });
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.getAttribute('data-tone')).toBe('warn');
    expect(el.classList).toContain('mp-pill');
    expect(el.textContent?.replace(/\s+/g, ' ').trim()).toBe('Ready ServerUnavailable');
    expect(el.getAttribute('title')).toContain('grep is down');
  });

  it('lists conditions with their age, or says none were reported', async () => {
    const fixture = TestBed.createComponent(MpConditions);
    fixture.componentRef.setInput('conditions', [{ type: 'Ready', status: 'True', reason: 'Serving', lastTransitionTime: '2026-10-01T10:00:00Z' }]);
    fixture.componentRef.setInput('observedGeneration', 3);
    fixture.componentRef.setInput('generation', 4);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('tbody tr').length).toBe(1);
    expect(el.querySelector('mp-condition')?.getAttribute('data-tone')).toBe('ok');
    expect(el.querySelector('mp-time time')).not.toBeNull();
    expect(el.textContent).toContain('observed generation 3 of 4');
    fixture.componentRef.setInput('conditions', []);
    await fixture.whenStable();
    expect(el.textContent).toContain('Not reported yet.');
  });
});

describe('MpId', () => {
  it('shortens, shows the whole value on hover and copies it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const fixture = TestBed.createComponent(MpId);
    fixture.componentRef.setInput('value', 'sha256:3f2a9c1e0b7d55aa66bb77cc');
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('code')?.textContent).toBe('sha256:3f2a9c1e0b7d');
    expect(el.querySelector('code')?.getAttribute('title')).toBe('sha256:3f2a9c1e0b7d55aa66bb77cc');
    el.querySelector('button')!.click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith('sha256:3f2a9c1e0b7d55aa66bb77cc');
  });
});
