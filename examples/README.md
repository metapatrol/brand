# examples

Minimal applications that consume the metapatrol packages the way a real
project does. They are workspaces, so CI builds them on every change and they
cannot drift from the packages.

| example | stack | shows |
|---|---|---|
| [`angular-tailwind`](angular-tailwind) | Angular 22, Tailwind CSS 4 (`@tailwindcss/postcss`, set up by `ng new --style=tailwind`), `@metapatrol/ng` | a console the way engram and mcp-gateway are built: `mp-app-shell` with navigation counts, a page header, a list with search and sort in the URL, conditions, notices, a detail page with the code viewer and Markdown, a two-step action, a sign-in page without the shell (the account pill signs out) — and the one-import Tailwind integration underneath. Its static build is the shell preview on the brand site (`make shell-preview`) |
| [`react-tailwind`](react-tailwind) | React 19, Vite 8, Tailwind CSS 4 (`@tailwindcss/vite`) | the same, plus the shadcn/ui mapping: a button written with shadcn's variable names renders in the metapatrol look |

```sh
make install
make build-packages     # the packages, which the examples use from their build output
make start-angular      # or: make start-react
```

What an existing application changes:

1. `npm install @metapatrol/style` (and `@metapatrol/brand` for favicon and mark,
   `@metapatrol/ng` for the Angular components)
2. `src/styles.css`: `@import "tailwindcss";` becomes `@import "@metapatrol/style/tailwind.css";`
3. React with shadcn/ui: also `@import "@metapatrol/style/shadcn.css";`

Things these examples ran into, so an application does not have to:

- **The default Tailwind palette is gone.** `bg-white`, `text-gray-500` and friends do not
  exist; use the roles (`bg-bg`, `text-fg-muted`). For a fixed light or dark area, set
  `data-theme="light"` on the container and keep using the roles.
- **Angular drops whitespace between elements.** Put the space inside the text:
  `<span class="mp-namespace-org">metapatrol / </span><span …>`.
- **Brand files are copied, not referenced.** Angular serves assets only from inside the
  project, and `node_modules` may be hoisted outside it; `scripts/copy-brand.mjs` copies what
  the app serves into `public/brand` (ignored by git).
- **Node.js**: Angular 22 needs 22.22.3 or 24.15 and later.
