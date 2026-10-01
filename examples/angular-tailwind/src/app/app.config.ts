import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideMetapatrol } from '@metapatrol/ng';
import { Overview } from './pages/overview';
import { Servers } from './pages/servers';
import { Settings } from './pages/settings';
import { routingFeatures } from './routing';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      [
        { path: '', pathMatch: 'full', redirectTo: 'overview' },
        { path: 'overview', component: Overview, title: 'overview' },
        { path: 'servers', component: Servers, title: 'servers' },
        // the detail page brings the code viewer (CodeMirror) and Markdown:
        // loaded when it is opened, not with the application
        { path: 'servers/:name', loadComponent: () => import('./pages/server').then((m) => m.ServerPage), title: 'server' },
        { path: 'settings', component: Settings, title: 'settings' },
      ],
      ...routingFeatures,
    ),
    // what the shell and the theme remember goes under "example.*"
    provideMetapatrol({ storagePrefix: 'example', serviceName: 'the gateway', inheritedReasons: ['ServerUnavailable'] }),
  ],
};
