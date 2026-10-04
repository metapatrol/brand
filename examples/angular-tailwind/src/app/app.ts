import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { conditionTone, firstProblem, MpAppShell, MpNavBadge, MpNavGroup, MpShellAccount, MpShellStatus, MpStatus } from '@metapatrol/ng';
import { SERVERS } from './pages/servers-data';

/** The whole frame is one component from @metapatrol/ng; the pages are routes. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MpAppShell, MpShellAccount, MpShellStatus, MpStatus],
  template: `
    <mp-app-shell project="angular-tailwind" [nav]="nav" home="/overview">
      <ng-template mpShellAccount>
        <span class="flex items-center gap-2 rounded-full border border-line bg-surface py-0.5 pr-3 pl-0.5 text-sm">
          <span class="grid size-7 place-items-center rounded-full bg-signal-wash font-mono text-xs text-signal-fg">D</span>
          denis
        </span>
      </ng-template>
      <ng-template mpShellStatus let-collapsed>
        <mp-status status="success">{{ collapsed ? '' : 'healthy' }}</mp-status>
      </ng-template>
      <router-outlet />
    </mp-app-shell>
  `,
})
export class App {
  protected readonly nav: MpNavGroup[] = [
    {
      label: 'deployments',
      items: [
        { path: '/overview', label: 'Overview', icon: 'info' },
        { path: '/servers', label: 'Servers', icon: 'external-link', badge: notReady() },
        { path: '/settings', label: 'Settings', icon: 'menu' },
      ],
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
