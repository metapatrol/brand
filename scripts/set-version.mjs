#!/usr/bin/env node
// Sets one version on every published package and on the ranges they use for
// each other, then updates the lockfile. semantic-release runs this from
// prepareCmd (.releaserc.json); the packages are released in lockstep, like
// Angular's, so "brand 0.3.0" means the same thing in every package.
//
//   node scripts/set-version.mjs 0.3.0
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

export const PUBLISHED = ["tokens", "style", "brand-kit", "brand", "ng"];

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version ?? "")) {
  console.error("usage: set-version.mjs <semver>");
  process.exit(2);
}

const names = new Set(PUBLISHED.map((p) => `@metapatrol/${p}`));
for (const dir of PUBLISHED) {
  const file = new URL(`../packages/${dir}/package.json`, import.meta.url);
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  pkg.version = version;
  for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
    for (const dep of Object.keys(pkg[field] ?? {})) {
      if (names.has(dep)) pkg[field][dep] = `^${version}`;
    }
  }
  writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log(`${pkg.name} ${version}`);
}

// The examples and the preview depend on "*" and follow on their own.
execFileSync("npm", ["install", "--package-lock-only", "--no-audit", "--no-fund"], { stdio: "inherit" });
