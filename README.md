# metapatrol brand

The metapatrol identity as code: the mark constructed on an isometric lattice,
the colour tokens with a light and a dark theme, the styles every metapatrol
application uses, and the generated assets — published as npm packages, and as
a static site with every file for download.

- **Brand site:** https://brand.metapatrol.local (deployed from `main`, behind the forge login)
- **Identity:** [identity/brand-identity.md](identity/brand-identity.md)
- **Plan and status:** [ROADMAP.md](ROADMAP.md)
- **Using the name and marks:** [TRADEMARKS.md](TRADEMARKS.md)

## packages

| package | what it is |
|---|---|
| [`@metapatrol/tokens`](packages/tokens) | design tokens (DTCG): palette, both themes, type, radii, the mark's construction; the WCAG contrast rules both themes must meet; CSS, SCSS and JSON outputs |
| [`@metapatrol/style`](packages/style) | fonts, themes, element defaults, the `mp-*` patterns, the Tailwind CSS v4 theme (one import), the shadcn/spartan mapping, a Sass API |
| [`@metapatrol/brand-kit`](packages/brand-kit) | the generator: mark, wordmark, lockups, app icons, favicons as SVG, PNG and ICO |
| [`@metapatrol/brand`](packages/brand) | the generated assets (all rights reserved, see TRADEMARKS.md) |

Also here: [`examples/`](examples) (Angular + Tailwind, React + Vite + Tailwind)
and [`apps/preview`](apps/preview), the brand site.

**For a project repository:** `npx @metapatrol/brand-kit init` writes
`metapatrol.json`, the project lockup `metapatrol / <name>`, a social preview, the
favicon set and a README header — and a README skeleton where there is none. See
[packages/brand-kit](packages/brand-kit) and *brand levels* in the identity document.

## using them

The packages are published to the organisation's npm registry on this forge.
One line per project, in `.npmrc`:

```
@metapatrol:registry=https://forgejo.metapatrol.local/api/packages/metapatrol/npm/
```

**Angular or any Tailwind CSS v4 app** — `npm install @metapatrol/style`, then in
`src/styles.css` replace `@import "tailwindcss";` with

```css
@import "@metapatrol/style/tailwind.css";
```

Utilities are named after the tokens (`bg-surface`, `text-fg-muted`,
`border-line-strong`, `bg-signal text-on-signal`); the default Tailwind palette
is removed. Themes follow the system, or `data-theme="dark|light"` on any
element. React with shadcn/ui adds `@import "@metapatrol/style/shadcn.css";`.
Details: [packages/style/README.md](packages/style/README.md), working code:
[examples/](examples).

**Assets without a package** — every file of `@metapatrol/brand` is served from
the brand bucket, for READMEs, docs and tools without a build:

```
https://brand.metapatrol.local/assets/<version>/mark/metapatrol-mark-dark.svg   never changes
https://brand.metapatrol.local/assets/latest/app/favicon.svg                     follows releases
```

These URLs are internal and behind the forge login (OIDC): they work in the
browser of anyone signed in to the forge — READMEs and docs on the forge, internal
tools — but not for anonymous clients. READMEs on GitHub cannot load them; keep a
PNG in the repository there.

## working on it

Requirements: Node.js `^22.22.3 || ^24.15.0 || >=26` (`nvm use` reads `.nvmrc`)
and `make`.

```sh
make install     # npm ci
make build       # tokens → style → brand-kit → assets → examples → preview
make test
make ci          # everything CI runs, in the same order
make             # every target
```

| to change | edit | then |
|---|---|---|
| a colour, a theme, type, radii | `packages/tokens/tokens/*.tokens.json` | `make check` (contrast), `make assets` if a mark colour changed |
| a contrast requirement | `packages/tokens/tokens/contrast.json` | `make check` |
| the mark's geometry | `packages/brand-kit/src/geometry.ts` | `make assets`, commit `packages/brand` |
| wordmark, lockups, icons | `packages/brand-kit/src/compose.ts` | `make assets`, commit `packages/brand` |
| styles, patterns, Tailwind theme | `packages/style/src/`, `scripts/build.mjs` | `make build test` |
| the brand site | `apps/preview/src/app/` | `make start-preview` |

`packages/brand` is generated but committed, so every asset change is visible in
review; CI fails when it does not match what the generator writes.

## releases

Work goes to `develop` through pull requests; `ci.yml` checks every pull request
and every push to `develop`. A pull request from `develop` to `main` releases, if
its commits call for it:

- **One version for all four packages**, from the conventional commits since the
  last `vX.Y.Z` tag: `fix:` → patch, `feat:` → minor, breaking → minor while 0.x;
  `chore:`, `ci:`, `build:`, `docs:` alone release nothing.
- `main.yml` runs semantic-release: `CHANGELOG.md`, the versions, a
  `chore: release vX.Y.Z` commit and the tag; then carries `main` back to `develop`.
- `release.yml` publishes the tag: the npm packages, a Forgejo release with the
  changelog section and `metapatrol-brand-X.Y.Z.zip`, and the brand site and assets
  (`/assets/X.Y.Z/`, `/assets/latest/`).

How it works and what it needs: [.forgejo/README.md](.forgejo/README.md).

## licence

The code — tokens, styles, generator, components, examples — is licensed under
the [Apache License 2.0](LICENSE). The metapatrol name, mark, wordmark and
lockups are not: see [TRADEMARKS.md](TRADEMARKS.md) and
[packages/brand/LICENSE.md](packages/brand/LICENSE.md). Inter and JetBrains
Mono are under the SIL Open Font License.
