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
| `<mp-detail-title section="servers" link="/servers" [name]="…">` | where the page is and what it is, in one line |
| `<mp-panel index="01" title="…">` | a panel with head, body, `[mpPanelActions]` and `[mpPanelNote]` |
| `<mp-status status="success">` | dot and text: `success`, `warning`, `error`, `info`, `active`, `idle` |
| `<mp-pill tone="ok">` | a state as a pill: `ok`, `warn`, `bad`, `info`, `neutral` |
| `<mp-notice tone="warn">` | what is wrong with the resource on this page, above everything else |
| `<mp-confirm-button danger (confirmed)="…">` | a destructive action in two clicks, Escape takes it back |
| `<mp-code-block [prompt]="true" code="…">` | code or commands with a copy button |
| `<mp-id [value]="digest">` | an identifier shortened (`sha256:3f2a9c1e0b7d`), whole on hover, one click to copy |
| `<mp-time [value]="iso">` | "42s ago" that keeps counting, absolute on hover, `<time datetime>` |
| `<mp-theme-toggle>` | dark ↔ light; `ThemeService` for the state |
| `<mp-icon name="…">` | the built-in Lucide icons; `provideMpIcons({ name: '<path …/>' })` adds more |

## lists and data

What the engram and mcp-gateway consoles each had their own copy of:

| | |
|---|---|
| `mpQueryParams()` | sets query parameters, keeping the others: what a page shows survives a reload and can be linked |
| `<mp-list-search [query]="q()" [shown]="…" [total]="…">` | the search above a list, bound to `?q=` |
| `<mp-sort key="size" [sort]="sort()">` | a sortable column header through `?sort=`, with `aria-sort`; resets `cursor`/`page` |
| `parseSort`, `formatSort`, `sortRows`, `searchRows` | numbers as numbers, text naturally (`agent-2` before `agent-10`), missing values last, stable |
| `<mp-load-state [loading]="…" [error]="…" what="servers">` | a quiet line while loading, the API's own message when it fails, "No server named …" for a 404 |
| `describeError(err)`, `isNotFound(err)` | one line for an error; `provideMetapatrol({ serviceName })` names the backend when it does not answer |
| `<mp-conditions [conditions]="status.conditions">`, `<mp-condition>` | Kubernetes conditions: True ok, Unknown neutral, False bad — or a warning when its reason only passes on a dependency's trouble (`provideMetapatrol({ inheritedReasons })`) |
| `findCondition`, `conditionRank`, `healthy`, `firstProblem` | the same rules for code |
| `ago`, `timestamp`, `duration`, `span`, `count`, `plural`, `bytes`, `shortId` | the formats behind the components |

With the router's `withComponentInputBinding()`, `?q=` and `?sort=` arrive as inputs:
`readonly q = input<string>(); readonly sort = input<string>();`.

## separate entry points

They bring their own dependencies, which are optional peers of this package:
install them only where you import the entry point.

| import | | install |
|---|---|---|
| `@metapatrol/ng/code-viewer` | `<mp-code-viewer language="yaml" [value]="manifest">`: JSON or YAML read-only, highlighted in the brand's roles, foldable, searchable | `@codemirror/{state,view,language,commands,search,lang-json,lang-yaml} @lezer/highlight` |
| `@metapatrol/ng/markdown` | `<mp-markdown [source]="text">`, `renderMarkdown()`, `markdownPreview()`: HTML escaped, unsafe links refused, links open without opener | `markdown-it` |

Load the pages that use them lazily (`loadComponent`): in the example, the code
viewer and Markdown are a 459 kB chunk that the first page does not need.

Buttons, form fields and tables are plain classes from `@metapatrol/style`
(`mp-btn`, `mp-btn-primary`, `mp-input`, `mp-field-label`, `mp-table`, …), usable
in any template. A working application: `examples/angular-tailwind` in
[metapatrol/brand](https://forgejo.metapatrol.local/metapatrol/brand).

Icons: [Lucide](https://lucide.dev), ISC license. Code: Apache-2.0.
