#!/usr/bin/env node
// npx @metapatrol/brand-kit <command>
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { build } from "./build.ts";
import { ASSET_DIR, init, PLACEHOLDER, resolveConfig } from "./init.ts";
import { projectFiles } from "./project.ts";

const USAGE = `usage: brand-kit <command> [options]

  init      bring a repository into the metapatrol shape: metapatrol.json, the
            project assets in ${ASSET_DIR}/, and a README skeleton and
            CONTRIBUTING.md where none exist (never overwrites them)
              --name     project name   (default: metapatrol.json, package.json, go.mod, directory)
              --purpose  one sentence   (default: metapatrol.json, package.json description)
              --dir      repository     (default: .)

  project   only the project assets: lockup "metapatrol / <name>", social
            preview 1280x640, favicon set, README header
              --name, --purpose as above
              --out      target directory (default: ./${ASSET_DIR})

  build     the metapatrol brand assets themselves (SVG, PNG, ICO)
              --out      target directory (default: ./metapatrol-brand)`;

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string" },
    dir: { type: "string", default: "." },
    name: { type: "string" },
    purpose: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
});

const [command] = positionals;
const flags = { name: values.name, purpose: values.purpose };

try {
  if (values.help || !command) {
    console.log(USAGE);
    process.exit(values.help ? 0 : 2);
  } else if (command === "build") {
    const out = resolve(values.out ?? "metapatrol-brand");
    const files = build(out, (msg) => console.log(msg));
    console.log(`wrote ${files.length} files to ${out}`);
  } else if (command === "project") {
    const { name, purpose, source } = resolveConfig(values.dir, flags);
    const out = resolve(values.dir, values.out ?? ASSET_DIR);
    const files = projectFiles(name, purpose);
    for (const [rel, data] of files) {
      mkdirSync(dirname(join(out, rel)), { recursive: true });
      writeFileSync(join(out, rel), data);
    }
    console.log(`${name} (from ${source}): wrote ${files.size} files to ${out}`);
  } else if (command === "init") {
    const { config, written, kept } = init(resolve(values.dir), flags);
    console.log(`${config.name} (name from ${config.source})`);
    console.log(`  purpose: ${config.purpose}`);
    console.log(`  wrote ${written.length} files (${ASSET_DIR}/, metapatrol.json${written.includes("README.md") ? ", README.md" : ""}${written.includes("CONTRIBUTING.md") ? ", CONTRIBUTING.md" : ""})`);
    for (const k of kept) console.log(`  kept ${k} as it is`);
    if (kept.includes("README.md")) console.log(`  the README header to paste: ${ASSET_DIR}/README-header.md`);
    if (config.purpose === PLACEHOLDER) {
      console.log(`  no purpose yet: set "purpose" in metapatrol.json (one sentence), then run init again`);
    }
  } else {
    console.error(`unknown command "${command}"\n\n${USAGE}`);
    process.exit(2);
  }
} catch (err) {
  console.error(`brand-kit: ${(err as Error).message}`);
  process.exit(1);
}
