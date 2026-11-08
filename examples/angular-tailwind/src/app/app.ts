import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { conditionTone, firstProblem, MpAppShell, MpFooterBar, MpFooterLink, MpNavBadge, MpNavGroup, MpShellAccount, MpShellStatus, MpStatus } from '@metapatrol/ng';
import { SERVERS } from './pages/servers-data';

/** The whole frame is one component from @metapatrol/ng; the pages are routes. */
@Component({
  selector: 'app-root',
  imports: [MpFooterBar, RouterOutlet, RouterLink, MpAppShell, MpShellAccount, MpShellStatus, MpStatus],
  template: `
    <!-- route data picks the frame: bare (the sign-in) stands alone; plain is the other
         shell, the page with the footer bar under it; everything else is the console -->
    @if (frame() === 'bare') {
      <router-outlet />
    } @else if (frame() === 'plain') {
      <div class="flex min-h-dvh flex-col">
        <main id="main" class="flex flex-1 flex-col"><router-outlet /></main>
        <mp-footer-bar project="angular-tailwind" version="0.0.0" [links]="plainLinks" />
      </div>
    } @else {
    <mp-app-shell project="angular-tailwind" [nav]="nav" home="/overview">
      <ng-template mpShellAccount>
        <a
          routerLink="/sign-in"
          [queryParams]="{ signedOut: 1 }"
          title="Sign out"
          class="flex items-center gap-2 rounded-full border border-line bg-surface py-0.5 pr-3 pl-0.5 text-sm text-fg no-underline hover:border-line-strong"
        >
          <span class="grid size-7 place-items-center rounded-full bg-signal-wash font-mono text-xs text-signal-fg">D</span>
          denis
        </a>
      </ng-template>
      <ng-template mpShellStatus let-collapsed>
        <mp-status status="success">{{ collapsed ? '' : 'healthy' }}</mp-status>
      </ng-template>
      <router-outlet />
    </mp-app-shell>
    }
  `,
})
export class App {
  private readonly route = inject(ActivatedRoute);
  /** Which frame the page on screen asks for (route data bare or shell: 'plain'). */
  protected readonly frame = toSignal(
    inject(Router).events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => {
        let r = this.route.snapshot;
        while (r.firstChild) r = r.firstChild;
        return r.data['bare'] ? 'bare' : r.data['shell'] === 'plain' ? 'plain' : 'console';
      }),
    ),
    { initialValue: 'console' },
  );

  protected readonly plainLinks: MpFooterLink[] = [
    { path: '/plain', label: 'Search', exact: true },
    { path: '/plain/usage', label: 'Usage' },
    { path: '/overview', label: 'The console' },
  ];

  protected readonly nav: MpNavGroup[] = [
    {
      label: 'deployments',
      // the "+" beside the label: an action, not a place
      action: { path: '/servers/new', label: 'New server' },
      items: [
        { path: '/overview', label: 'Overview', icon: 'info' },
        { path: '/servers', label: 'Servers', icon: 'external-link', badge: notReady() },
        { path: '/settings', label: 'Settings', icon: 'menu' },
      ],
    },
    {
      label: 'other shells',
      items: [{ path: '/plain', label: 'Plain shell', icon: 'search' }],
    },
  ];
}

/** How many servers are not Valid and Ready: bad when one is at fault itself, warn when all only pass trouble on. */
function notReady(): MpNavBadge {
  const inherited = ['ServerUnavailable'];
  const found = SERVERS.map((s) => ({ name: s.name, c: firstProblem(s.conditions, ['Valid', 'Ready']) })).filter((x) => x.c);
  return {
    count: found.length,
    tone: found.some((x) => conditionTone(x.c, inherited) === 'bad') ? 'bad' : 'warn',
    tip: found.map((x) => `${x.name} · ${x.c?.reason}`).join('\n'),
    label: 'not ready',
  };
}
