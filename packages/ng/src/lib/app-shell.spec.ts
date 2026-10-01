import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MpAppShell, MpNavGroup, MpShellAccount, MpShellStatus } from './app-shell';

@Component({
  imports: [MpAppShell, MpShellAccount, MpShellStatus],
  template: `
    <mp-app-shell project="engram" [nav]="nav">
      <ng-template mpShellAccount><span class="who">denis</span></ng-template>
      <ng-template mpShellStatus let-collapsed><span class="health">{{ collapsed ? 'folded' : 'healthy' }}</span></ng-template>
      <p class="page">content</p>
    </mp-app-shell>
  `,
})
class Host {
  nav: MpNavGroup[] = [
    { label: 'Memory', items: [{ path: '/overview', label: 'Overview', icon: 'info' }, { path: '/recall', label: 'Recall' }] },
    { label: 'Operations', items: [{ path: '/system', label: 'System' }] },
  ];
}

function setDesktop(desktop: boolean) {
  window.matchMedia = ((query: string) =>
    ({ matches: desktop && query.includes('min-width'), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
}

async function render() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  return fixture;
}

describe('MpAppShell', () => {
  beforeEach(() => {
    localStorage.clear();
    setDesktop(true);
  });

  it('renders the namespace, the grouped navigation and the projected content', async () => {
    const el: HTMLElement = (await render()).nativeElement;
    expect(el.querySelector('mp-namespace')?.textContent).toBe('metapatrol / engram');
    expect([...el.querySelectorAll('.group-label')].map((g) => g.textContent)).toEqual(['Memory', 'Operations']);
    expect([...el.querySelectorAll('a.item')].map((a) => a.getAttribute('href'))).toEqual(['/overview', '/recall', '/system']);
    expect(el.querySelector('main#mp-main .page')?.textContent).toBe('content');
  });

  it('renders the account in both places and the status with its context', async () => {
    const fixture = await render();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.who').length).toBe(2);
    expect(el.querySelector('.health')?.textContent).toBe('healthy');
  });

  it('folds the sidebar on a desktop and remembers it', async () => {
    const fixture = await render();
    const shell = fixture.debugElement.children[0]!.componentInstance as MpAppShell;
    shell.toggleSidebar();
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.shell')?.classList).toContain('collapsed');
    expect(localStorage.getItem('mp.sidebar.collapsed')).toBe('1');
    expect(el.querySelector('.health')?.textContent).toBe('folded');
    expect(el.querySelector('button.mark')?.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the navigation on a phone and closes it with Escape', async () => {
    setDesktop(false);
    const fixture = await render();
    const shell = fixture.debugElement.children[0]!.componentInstance as MpAppShell;
    shell.toggleSidebar();
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('nav')?.classList).toContain('open');
    expect(localStorage.getItem('mp.sidebar.collapsed')).toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(el.querySelector('nav')?.classList).not.toContain('open');
  });

  it('has a skip link to the main content', async () => {
    const el: HTMLElement = (await render()).nativeElement;
    expect(el.querySelector('a.skip')?.getAttribute('href')).toBe('#mp-main');
    expect(el.querySelector('main')?.getAttribute('tabindex')).toBe('-1');
  });
});

