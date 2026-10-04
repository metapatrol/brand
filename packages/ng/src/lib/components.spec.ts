import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MpCodeBlock } from './code-block';
import { MpConfirmButton } from './confirm-button';
import { MpPanel, MpPanelActions, MpPanelNote } from './panel';
import { MpPageHeader } from './page-header';
import { MpStatus } from './status';

describe('MpConfirmButton', () => {
  it('asks first and emits only on the second click', async () => {
    const fixture = TestBed.createComponent(MpConfirmButton);
    let confirmed = 0;
    fixture.componentInstance.confirmed.subscribe(() => confirmed++);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    el.querySelector('button')!.click();
    await fixture.whenStable();
    expect(el.textContent).toContain('Are you sure?');
    expect(confirmed).toBe(0);
    (el.querySelector('button.mp-btn-danger') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(confirmed).toBe(1);
    expect(el.textContent).not.toContain('Are you sure?');
  });

  it('takes the question back on Escape', async () => {
    const fixture = TestBed.createComponent(MpConfirmButton);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    el.querySelector('button')!.click();
    await fixture.whenStable();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(el.textContent).not.toContain('Are you sure?');
  });
});

describe('MpCodeBlock', () => {
  it('copies the code without the prompts', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const fixture = TestBed.createComponent(MpCodeBlock);
    fixture.componentRef.setInput('code', 'npm ci\nmake build');
    fixture.componentRef.setInput('prompt', true);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.prompt').length).toBe(2);
    el.querySelector('button')!.click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith('npm ci\nmake build');
    expect(el.querySelector('button')?.getAttribute('aria-label')).toBe('Copied');
  });
});

@Component({
  imports: [MpPanel, MpPanelActions, MpPanelNote, MpStatus],
  template: `
    <mp-panel index="02" title="environments">
      <button mpPanelActions class="act">add</button>
      <mp-status status="success">healthy</mp-status>
      <p mpPanelNote class="note">3 of 4</p>
    </mp-panel>
  `,
})
class PanelHost {}

describe('MpPanel and MpStatus', () => {
  it('renders the head, the projected parts and the status', async () => {
    const fixture = TestBed.createComponent(PanelHost);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h2.mp-label')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('02environments');
    expect(el.querySelector('.mp-panel-head .act')).not.toBeNull();
    expect(el.querySelector('.mp-panel-body mp-status')?.getAttribute('data-status')).toBe('success');
    expect(el.querySelector('mp-panel > .note')?.classList).toContain('mp-panel-note');
    expect(el.querySelector('.act')?.classList).toContain('mp-panel-actions');
    expect(el.querySelector('mp-panel')?.getAttribute('aria-label')).toBe('environments');
  });
});

@Component({
  imports: [MpPageHeader],
  template: `
    <mp-page-header class="list" title="Memories" note="1 204" />
    <mp-page-header class="detail" section="Memories" link="/memories" title="01j9zk" mono>
      <button type="button">Delete</button>
    </mp-page-header>
  `,
})
class PageHeaderHost {}

describe('MpPageHeader', () => {
  it('names the page, its section and a note, with its actions beside', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PageHeaderHost);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const list = el.querySelector('.list')!;
    expect(list.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Memories 1 204');
    expect(list.querySelector('a')).toBeNull();
    const detail = el.querySelector('.detail')!;
    expect(detail.querySelector('h1 a')?.getAttribute('href')).toBe('/memories');
    expect(detail.querySelector('.title')?.classList).toContain('mono');
    expect(detail.querySelector('.actions button')?.textContent).toBe('Delete');
  });
});
