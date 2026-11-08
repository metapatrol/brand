import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MpDayBars, MpMeter, shortDay } from './charts';
import { MpFooterBar, MpFrame, MpLockup } from './plain-shell';

@Component({
  imports: [MpFrame, MpFooterBar, MpLockup],
  template: `
    <mp-lockup class="big" project="websearch" size="lg" />
    <mp-frame project="websearch">
      <form mpFrameTop class="box">search</form>
      <p class="page">results</p>
    </mp-frame>
    <mp-footer-bar project="websearch" version="1.2.0" [links]="links">
      <button class="out mp-quiet-link">Sign out</button>
    </mp-footer-bar>
  `,
})
class Host {
  links = [
    { path: '/', label: 'Search', exact: true },
    { path: '/usage', label: 'Usage' },
  ];
}

describe('the plain shell', () => {
  async function render() {
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: '**', children: [] }])] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('frames a page: the lockup leading home, room beside it, the page under it', async () => {
    const el = await render();
    const home = el.querySelector<HTMLAnchorElement>('mp-frame header a')!;
    expect(home.getAttribute('href')).toBe('/');
    expect(home.getAttribute('aria-label')).toBe('websearch: start page');
    expect(home.querySelector('mp-namespace')?.textContent).toBe('metapatrol / websearch');
    expect(el.querySelector('mp-frame header .box')?.textContent).toBe('search');
    expect(el.querySelector('mp-frame .page p.page')?.textContent).toBe('results');
  });

  it('sizes the lockup', async () => {
    const el = await render();
    expect(el.querySelector('mp-lockup.big')?.classList).toContain('lg');
    expect(el.querySelector('mp-frame mp-lockup')?.classList).not.toContain('lg');
  });

  it('puts the version, quiet links, the content and the theme switch in the footer', async () => {
    const el = await render();
    const footer = el.querySelector('mp-footer-bar footer')!;
    expect(footer.querySelector('.version')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('websearch 1.2.0');
    expect([...footer.querySelectorAll('nav a.mp-quiet-link')].map((a) => a.getAttribute('href'))).toEqual(['/', '/usage']);
    expect(footer.querySelector('nav .out')?.textContent).toBe('Sign out');
    expect(footer.querySelector('nav mp-theme-toggle')).not.toBeNull();
  });
});

describe('MpMeter', () => {
  it('fills to the value and turns warning, then error', () => {
    const fixture = TestBed.createComponent(MpMeter);
    const set = (v: number) => {
      fixture.componentRef.setInput('value', v);
      fixture.componentRef.setInput('max', 100);
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('.fill') as HTMLElement;
    };
    expect(set(50).style.width).toBe('50%');
    expect(set(50).className).toBe('fill');
    expect(set(80).classList).toContain('warn');
    expect(set(120).classList).toContain('bad');
    expect(set(120).style.width).toBe('100%');
    expect(fixture.nativeElement.querySelector('[role=meter]')?.getAttribute('aria-valuenow')).toBe('120');
  });
});

describe('MpDayBars', () => {
  it('draws a bar per day, writes the total, the top and the first and last day', () => {
    const fixture = TestBed.createComponent(MpDayBars);
    fixture.componentRef.setInput('label', 'Requests per day');
    fixture.componentRef.setInput('days', ['2026-10-01', '2026-10-02', '2026-10-03']);
    fixture.componentRef.setInput('values', [4, 0, 10]);
    fixture.componentRef.setInput('lighter', [1, 0, 6]);
    fixture.componentRef.setInput('lighterLabel', 'cached');
    fixture.componentRef.setInput('darkerLabel', 'asked');
    fixture.componentRef.setInput('locale', 'en-GB');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('rect.bar').length).toBe(2);
    expect(el.querySelectorAll('rect.light').length).toBe(2);
    expect(el.querySelector('.total')?.textContent).toBe('14');
    expect(el.querySelector('.top')?.textContent).toBe('10');
    expect(el.querySelector('.foot')?.textContent).toContain('1 Oct');
    expect(el.querySelector('.foot')?.textContent).toContain('3 Oct');
    expect(el.querySelector('svg')?.getAttribute('aria-label')).toBe('Requests per day: 14');
  });

  it('writes a UTC day short, without the year', () => {
    expect(shortDay('2026-11-08', 'en-GB')).toBe('8 Nov');
    expect(shortDay(undefined)).toBe('');
  });
});
