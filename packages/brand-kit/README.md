# @metapatrol/brand-kit

Generates metapatrol brand assets from their construction — the brand's own, and
each project's. Pure Node.js: no Inkscape, ImageMagick or installed fonts.

## in a project repository

```sh
npx @metapatrol/brand-kit init
```

| writes | |
|---|---|
| `metapatrol.json` | name and purpose; later runs read them, so they need no flags |
| `.metapatrol/<name>-lockup-{dark,light,mono-white,mono-black}.{svg,png}` | `[mark] metapatrol / <name>` |
| `.metapatrol/social-preview.png` | 1280×640, for the repository's link preview (GitHub, Forgejo) |
| `.metapatrol/favicon/` | `favicon.svg` (follows the colour scheme), `favicon.ico`, `apple-touch-icon.png`, `icon-192/512.png`, `site.webmanifest` |
| `.metapatrol/README-header.md` | the header: lockup that follows the reader's theme, then the purpose |
| `README.md`, `CONTRIBUTING.md` | **only if they do not exist**: the skeleton (why, how it works, scope and non-goals, running it, licence) |

The name comes from `--name`, `metapatrol.json`, `package.json`, `go.mod` or the
directory, in that order; it must be lowercase with digits and dashes. The purpose
comes from `--purpose`, `metapatrol.json` or `package.json`'s description. Run
`init` again after changing either: the assets are rewritten, hand-written files
never are.

`brand-kit project` writes only the assets (`--out` for another directory).

A project has no logo of its own: it carries the metapatrol mark with its name in
the namespace. See *brand levels* in the identity document.

## the brand itself

```sh
npx @metapatrol/brand-kit build --out ./brand
```

Writes what `@metapatrol/brand` ships; use that package unless you are changing
the brand. Colours and construction parameters come from `@metapatrol/tokens`.
The build is byte-reproducible.

The fonts in `fonts/` (Inter, JetBrains Mono) are under the SIL Open Font
License. The generated marks are not open source: see `TRADEMARKS.md` in
[metapatrol/brand](https://forgejo.metapatrol.local/metapatrol/brand).

Apache-2.0 (the code).
