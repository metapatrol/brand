# @metapatrol/style

The metapatrol look for web applications: Inter and JetBrains Mono (self-hosted),
the light and dark themes from `@metapatrol/tokens`, element defaults, the
metapatrol patterns, a Tailwind CSS v4 theme, a shadcn/ui and spartan/ui mapping
and a Sass API.

## Angular + Tailwind CSS v4

```sh
npm install @metapatrol/style
```

`src/styles.css` — replace `@import "tailwindcss";` with:

```css
@import "@metapatrol/style/tailwind.css";
```

That one import brings Tailwind, the fonts, both themes, the element defaults,
the patterns and the theme. Checked against an unmodified Angular 22 application
built with `@tailwindcss/postcss`: fonts are bundled and served from the app.

To pass options to Tailwind, import the parts instead:

```css
@import "tailwindcss" source("../src");
@import "@metapatrol/style";
@import "@metapatrol/style/tailwind-theme.css";
```

### utilities

Utility names are the token names; the default Tailwind palette is removed, so
only the brand's roles exist.

| role | utilities |
|---|---|
| `bg`, `surface`, `surface-2` | `bg-bg`, `bg-surface`, `bg-surface-2` |
| `line`, `line-strong` | `border-line`, `border-line-strong` |
| `fg`, `fg-muted`, `fg-subtle` | `text-fg`, `text-fg-muted`, `text-fg-subtle` |
| `signal`, `on-signal` | `bg-signal text-on-signal` (filled) |
| `signal-fg` | `text-signal-fg`, `ring-signal-fg` (links, focus) |
| `signal-wash` | `bg-signal-wash` (selected rows) |
| `success`, `warning`, `error`, `info` | `text-success`, `bg-error`, … |
| `mark-structure`, `mark-signal` | `fill-mark-structure`, `fill-mark-signal` |

Type: `font-sans` (Inter), `font-mono` (JetBrains Mono); `text-base` is 14 px
(dense UI), `text-md` 16 px for reading text. Radii: `rounded-sm` 4, `-md` 6,
`-lg` 8, `-xl` 10 px.

## themes

Dark by default, light when the system prefers it. Set `data-theme` to force one,
on `<html>` or on any container:

```html
<html data-theme="light">
<section data-theme="dark">…</section>
```

Utilities follow automatically; `dark:` and `light:` variants exist for the rare
cases that need them and use the same rule.

## patterns

Plain classes, with or without Tailwind:

```html
<section class="mp-panel">
  <p class="mp-label"><span class="mp-label-index">01</span>environments</p>
  <dl class="mp-kv"><dt>version</dt><dd>0.14.2</dd></dl>
  <span class="mp-status" data-status="success">healthy</span>
  <button class="mp-chip" aria-pressed="true">prod</button>
</section>
<span class="mp-namespace"><span class="mp-namespace-org">metapatrol / </span><span class="mp-namespace-project">steward</span></span>
```

`data-status`: `success`, `warning`, `error`, `info`, `active`; none means idle.

## spartan/ui (Angular) and shadcn/ui (React)

```css
@import "@metapatrol/style/tailwind.css";
@import "@metapatrol/style/shadcn.css";
```

Sets their variables (`--background`, `--primary`, `--ring`, …) from the tokens
and adds the matching utilities (`bg-primary`, `border-input`, …). Their
components then render in the metapatrol look without edits.

## without Tailwind

```css
@import "@metapatrol/style";
```

## Sass

```scss
@use "@metapatrol/style/scss" as mp;

.thing   { color: mp.color(fg-muted); @include mp.label; }
.preview { @include mp.theme(light); }            // scope a theme
.chart   { border-color: mp.raw(line, light); }   // resolved value
```

Angular resolves the `sass` export condition; plain Sass needs
`new NodePackageImporter()` and `@use "pkg:@metapatrol/style"`.

## notes

- The Tailwind **CLI** does not rebase `url()` in imported files; the font URLs
  then point nowhere. Use a bundler (`@tailwindcss/postcss`, `@tailwindcss/vite`),
  as Angular does.
- Angular 22's CLI needs Node.js 22.22.3 or 24.15 and later.
