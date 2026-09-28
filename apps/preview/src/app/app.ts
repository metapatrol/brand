import { Component, computed, effect, signal } from '@angular/core';
import tokens from '@metapatrol/tokens/tokens.json';

type Theme = 'system' | 'dark' | 'light';
type Values = Record<string, string | number | string[] | { value: number; unit: string }>;

interface Asset {
  path: string;
  size: number;
}

/** What each colour role is for (the token files hold the same descriptions). */
const USES: Record<string, string> = {
  bg: 'page background',
  surface: 'cards, panels',
  'surface-2': 'raised or hovered surface',
  line: 'dividers, decorative borders',
  'line-strong': 'borders of inputs and controls',
  fg: 'primary text',
  'fg-muted': 'secondary text, labels, metadata',
  'fg-subtle': 'placeholders, disabled',
  signal: 'signal as fill: active state, selection',
  'signal-fg': 'signal as text or line: links, focus',
  'on-signal': 'text on a signal fill',
  'signal-wash': 'selected rows and items',
  success: 'status',
  warning: 'status',
  error: 'status',
  info: 'informational notices, never links',
  'mark-structure': 'the mark’s structure',
  'mark-signal': 'the mark’s signal panel',
};

function luminance(hex: string): number {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const roleOf = (key: string) => key.replace(/^color\./, '').replaceAll('.', '-');

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  /** system: no data-theme attribute, the tokens follow prefers-color-scheme */
  protected readonly theme = signal<Theme>('system');

  /** Each tile sets its own theme, so it shows the right background in either page theme. */
  protected readonly colourways = [
    { name: 'dark', theme: 'dark', bg: 'bg-bg' },
    { name: 'light', theme: 'light', bg: 'bg-bg' },
    { name: 'mono-white', theme: 'dark', bg: 'bg-surface' },
    { name: 'mono-black', theme: 'light', bg: 'bg-bg' },
  ];

  protected readonly sizes = [
    { px: 16, file: 'favicon', label: 'favicon' },
    { px: 24, file: 'small', label: 'small' },
    { px: 32, file: 'small', label: 'small' },
    { px: 48, file: '', label: 'primary' },
    { px: 64, file: '', label: 'primary' },
    { px: 96, file: '', label: 'primary' },
  ];

  /** Colour roles of both themes, straight from @metapatrol/tokens. */
  protected readonly roles = Object.keys(tokens.dark as Values).map((key) => {
    const dark = String((tokens.dark as Values)[key]);
    const light = String((tokens.light as Values)[key]);
    const role = roleOf(key);
    const text = /^(fg|signal-fg|success|warning|error|info|line-strong|mark-structure)/.test(role);
    return {
      role,
      use: USES[role] ?? '',
      dark,
      light,
      // contrast against the page background, for roles that are read or must stand out
      darkRatio: text && dark.length === 7 ? contrast(dark, String((tokens.dark as Values)['color.bg'])) : null,
      lightRatio: text && light.length === 7 ? contrast(light, String((tokens.light as Values)['color.bg'])) : null,
    };
  });

  protected readonly typeScale = Object.entries(tokens.base as Values)
    .filter(([k]) => k.startsWith('font.size.'))
    .map(([k, v]) => ({ name: `text-${k.slice('font.size.'.length)}`, px: (v as { value: number }).value }));

  protected readonly assets = signal<Asset[]>([]);
  protected readonly groups = computed(() => {
    const byDir = new Map<string, Asset[]>();
    for (const a of this.assets()) {
      const dir = a.path.split('/')[0]!;
      byDir.set(dir, [...(byDir.get(dir) ?? []), a]);
    }
    return [...byDir.entries()].map(([dir, files]) => ({ dir, files }));
  });

  protected readonly snippets = {
    angular: `npm install @metapatrol/style

/* src/styles.css, replaces @import "tailwindcss"; */
@import "@metapatrol/style/tailwind.css";`,
    react: `npm install @metapatrol/style

/* src/styles.css (Vite + @tailwindcss/vite) */
@import "@metapatrol/style/tailwind.css";
@import "@metapatrol/style/shadcn.css";   /* shadcn/ui */`,
    sass: `@use "@metapatrol/style/scss" as mp;

.thing   { color: mp.color(fg-muted); @include mp.label; }
.preview { @include mp.theme(light); }`,
  };

  constructor() {
    effect(() => {
      const t = this.theme();
      if (t === 'system') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', t);
    });
    fetch('brand/manifest.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((files: Asset[]) => this.assets.set(files))
      .catch(() => this.assets.set([]));
  }

  protected cycleTheme(): void {
    const order: Theme[] = ['system', 'dark', 'light'];
    this.theme.set(order[(order.indexOf(this.theme()) + 1) % order.length]!);
  }

  protected size(bytes: number): string {
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} kB`;
  }

  protected name(path: string): string {
    return path.split('/').pop()!;
  }
}
