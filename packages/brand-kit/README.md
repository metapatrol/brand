# @metapatrol/brand-kit

Generates metapatrol brand assets from their construction — the brand's own, and
each project's. Pure Node.js: no Inkscape, ImageMagick or installed fonts.

## in a project repository

```sh
npx @metapatrol/brand-kit init
```

| writes | |
|---|---|
| `metapatrol.json` | name and purpose (and `github`, `license` where given); later runs read them, so they need no flags |
| `.metapatrol/<name>-lockup-{dark,light,mono-white,mono-black}.{svg,png}` | `[mark] metapatrol / <name>` |
| `.metapatrol/social-preview.png` | 1280×640, for the repository's link preview (GitHub, Forgejo) |
| `.metapatrol/favicon/` | `favicon.svg` (follows the colour scheme), `favicon.ico`, `apple-touch-icon.png`, `icon-192/512.png`, `site.webmanifest` |
| `.metapatrol/README-header.md` | the header: the lockup that follows the reader's theme, the purpose in bold, release and licence badges, a line of links to the documentation index, CONTRIBUTING and SECURITY where they exist |
| `README.md` | **only if there is none**: the header, then why, how it works, features (and what is not in scope), quick start, contributing, licence |
| `CONTRIBUTING.md` | **only if there is none**: how the repository works — developed in a private Forgejo, push-mirrored to GitHub, issues and pull requests carried in by [forgejo-github-bridge](https://github.com/metapatrol/forgejo-github-bridge) — and what a pull request needs |
| `SECURITY.md` | **only if there is none**: private vulnerability reporting on GitHub |

Everything it writes addresses a reader on GitHub, where the projects are
mirrored: links point there or into the repository, never into the private
network.

The name comes from `--name`, `metapatrol.json`, `package.json`, `go.mod` or the
directory, in that order; it must be lowercase with digits and dashes. The purpose
comes from `--purpose`, `metapatrol.json` or `package.json`'s description. The
GitHub repository is `metapatrol/<name>` unless `--github` or `metapatrol.json`
says otherwise; the licence badge comes from `--license`, `metapatrol.json`,
`package.json` or `LICENSE`. Run
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
[metapatrol/brand](https://github.com/metapatrol/brand).

Apache-2.0 (the code).
