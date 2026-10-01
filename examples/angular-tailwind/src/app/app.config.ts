import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideMetapatrol } from '@metapatrol/ng';
import { Overview } from './pages/overview';
import { Settings } from './pages/settings';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      [
        { path: '', pathMatch: 'full', redirectTo: 'overview' },
        { path: 'overview', component: Overview, title: 'overview' },
        { path: 'settings', component: Settings, title: 'settings' },
      ],
      withComponentInputBinding(),
    ),
    // what the shell and the theme remember goes under "example.*"
    provideMetapatrol({ storagePrefix: 'example' }),
  ],
};
