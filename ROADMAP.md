# metapatrol brand — roadmap

From a brand identity with generated assets to a set of packages that every
metapatrol project uses: tokens, styles, assets, a project generator and
Angular components.

## decisions

| topic | decision |
|---|---|
| generator | Node.js / TypeScript, run with `npx`; replaced the Python generator (in the Git history up to v0.8.0) |
| styles package | `@metapatrol/style` (not `css`) |
| primary stack | Angular + Tailwind CSS; every package must work in that stack first |
| React | not planned; supported through the framework-agnostic layers, components only when a React app exists |
| source of truth | DTCG token files in `tokens/`; generator, styles and components all read from them |
| package manager | npm workspaces (all metapatrol apps use npm) |
| versions | one version for all published packages, from conventional commits (semantic-release), like the other platform repositories |
| registry | Forgejo npm registry of the `metapatrol` org for now; npmjs (org `metapatrol` exists) later. The registry is never written into a `package.json`, so moving is a configuration change |
| components | shadcn-style: headless primitives + Tailwind classes themed by our tokens (spartan/ui for Angular, shadcn/ui for React) |

## target packages

| package | contents | depends on |
|---|---|---|
| `@metapatrol/tokens` | the `tokens/` source (DTCG) and generated CSS custom properties, SCSS, TS, JSON | – |
| `@metapatrol/style` | fonts, light/dark themes, base styles, Tailwind v4 theme, shadcn/spartan variable mapping, SCSS API | tokens |
| `@metapatrol/brand` | generated SVG/PNG/ICO assets, no runtime code | – |
| `@metapatrol/brand-kit` | CLI: builds the brand assets and per-project assets (`npx @metapatrol/brand-kit …`) | tokens |
| `@metapatrol/ng` | Angular components: logo, app shell, metapatrol-specific UI | style, brand |
| `@metapatrol/react` | React counterpart of `ng`, **only when needed** | style, brand |

Layering rule: everything below `ng` / `react` is framework-agnostic. A React
app gets the full look from `style` + Tailwind + shadcn/ui without a single
metapatrol React component.

## repository layout (target)

```
brand/
  packages/
    tokens/        @metapatrol/tokens     (tokens/: DTCG source and contrast rules)
    style/         @metapatrol/style
    brand/         @metapatrol/brand      (output of brand-kit)
    brand-kit/     @metapatrol/brand-kit  (cli)
    ng/            @metapatrol/ng         (ng-packagr)
    react/         @metapatrol/react      (later)
  examples/
    angular-tailwind/   Angular 22 + Tailwind 4
    react-tailwind/     React 19 + Vite + Tailwind 4 + shadcn mapping
  apps/
    preview/       the brand as a static site (Angular + Tailwind), replaced the brand sheet
  identity/        brand identity document
```

Every published package except `@metapatrol/brand` is Apache-2.0. The `repository`
field is added once the public repository URL exists (the forge is internal).

Tooling: npm workspaces, semantic-release for versions and the changelog, `tsc`
(TypeScript 7) for plain TS packages, `node --test` running the TypeScript
sources directly (type stripping, `@metapatrol/source` export condition), ng-packagr
for the Angular library.

---

## phase 0 — foundation

- [x] Light theme proposed: white / `#F4F6F8` / `#E6EDF3` surfaces, graphite text,
      petrol `#00707F` as signal for text, links and focus rings (cyan stays the fill),
      darker status colours for text on light. Preview: `packages/tokens/preview/index.html`.
- [x] Semantic roles: `bg`, `surface`, `surface-2`, `line`, `line-strong`, `fg`,
      `fg-muted`, `fg-subtle`, `signal`, `signal-fg`, `on-signal`, `signal-wash`,
      `success`, `warning`, `error`, `info`, `mark.structure`, `mark.signal`; plus font,
      size, weight, tracking, radius and the mark's construction parameters.
- [x] Token source in `packages/tokens/tokens/` (DTCG): `primitives`, `base`, `theme.dark`, `theme.light`,
      and `contrast.json` with the WCAG rules both themes must meet (50 pairs, all pass).
- [x] Monorepo: npm workspaces, Changesets at first (replaced by semantic-release after 0.1.0),
      Forgejo CI (`.forgejo/workflows/ci.yml`: install, contrast check, build, test).
      `@metapatrol/tokens` exists as a private package holding the check.
- [x] Light theme and token names agreed (2026-09-28).
- [x] `metapatrol` organisation created on npmjs.
- [x] Registry decided: Forgejo npm registry first, npmjs later (see *registry* below).
- [x] Licences: code under Apache-2.0 (`LICENSE`, section 6 excludes the marks);
      brand assets all rights reserved (`packages/brand/LICENSE.md`), use per `TRADEMARKS.md`;
      fonts stay under the OFL.
