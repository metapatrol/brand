// Brings a repository into the metapatrol shape: metapatrol.json (name and
// purpose, so later runs need no arguments), the project assets, and — only
// where they do not exist yet — a README skeleton and CONTRIBUTING.md.
// Hand-written files are never overwritten; the assets always are.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { assertName, projectFiles, readmeHeader } from "./project.ts";

export const CONFIG = "metapatrol.json";
export const ASSET_DIR = ".metapatrol";
export const PLACEHOLDER = "One sentence: what this is and who it is for.";

export interface ProjectConfig {
  name: string;
  purpose: string;
}

function readJson(file: string): Record<string, unknown> | undefined {
  if (!existsSync(file)) return undefined;
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
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
  return { name: lower, purpose, source };
}

export function readmeSkeleton({ name, purpose }: ProjectConfig): string {
  return `${readmeHeader(name, purpose, ASSET_DIR)}
## why

<!-- The problem, and why this is the answer to it. A paragraph, not a pitch. -->

## how it works

<!-- The architecture in a few sentences or a diagram: the parts, what talks to what,
     and the decisions that shaped it. -->

## scope

<!-- What it does. -->

**Non-goals:** <!-- what it deliberately does not do, and what to use instead. -->

## running it

<!-- Build, test and run, as commands that work on a clean checkout. -->

\`\`\`sh
make build
make test
\`\`\`

## licence

<!-- The licence, and anything that is not under it. -->

Part of metapatrol: infrastructure, developer tools and autonomous systems.
`;
}

export function contributing({ name }: ProjectConfig): string {
  return `# contributing to ${name}

- Work goes to \`develop\` through pull requests; \`main\` is what was released.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/):
  \`feat:\` and \`fix:\` make a release, \`chore:\`, \`ci:\`, \`docs:\` and \`build:\` do not.
- A pull request is ready when CI is green on it (\`make ci\` runs the same checks).
- Explain the why in the commit body when the diff does not.

Brand assets in \`${ASSET_DIR}/\` are generated: \`npx @metapatrol/brand-kit init\` rewrites
them from \`${CONFIG}\`. Edit \`${CONFIG}\`, not the files.
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

  write(CONFIG, `${JSON.stringify({ name: config.name, purpose: config.purpose }, null, 2)}\n`);
  for (const [rel, data] of projectFiles(config.name, config.purpose, ASSET_DIR)) write(`${ASSET_DIR}/${rel}`, data);
  once("README.md", readmeSkeleton(config));
  once("CONTRIBUTING.md", contributing(config));
  return { config, written, kept };
}
