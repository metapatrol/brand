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
    {
      label: 'Operations',
      action: { path: '/system/new', label: 'New system' },
      items: [{ path: '/system', label: 'System', badge: { count: 2, tone: 'bad', tip: 'grep · Unreachable', label: 'not ready' } }],
    },
    // no label, so no action either
    { label: '', action: { path: '/x/new', label: 'New x', icon: 'info' }, items: [{ path: '/x', label: 'X' }] },
  ];
}

function setDesktop(desktop: boolean) {
  window.matchMedia = ((query: string) =>
    ({ matches: desktop && query.includes('min-width'), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
}

async function render() {
  // any path resolves, so following a link in a test does not fail
  TestBed.configureTestingModule({ providers: [provideRouter([{ path: '**', children: [] }])] });
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
    expect([...el.querySelectorAll('.group-label')].map((g) => g.textContent)).toEqual(['Memory', 'Operations', '']);
    expect([...el.querySelectorAll('a.item')].map((a) => a.getAttribute('href'))).toEqual(['/overview', '/recall', '/system', '/x']);
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

  it('counts what needs attention beside an item, and says what', async () => {
    const el: HTMLElement = (await render()).nativeElement;
    const badges = el.querySelectorAll<HTMLElement>('nav .badge');
    expect(badges.length).toBe(1);
    expect(badges[0].getAttribute('data-tone')).toBe('bad');
    expect(badges[0].textContent?.replace(/\s+/g, ' ').trim()).toBe('2 not ready');
  });

  it('puts a group action beside its label: a link, never current, closing the phone nav', async () => {
    const fixture = await render();
    const el: HTMLElement = fixture.nativeElement;
    const actions = [...el.querySelectorAll<HTMLAnchorElement>('a.group-action')];
    expect(actions.length).toBe(1);
    const [action] = actions;
    expect(action.getAttribute('href')).toBe('/system/new');
    expect(action.getAttribute('aria-label')).toBe('New system');
    expect(action.getAttribute('title')).toBe('New system');
    expect(action.closest('.group-head')?.querySelector('.group-label')?.textContent).toBe('Operations');
    expect(action.querySelector('mp-icon')).not.toBeNull();

    setDesktop(false);
    const shell = fixture.debugElement.children[0].componentInstance as MpAppShell;
    shell.navOpen.set(true);
    action.click();
    // the router follows the link; let it finish before the test does
    await fixture.whenStable();
    expect(shell.navOpen()).toBe(false);
    expect(action.classList).not.toContain('active');
  });

  it('has a skip link to the main content', async () => {
    const el: HTMLElement = (await render()).nativeElement;
    expect(el.querySelector('a.skip')?.getAttribute('href')).toBe('#mp-main');
    expect(el.querySelector('main')?.getAttribute('tabindex')).toBe('-1');
  });
});

