# @metapatrol/ng

Angular components for metapatrol applications. Angular 22, standalone,
signals, OnPush; styled with the tokens of `@metapatrol/style` (no Tailwind
needed, but it works beside it).

```sh
npm install @metapatrol/ng @metapatrol/style
```

`src/styles.css`: `@import "@metapatrol/style/tailwind.css";` (or
`@import "@metapatrol/style";` without Tailwind).

The components' own defaults on their elements (display, an icon's 1em size)
sit in the `components` layer, so utilities override them:
`<mp-icon class="size-4" …>`, `<mp-notice class="hidden lg:block">`.

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

An item's `badge` counts what needs attention beside its label, e.g. what is
not ready: `{ count: 2, tone: 'bad', tip: 'grep · Unreachable', label: 'not ready' }`
(`tone` `bad`, `warn` by default, `info`, `neutral`; folded, it is a dot on the
icon). Give items an `icon` when the sidebar may fold.

A group's `action` puts a small link beside its label — "+" to make one of its
items: `{ label: 'Projects', action: { path: '/projects/new', label: 'New project' }, items }`
(`icon` is `plus` by default). It is never shown as the current page, follows
the label in reading order, closes the nav on a phone, and is hidden in the
folded sidebar as the labels are; a group without a label shows none. Whether
someone may use it stays the app's: leave `action` out.

What the shell and the theme remember (folded sidebar, chosen theme) goes to
`localStorage` under `mp.*`; `provideMetapatrol({ storagePrefix: 'engram' })`
changes the prefix.

## the sign-in page

A console's sign-in stands alone, without the shell: give its route
`data: { bare: true }` and let the root component render a bare
`<router-outlet />` for such routes instead of `mp-app-shell` (the Angular
example does). The page brings the frame; how the console signs in stays its own.

```html
<mp-sign-in project="soulforge" subtitle="Sign in to the library">
  <button class="mp-btn-primary w-full" (click)="sso()"><mp-icon name="log-in" /> Sign in with SSO</button>
  <mp-sign-in-divider />
  <form (submit)="$event.preventDefault(); submit()">
    <label class="mp-field-label" for="token">Token</label>
    <mp-secret-input inputId="token" [(value)]="token" [invalid]="!!error()" describedBy="token-error" />
  </form>
  <ng-template mpSignInFooter><a class="mp-link" routerLink="/overview">Continue without signing in</a></ng-template>
</mp-sign-in>
```

| part | |
|---|---|
| `<mp-sign-in project subtitle>` | the page: theme switch, mark, `metapatrol / <project>`, a line under it, the content in a panel, `mpSignInFooter` under the panel |
| `<mp-sign-in-divider>` | the "or" between two ways of signing in |
| `<mp-secret-input inputId [(value)]>` | a token or key, hidden as it is typed, with a button to show it (`what` names it for that button) |
| `safeReturnTo(raw, { fallback, exclude })` | the `?returnTo=` to go on to afterwards: a route of the console only — no other origin, no scheme, not the sign-in pages |

## components

| component | |
|---|---|
| `<mp-mark [size]="24">` | the mark, inline; colours follow the theme, the optical size follows `size` (favicon ≤ 16, small ≤ 40, primary above); `label` makes it an image |
| `<mp-namespace project="…">` | `metapatrol / <project>` |
| `<mp-page-header title="Memories" note="1 204">…actions…</mp-page-header>` | the top of a page: the title (after its `section`, linked to `link`, for a page inside one; `mono` for an identifier), a short note beside it, the page's actions on the right |
| `<mp-detail-title section="servers" link="/servers" [name]="…">` | only the title line of a detail page, for a header laid out by the page |
| `<mp-panel index="01" title="…">` | a panel with head, body, `[mpPanelActions]` and `[mpPanelNote]` |
| `<mp-status status="success">` | dot and text: `success`, `warning`, `error`, `info`, `active`, `idle` |
| `<mp-pill tone="ok" [tip]="…">` | a state as a pill: `ok`, `warn`, `bad`, `info`, `neutral`; the tip on hover and focus |
| `[mpTip]="text"` | a tooltip on any element, on hover and keyboard focus (`focusable` for elements that are not), line breaks kept, never clipped by a scroll container |
| `<mp-notice tone="warn">` | what is wrong with the resource on this page, above everything else; tones `warn`, `bad`, `info`, `ok`, and `neutral` for a plain remark |
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
| `<mp-load-state [loading]="…" [error]="…" what="servers">` | a quiet line while loading, the API's own message when it fails, "No server named …" for a 404 (`back` links to the list), "Your token may not read …" for a 403, with `provideMetapatrol({ forbiddenHint })` saying what the token needs |
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
[metapatrol/brand](https://github.com/metapatrol/brand).

Icons: [Lucide](https://lucide.dev), ISC license. Code: Apache-2.0.
