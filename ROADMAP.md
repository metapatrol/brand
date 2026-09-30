# metapatrol brand — roadmap

From a brand identity with generated assets to a set of packages that every
metapatrol project uses: tokens, styles, assets, a project generator and
Angular components.

## decisions

| topic | decision |
|---|---|
| generator | Node.js / TypeScript, run with `npx`; replaced the Python generator (`archive/python-generator/`) |
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
  archive/         v1 icon, v3 drafts, static brand sheet, python generator
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
`.forgejo/README.md`): semantic-release on main decides one version for all four
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
- Not GitHub Packages: its npm registry requires a token even to install public
  packages, the scope must match a GitHub owner, and publishing from Forgejo would
  need a GitHub token in the forge.

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
- [x] Python generator in `archive/python-generator/` (still runnable, writes to `out/`);
      repository moved to the target layout (`identity/`, `archive/`).
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

Per-project assets from the same generator:

- [ ] `npx @metapatrol/brand-kit project <name> --purpose "<one sentence>"` generates:
  - project lockup `[mark] metapatrol / <name>` (Inter + JetBrains Mono), all colourways, SVG + PNG
  - GitHub social preview 1280×640 PNG
  - favicon set (adaptive SVG, ICO, apple-touch icon, web manifest icons)
  - README header snippet (`<picture>` light/dark)
- [ ] `npx @metapatrol/brand-kit init` in an existing repo: adds README skeleton
      (purpose, architecture, scope and non-goals, build and test, licence),
      CONTRIBUTING, brand assets and a `metapatrol.json` with name and purpose,
      so later runs need no arguments.
- [ ] Brand levels documented in the identity document:
      level 0 repository, level 1 tool with UI, level 2 product with its own icon
      (derived from the lattice, no new colours; only when a real case appears).

Done when: two existing repositories use the generated assets and README structure.

## phase 4 — `@metapatrol/ng`

Angular library, standalone components, signals, OnPush, SSR-safe.

- [ ] `mp-logo`: mark / lockup, picks the optical size (favicon / small / primary)
      and colourway from size and theme.
- [ ] `mp-app-shell`: header with `metapatrol / <project>`, navigation slot,
      theme toggle.
- [ ] metapatrol-specific components: panel with section label, status indicator,
      key-value / metadata table, code and terminal block with copy button, empty state.
- [ ] spartan/ui as the recommended set for generic components (button, dialog,
      select, menu, …), themed through `style`; no own implementations of these.
- [x] `apps/preview`: the brand as a static site built from the packages (Angular 22 +
      Tailwind 4 + `@metapatrol/style`); replaced the static brand sheet. Relative base,
      works from any path; tokens table and downloads are generated from the packages.
      Becomes the component showcase once `@metapatrol/ng` exists.
- [x] `examples/angular-tailwind` and `examples/react-tailwind` as workspaces, built by CI.
- [ ] Rule: a component enters the library only when two apps need it.

Done when: one production Angular app uses `@metapatrol/ng` and the docs site is live.

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
| public npmjs or Forgejo registry (or both) | **answered**: Forgejo now, npmjs later; see *registry* in phase 0 |
| are the org's Forgejo packages readable without a token? | open; decides whether consumers need a read token in CI |
| Tailwind v3 still in use anywhere? | **answered**: no. steward and timemachine-go use Tailwind 4.3; eventstore-ui and timemachine-ui use none. v4 only |
| Angular version range to support | Angular 22 (steward, timemachine-go) and 19 (eventstore-ui, timemachine-ui) are in use. Default: 22 and later; the 19 apps get `style` without `ng` until they upgrade |
| Angular Material | used by timemachine-ui (Angular 19). Default: no Material mapping; revisit if that app adopts the brand |
| products with their own look | steward has its own palette (brass accent, Archivo/Spectral). Decide before phase 3 whether products may keep a product accent or move to signal cyan |
| exact light-theme values | **answered**: agreed 2026-09-28, see `tokens/` |
| docs site hosting | static build on the existing forge pages / CDN |
