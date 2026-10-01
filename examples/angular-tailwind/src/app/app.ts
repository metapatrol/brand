import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MpAppShell, MpNavGroup, MpShellAccount, MpShellStatus, MpStatus } from '@metapatrol/ng';

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
        { path: '/servers', label: 'Servers', icon: 'external-link' },
        { path: '/settings', label: 'Settings', icon: 'menu' },
      ],
    },
  ];
}