- [x] Colour section of the identity document points to `tokens/` as the source
      and documents both themes.

Done when: the tokens are agreed and CI is green on the forge.

Release flow — **in place**, in the shape of platform/mcp-gateway (see
`.forgejo/README.md`): semantic-release on main decides one version for all five
packages from the conventional commits, commits changelog and versions, tags
`vX.Y.Z` and dispatches `release.yml`, which publishes the packages, creates the
Forgejo release with the assets as a zip, and deploys the brand site and the
assets. Replaced the first flow (Changesets, per-package versions, everything in
`main.yml`) after 0.1.0.

### registry

Now: the Forgejo npm registry of the `metapatrol` organisation,
`https://forgejo.metapatrol.local/api/packages/metapatrol/npm/`.

- Publishing: `main.yml` writes a job-local `.npmrc` with the registry and
  `AUTOMATION_TOKEN` (needs the `write:package` scope). No new secret.
- Consuming (apps and their CI), one line per project plus a read token if the
  organisation's packages are not public:
  ```
  @metapatrol:registry=https://forgejo.metapatrol.local/api/packages/metapatrol/npm/
  ```
- Private CA: trust it with `NODE_EXTRA_CA_CERTS` (or npm's `cafile`), not with
  `NODE_TLS_REJECT_UNAUTHORIZED=0`, which switches TLS verification off for the
  whole process.
- Also GitHub Packages, since 0.6.1: the GitHub mirror publishes every release
  tag that reaches it (`.github/workflows/packages.yml`), so the forge holds no
  GitHub token. For builds outside the network — the consoles' GitHub mirrors,
  which read the packages with their `GITHUB_TOKEN` once the package grants them
  Actions access. Its npm registry still wants a token even for reading, which is
  what npmjs would remove.

Later, npmjs: the same package names and versions; `main.yml` gets `NPM_TOKEN`
instead of the Forgejo registry, and each consumer drops its `.npmrc` line. The
versions published on Forgejo up to then can be published to npmjs unchanged.
Trigger: the first user outside the forge.

## phase 1 — TypeScript generator (`@metapatrol/brand-kit`)

Port of the Python generator, with no system dependencies:

| python | node |
|---|---|
| lattice geometry, inset, rounded paths | plain TS |
| HarfBuzz + fontTools (wordmark outlines, kerning) | `fontkit` (layout incl. GPOS kerning, glyph paths) |
| Inkscape (PNG export) | `@resvg/resvg-js` |
| ImageMagick (ICO) | small ICO writer (PNG-in-ICO) |
| hard-coded colours | read from `@metapatrol/tokens` |

- [x] CLI: `brand-kit build [--out dir]` writes the full asset tree: 35 SVG,
      46 PNG/ICO. The build is byte-reproducible.
- [x] Parity: `npm run parity -w @metapatrol/brand-kit -- <ref>` compares pixel by
      pixel and coordinate by coordinate. All 35 documents match the Python output;
      coordinates within one unit of the last printed digit (Python and JavaScript
      round exact halves differently), glyph edges of the wordmark differ in at most
      0.03 % of pixels (anti-aliasing of the same outlines).
- [x] Colours and construction parameters read from `@metapatrol/tokens`.
- [x] Fonts shipped inside `@metapatrol/brand-kit` (OFL); no network access at build time.
- [x] `@metapatrol/brand` (`packages/brand/`) holds the generated, committed assets,
      `LICENSE.md`, `TRADEMARKS.md` and `"license": "SEE LICENSE IN LICENSE.md"`.
      CI fails when they are out of date.
- [x] Python generator kept in `archive/python-generator/` until the port matched it;
      repository moved to the target layout (`identity/`). The archive — v1 icon, v3
      drafts, the static brand sheet, the Python generator — went after 0.8.0: the
      identity is v3.1, the brand site replaced the sheet, and Git keeps the rest.
- [x] Tests: lattice rules (every edge vertical or ±30°, points inside the hexagon,
      signal panel proportions), inset, determinism, ICO structure, complete build.
- [x] Release flow for `brand-kit` and `brand` (`main.yml`); first publish happens with the first merge to main.

Done when: `npx @metapatrol/brand-kit build` on a clean machine reproduces all
assets and the parity tests pass. Everything except the `npx` part (needs a
published package) is done.

## phase 2 — `@metapatrol/tokens` and `@metapatrol/style`

- [x] `tokens`: `tokens.css` (custom properties, dark + light), `_tokens.scss`
      (theme maps + base variables), `tokens.json` (resolved per theme) and the TS API.
      Own emitters instead of Style Dictionary: the resolver already existed, and
      Style Dictionary needs one build per theme for what is ~60 lines here.
- [x] `style`: self-hosted Inter (400–700) and JetBrains Mono (400/500/700) via `@fontsource`.
- [x] Theme switching: `data-theme="dark|light"` on any element, `prefers-color-scheme`
      as default, dark as fallback.
- [x] Tailwind v4 entry `@metapatrol/style/tailwind.css` (includes `@import "tailwindcss"`):
      `@theme inline` generated from the tokens (utility name = token name), default
      palette removed (no metapatrol app uses it), dense type scale, radii, `dark:` and
      `light:` variants following the token rule. `tailwind-theme.css` for apps that
      import Tailwind themselves.
- [x] shadcn/spartan mapping `@metapatrol/style/shadcn.css`; new contrast rule for text
      on the error fill (destructive buttons). 52 contrast pairs, all pass.
- [x] Base layer: typography, links, focus rings, selection, placeholders, code, tables,
      scrollbars.
- [x] Patterns: `mp-panel`, `mp-label`, `mp-chip`, `mp-status`, `mp-kv`, `mp-namespace`.
- [x] Sass API `@metapatrol/style/scss`: `color()`, `raw()`, `theme()`, `label`, `panel`.
- [x] Tests compile real Tailwind (through `@tailwindcss/postcss`, as Angular does) and
      Sass against the built package: utilities, palette removal, variants, shadcn names,
      font URLs resolving to files, Sass API.
- [x] Checked on a copy of steward/ui (Angular 22, Tailwind 4.3): one dependency, one
      changed import, the build bundles fonts, tokens and patterns.
- [x] No Tailwind v3 preset: every Tailwind app already uses v4.

Done when: an existing Angular + Tailwind app switches to metapatrol look by
adding one dependency and one import. **Done for the integration.** The visual
switch of an existing app still means replacing its own colour variables in its
components (steward keeps its brass palette until then); see *products with their
own look* below.

## phase 3 — project blueprint

Per-project assets from the same generator (`@metapatrol/brand-kit`):

- [x] `brand-kit project [--name] [--purpose] [--out]`:
  - project lockup `[mark] metapatrol / <name>` (Inter + JetBrains Mono at 90 %), four
    colourways, SVG + PNG
  - social preview 1280×640: lockup, purpose (wrapped, at most three lines), the
    lattice fading in from the right; long names shrink to fit
  - favicon set: adaptive SVG, ICO, apple-touch icon, 192/512 icons (maskable), web manifest
  - README header (`<picture>` light/dark, purpose)
- [x] `brand-kit init [--dir]`: `metapatrol.json` (name and purpose; later runs need no
      flags), the assets in `.metapatrol/`, README skeleton and CONTRIBUTING only where
      none exist — hand-written files are never overwritten. Name from flags,
      `metapatrol.json`, `package.json`, `go.mod` or the directory; validated.
- [x] Written for the GitHub mirror (0.8.0), the way forgejo-github-bridge presents
      itself: the header with the purpose in bold, release and licence badges and a
      line of links; the skeleton why · how it works · features · quick start ·
      contributing · licence; CONTRIBUTING (Forgejo, mirror, bridge) and SECURITY.md;
      `github` and `license` in `metapatrol.json`. Nothing links into the private network.
- [x] Brand levels in the identity document (section 3): 0 repository, 1 tool with a
      UI, 2 product with its own icon (exception, derived from the lattice).
- [x] Tried on copies of steward and mcp-gateway.
- [x] Two existing repositories use it: engram, and forgejo-github-bridge (which gave
      up its own logo for the project lockup). forge-operator followed, in its
      `develop` until its next release.

Still open: mcp-gateway's README is not on the blueprint yet (its console is; it has no
logo of its own any more), and steward keeps its own palette — a level-2 decision, or
it moves to the project lockup.

