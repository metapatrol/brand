# @metapatrol/tokens

The metapatrol design tokens: the palette, a dark and a light theme of semantic
colour roles, type, radii and the mark's construction parameters — in the DTCG
format, with the contrast rules both themes must meet.

Most applications do not use this package directly: `@metapatrol/style` brings
the tokens as CSS variables and Tailwind utilities.

## files

| import | contents |
|---|---|
| `@metapatrol/tokens/tokens.css` | `--mp-*` custom properties; dark by default, light with `prefers-color-scheme` or `data-theme="light"` |
| `@metapatrol/tokens/tokens.scss` | `$themes` (a map per theme) and variables for type and radii |
| `@metapatrol/tokens/tokens.json` | resolved values: `{ base, dark, light }` |
| `@metapatrol/tokens/tokens/*.tokens.json` | the DTCG source |

## roles

`bg`, `surface`, `surface-2`, `line`, `line-strong`, `fg`, `fg-muted`,
`fg-subtle`, `signal` (cyan, as a fill), `signal-fg` (cyan on dark, petrol on
light: links, focus), `on-signal`, `signal-wash`, `success`, `warning`, `error`,
`info`, `mark.structure`, `mark.signal`.

## API (Node.js)

```js
import { theme, color, contrast, contrastReport } from "@metapatrol/tokens";

color(theme("light"), "signal-fg");            // "#00707F"
contrast("#00707F", "#FFFFFF");                // 5.79
contrastReport().filter((r) => r.ratio < r.min); // [] — every rule holds
```

`npx metapatrol-tokens check` runs the contrast rules; `emit <dir>` writes the
CSS, SCSS and JSON files.

Apache-2.0. Part of [metapatrol/brand](https://github.com/metapatrol/brand).
