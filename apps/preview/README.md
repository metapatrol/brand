# @metapatrol/preview

The metapatrol brand as a static site: mark and its variations, optical sizes,
construction, lockups, both colour themes (read from `@metapatrol/tokens`, with
contrast), typography, the `mp-*` patterns, integration snippets and every file
of `@metapatrol/brand` for download. Built with Angular 22 and
`@metapatrol/style` itself.

```sh
npm run build -w @metapatrol/preview      # after the packages are built
```

Output: `apps/preview/dist/preview/browser/`. The page uses a relative base
(`<base href="./">`) and has no routes, so the directory works as is from any
path on any static host (Forgejo pages, an nginx location, an object store
bucket). Nothing is loaded from third parties; fonts and assets are part of the
build.

`npm start -w @metapatrol/preview` serves it locally with live reload.
