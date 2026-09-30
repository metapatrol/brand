# @metapatrol/brand-kit

Generates the metapatrol brand assets from their construction: the mark on its
isometric lattice (primary, small and favicon optical sizes, four colourways),
the wordmark and the lockups as outlines, app icon, avatars, favicons and the
construction sheets — as SVG, PNG and ICO, without Inkscape, ImageMagick or
installed fonts.

```sh
npx @metapatrol/brand-kit build --out ./brand
```

The output is what `@metapatrol/brand` ships; use that package unless you are
changing the brand. Colours and construction parameters come from
`@metapatrol/tokens`. The build is byte-reproducible.

The fonts in `fonts/` (Inter, JetBrains Mono) are under the SIL Open Font
License. The generated marks are not open source: see `TRADEMARKS.md` in
[metapatrol/brand](https://forgejo.metapatrol.local/metapatrol/brand).

Apache-2.0 (the code).
