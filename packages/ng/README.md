# @metapatrol/ng

Angular components for metapatrol applications. Angular 22, standalone,
signals, OnPush; styled with the tokens of `@metapatrol/style` (no Tailwind
needed, but it works beside it).

```sh
npm install @metapatrol/ng @metapatrol/style
```

`src/styles.css`: `@import "@metapatrol/style/tailwind.css";` (or
`@import "@metapatrol/style";` without Tailwind).

## the shell

The frame of a console, as the engram console has it: a sidebar with the mark,
`metapatrol / <project>` and grouped navigation — folding to icons on a desktop,
opening below the top bar on a phone — the theme switch and a status line at its
foot, the account at the top, and a skip link to the content.

```ts
import { MpAppShell, MpNavGroup, MpShellAccount, MpShellStatus, MpStatus } from '@metapatrol/ng';

@Component({
  imports: [RouterOutlet, MpAppShell, MpShellAccount, MpShellStatus, MpStatus],
  template: `
    <mp-app-shell project="engram" [nav]="nav" home="/overview">
      <ng-template mpShellAccount>…the signed-in user…</ng-template>
      <ng-template mpShellStatus let-collapsed>
        <mp-status status="success">{{ collapsed ? '' : 'healthy' }}</mp-status>
      </ng-template>
      <router-outlet />
    </mp-app-shell>
  `,
})
export class App {
  nav: MpNavGroup[] = [
    { label: 'memory', items: [{ path: '/overview', label: 'Overview', icon: 'info' }] },
  ];
}
```

| slot | |
|---|---|
| `<ng-template mpShellAccount>` | rendered at the top right (desktop) and in the top bar (phone) |
| `<ng-template mpShellStatus let-collapsed>` | the sidebar's foot; `collapsed` says whether it shows icons only |
| `<ng-template mpShellHeader>` | the top bar, left of the account (search, breadcrumbs) |
| content | the page, inside `<main id="mp-main">` |

What the shell and the theme remember (folded sidebar, chosen theme) goes to
`localStorage` under `mp.*`; `provideMetapatrol({ storagePrefix: 'engram' })`
changes the prefix.

## components

| component | |
|---|---|
| `<mp-mark [size]="24">` | the mark, inline; colours follow the theme, the optical size follows `size` (favicon ≤ 16, small ≤ 40, primary above); `label` makes it an image |
| `<mp-namespace project="…">` | `metapatrol / <project>` |
| `<mp-panel index="01" title="…">` | a panel with head, body, `[mpPanelActions]` and `[mpPanelNote]` |
| `<mp-status status="success">` | dot and text: `success`, `warning`, `error`, `info`, `active`, `idle` |
| `<mp-confirm-button danger (confirmed)="…">` | a destructive action in two clicks, Escape takes it back |
| `<mp-code-block [prompt]="true" code="…">` | code or commands with a copy button |
| `<mp-theme-toggle>` | dark ↔ light; `ThemeService` for the state |
| `<mp-icon name="…">` | the built-in Lucide icons; `provideMpIcons({ name: '<path …/>' })` adds more |

Buttons, form fields and tables are plain classes from `@metapatrol/style`
(`mp-btn`, `mp-btn-primary`, `mp-input`, `mp-field-label`, `mp-table`, …), usable
in any template. A working application: `examples/angular-tailwind` in
[metapatrol/brand](https://forgejo.metapatrol.local/metapatrol/brand).

Icons: [Lucide](https://lucide.dev), ISC license. Code: Apache-2.0.
