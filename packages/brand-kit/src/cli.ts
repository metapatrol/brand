#!/usr/bin/env node
// npx @metapatrol/brand-kit build [--out <dir>]
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { build } from "./build.ts";

const USAGE = `usage: brand-kit build [--out <dir>]

  build   write the metapatrol brand assets (SVG, PNG, ICO)
          --out  target directory (default: ./metapatrol-brand)`;

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { out: { type: "string", default: "metapatrol-brand" }, help: { type: "boolean", short: "h" } },
});

if (values.help || positionals[0] !== "build") {
  console.log(USAGE);
  process.exit(values.help ? 0 : 2);
}

const out = resolve(values.out);
const files = build(out, (msg) => console.log(msg));
console.log(`wrote ${files.length} files to ${out}`);
