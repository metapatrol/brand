// Brings a repository into the metapatrol shape: metapatrol.json (name and
// purpose, so later runs need no arguments), the project assets, and — only
// where they do not exist yet — a README skeleton, CONTRIBUTING.md and
// SECURITY.md. Hand-written files are never overwritten; the assets always are.
//
// The projects are developed in a private Forgejo and push-mirrored to GitHub,
// where forgejo-github-bridge carries issues and pull requests in and the
// maintainers' answers out. Everything written here addresses a reader on
// GitHub: its links point there or into the repository, never into the
// private network.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { assertName, type HeaderOptions, projectFiles, readmeHeader } from "./project.ts";

export const CONFIG = "metapatrol.json";
export const ASSET_DIR = ".metapatrol";
export const PLACEHOLDER = "One sentence: what this is and who it is for.";
export const BRIDGE = "https://github.com/metapatrol/forgejo-github-bridge";

export interface ProjectConfig {
  name: string;
  purpose: string;
  /** The GitHub repository it is mirrored to, "owner/name"; metapatrol/<name> by default. */
  github?: string;
  /** The SPDX identifier of its licence, for the README's badge. */
  license?: string;
}

function readJson(file: string): Record<string, unknown> | undefined {
  if (!existsSync(file)) return undefined;
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
}

const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);

/** The licence named by the first lines of LICENSE, for the common ones. */
export function licenseOf(dir: string): string | undefined {
  const file = join(dir, "LICENSE");
  if (!existsSync(file)) return undefined;
  const head = readFileSync(file, "utf8").slice(0, 400);
  if (/Apache License,?\s+Version 2\.0/i.test(head)) return "Apache-2.0";
  if (/MIT License/i.test(head)) return "MIT";
  if (/Mozilla Public License,?\s+(Version|v\.?)\s*2\.0/i.test(head)) return "MPL-2.0";
  if (/GNU AFFERO GENERAL PUBLIC LICENSE/i.test(head)) return "AGPL-3.0";
  return undefined;
}