**Done**: engram and forgejo-github-bridge use the generated assets and README structure.

## phase 4 — `@metapatrol/ng`

Angular 22 library (ng-packagr, standalone, signals, OnPush), tested with Angular's
Vitest runner. The engram console was the reference: its shell, theme service,
confirm button and utilities were in use there first.

- [x] `mp-app-shell`: sidebar with mark, namespace and grouped navigation, folding to
      icons on a desktop (remembered), opening below the top bar on a phone, theme
      switch and status at its foot, account at the top, skip link; slots
      `mpShellAccount`, `mpShellStatus`, `mpShellHeader`. Component styles on the
      `--mp-*` variables, so it needs no Tailwind (which does not scan node_modules).
- [x] `mp-mark`: the mark inline, coloured by the theme (`mp-mark-structure`/`-signal`),
      optical size chosen from the rendered size; generated from `@metapatrol/brand`.
- [x] `mp-namespace`, `mp-panel` (+ `mpPanelActions`, `mpPanelNote`), `mp-status`,
      `mp-confirm-button`, `mp-code-block`, `mp-theme-toggle`, `ThemeService`,
      `mp-icon` (built-in Lucide set, `provideMpIcons` for more), `provideMetapatrol`.
- [x] `@metapatrol/style` gained the plain controls: `mp-btn` (+ primary, danger,
      ghost), `mp-input`, `mp-field-label`, `mp-field-error`, `mp-panel-head`/`-body`/
      `-note`, `mp-page-title`, `mp-link`, `mp-table`.