/** Name and purpose: flags, then metapatrol.json, then package.json / go.mod, then the directory. */
export function resolveConfig(dir: string, flags: Partial<ProjectConfig> = {}): ProjectConfig & { source: string } {
  const own = readJson(join(dir, CONFIG)) as Partial<ProjectConfig> | undefined;
  const pkg = readJson(join(dir, "package.json"));
  const gomod = existsSync(join(dir, "go.mod")) ? readFileSync(join(dir, "go.mod"), "utf8") : "";
  const goName = gomod.match(/^module\s+(\S+)/m)?.[1]?.split("/").pop();
  const pkgName = typeof pkg?.name === "string" ? pkg.name.replace(/^@[^/]+\//, "") : undefined;

  const candidates: [string | undefined, string][] = [
    [flags.name, "--name"],
    [own?.name, CONFIG],
    [pkgName, "package.json"],
    [goName, "go.mod"],
    [basename(resolve(dir)), "directory name"],
  ];
  const [name, source] = candidates.find(([n]) => n) as [string, string];
  const purpose =
    flags.purpose ?? own?.purpose ?? (typeof pkg?.description === "string" ? pkg.description : undefined) ?? PLACEHOLDER;
  const lower = name.toLowerCase();
  assertName(lower);
  const github = flags.github ?? str(own?.github);
  const license = flags.license ?? str(own?.license) ?? str(pkg?.license) ?? licenseOf(dir);
  return { name: lower, purpose, source, ...(github && { github }), ...(license && { license }) };
}

/** The README header's links: the documentation index where there is one, contributing and security. */
export function headerLinks(dir: string): [string, string][] {
  const links: [string, string][] = [];
  if (existsSync(join(dir, "docs", "README.md"))) links.push(["Documentation", "docs/README.md"]);
  if (existsSync(join(dir, "CONTRIBUTING.md"))) links.push(["Contributing", "CONTRIBUTING.md"]);
  if (existsSync(join(dir, "SECURITY.md"))) links.push(["Security", "SECURITY.md"]);
  return links;
}

export function readmeSkeleton(config: ProjectConfig, header: HeaderOptions = {}): string {
  return `${readmeHeader(config.name, config.purpose, { dir: ASSET_DIR, ...header })}
## Why

<!-- The problem, and why this is the answer to it. A paragraph, not a pitch. -->

## How it works

<!-- The parts and what talks to what, as a few sentences or a diagram
     (\`\`\`mermaid renders on GitHub), and the decisions that shaped it. -->

## Features

<!-- What it does, as short bullets grouped by theme. -->

**Not in scope:** <!-- what it deliberately does not do, and what to use instead. -->

## Quick start

<!-- From nothing to running, as commands that work on a clean checkout. -->

\`\`\`sh
make build
make test
\`\`\`

## Contributing

Issues and pull requests are welcome on GitHub: see [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

<!-- The licence, and anything that is not under it. -->

Part of metapatrol: infrastructure, developer tools and autonomous systems.
`;
}

/** Whether the repository's Makefile has a \`ci\` target, so CONTRIBUTING can name it. */
export function hasMakeCi(dir: string): boolean {
  const makefile = join(dir, "Makefile");
  return existsSync(makefile) && /^ci\s*:/m.test(readFileSync(makefile, "utf8"));
}

export function contributing({ name }: ProjectConfig, makeCi = false): string {
  const checks = makeCi
    ? "- Run the checks before pushing: `make ci` runs what CI runs."
    : "- Run the checks before pushing: the README's *Quick start* has the commands.";
  return `# Contributing

Thanks for taking the time.

## How this repository works

${name} is developed in a private Forgejo instance and push-mirrored here.
Issues and pull requests opened on GitHub are carried into Forgejo by
[forgejo-github-bridge](${BRIDGE}), where the maintainers work, and everything
they say comes back here. From your side it is an ordinary GitHub project; a
bot account posts the maintainers' replies, naming who wrote them.

## Issues

Open an issue for bugs, questions and ideas. Please include the version, what
you expected, what happened, and the relevant output — with tokens and keys
removed.

## Pull requests

- Target **\`develop\`**. Pull requests against other branches are not picked up.
- Use [Conventional Commits](https://www.conventionalcommits.org/): \`feat:\` and
  \`fix:\` make a release, \`chore:\`, \`ci:\`, \`docs:\` and \`build:\` do not.
  Versions and the changelog are derived from them.
${checks}
- Explain the why in the commit body when the diff does not.
- If you change CI configuration (\`.forgejo/\`, \`.github/\`), say why in the
  description. Such pull requests are read with particular care before any
  workflow of theirs runs.

### What happens after you open one

1. Your branch is imported into the maintainers' Forgejo. CI runs there once a
   maintainer has read your changes and approved the run.
2. Review comments appear on your pull request, posted by the bot and
   attributed to the maintainer.
3. When it is merged, the bot says so; your authorship is kept.

The brand assets in \`${ASSET_DIR}/\` are generated: \`npx @metapatrol/brand-kit init\`
rewrites them from \`${CONFIG}\`. Edit \`${CONFIG}\`, not the files.
`;
}

export function security({ name, github }: ProjectConfig): string {
  const repo = github ?? `metapatrol/${name}`;
  return `# Security

## Reporting a vulnerability

Please report security problems privately through GitHub's
[private vulnerability reporting](https://github.com/${repo}/security/advisories/new)
(*Security → Report a vulnerability*), not in a public issue or pull request.

Include what you found, how to reproduce it, and what an attacker could do with
it. You will get an answer as soon as a maintainer has looked at it.

## Supported versions

Fixes go into the next release; only the latest release is supported.
`;
}

export interface InitResult {
  config: ProjectConfig & { source: string };
  written: string[];
  kept: string[];
}

export function init(dir: string, flags: Partial<ProjectConfig> = {}): InitResult {
  const config = resolveConfig(dir, flags);
  const written: string[] = [];
  const kept: string[] = [];
  const write = (rel: string, data: string | Buffer) => {
    const file = join(dir, rel);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, data);
    written.push(rel);
  };
  const once = (rel: string, data: string) => (existsSync(join(dir, rel)) ? kept.push(rel) : write(rel, data));

  // metapatrol.json keeps what was given: the defaults stay defaults
  const own = readJson(join(dir, CONFIG)) as Partial<ProjectConfig> | undefined;
  const github = flags.github ?? str(own?.github);
  const license = flags.license ?? str(own?.license);
  write(
    CONFIG,
    `${JSON.stringify({ name: config.name, purpose: config.purpose, ...(github && { github }), ...(license && { license }) }, null, 2)}\n`,
  );
  // the files the header links to first, so it can link to them
  once("CONTRIBUTING.md", contributing(config, hasMakeCi(dir)));
  once("SECURITY.md", security(config));
  const header: HeaderOptions = { github: config.github, license: config.license, links: headerLinks(dir) };
  for (const [rel, data] of projectFiles(config.name, config.purpose, ASSET_DIR, header)) write(`${ASSET_DIR}/${rel}`, data);
  once("README.md", readmeSkeleton(config, header));
  return { config, written, kept };
}