- [x] `examples/angular-tailwind` is built on the shell (overview, a list, a detail page, settings); `apps/preview`
      uses the mark, code blocks and panels, and shows the components.
- [x] Released with the other packages in one version.
- [x] engram moves from its own shell to `mp-app-shell` (engram 1.5.0).
- [x] What engram and mcp-gateway each had a copy of, merged: `mpQueryParams`,
      `mp-sort` and the sort/search functions, `mp-list-search`, `mp-time` and the time
      formats, `mp-load-state` and `describeError`, `count`/`plural`/`bytes`.
- [x] From mcp-gateway, for every operator console: `mp-conditions`/`mp-condition`
      (with inherited reasons as warnings), `mp-pill`, `mp-notice`, `mp-id`,
      `mp-detail-title`.
- [x] Separate entry points with optional peers: `@metapatrol/ng/code-viewer`
      (CodeMirror, JSON and YAML) and `@metapatrol/ng/markdown` (markdown-it).
- [x] engram and mcp-gateway replace their copies with the library (engram 1.5.0,
      mcp-gateway 1.10.0, which also moved to the metapatrol look). What the move showed
      went back into the library:
  - 0.5.0: component defaults in the `components` layer, so utilities on the element
    win; `mp-notice` tones `ok` and `neutral`; `mp-load-state` for a 403
    (`forbiddenHint`), a 404 without a name, and a way back
  - 0.6.0: `mpTip` (pills and conditions explain themselves on keyboard focus too),
    counts on navigation items, RFC 9457 problem details in `describeError`, condition
    helpers that keep the caller's type
  - 0.7.0: `mp-page-header`, the top of a page, from engram
- [ ] Next when two apps need them: toasts, empty state, form field wrapper.

**Done**: engram and mcp-gateway run on `@metapatrol/ng`, and the brand site is live.

## phase 5 — React (on demand)

Trigger: the first React application.

- [ ] `@metapatrol/react` with the same components as `ng` (logo, app shell,
      metapatrol-specific components), built on the same `style` classes.
- [ ] shadcn/ui as the generic set, themed through the phase-2 mapping.
- [ ] Shared visual tests between `ng` and `react` (screenshots of the docs pages).

Until then React is supported through `tokens`, `style`, the Tailwind theme,
the shadcn mapping and `@metapatrol/brand`.

---

## open questions

| question | status |
|---|---|
| public npmjs or Forgejo registry (or both) | **answered**: Forgejo, and GitHub Packages from the GitHub mirror since 0.6.1; npmjs later; see *registry* in phase 0 |
| are the org's Forgejo packages readable without a token? | **answered**: no (401 without one); consumers read with a token, CI with `AUTOMATION_TOKEN` |
| Tailwind v3 still in use anywhere? | **answered**: no. steward and timemachine-go use Tailwind 4.3; eventstore-ui and timemachine-ui use none. v4 only |
| Angular version range to support | Angular 22 (steward, timemachine-go) and 19 (eventstore-ui, timemachine-ui) are in use. Default: 22 and later; the 19 apps get `style` without `ng` until they upgrade |
| Angular Material | used by timemachine-ui (Angular 19). Default: no Material mapping; revisit if that app adopts the brand |
| products with their own look | mcp-gateway gave up its own (IBM Plex, blue) for the metapatrol look in 1.10.0. steward keeps its palette (brass accent, Archivo/Spectral) until decided: a product accent, or signal cyan |
| light theme's subtle text at 4.5:1 | open: `fg-subtle` meets the 3:1 the tokens require; engram overrides it to 4.5:1 (`#5f6b78`) for small text. Raise the token, or keep the rule |
| exact light-theme values | **answered**: agreed 2026-09-28, see `tokens/` |
| docs site hosting | **answered**: the Garage bucket `brand` at https://brand.metapatrol.local (behind the forge's login), with the shell preview at `/shell/` and the assets at `/assets/<version>/` |
