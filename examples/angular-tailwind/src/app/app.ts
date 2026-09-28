import { Component, computed, effect, signal } from '@angular/core';

type Theme = 'system' | 'dark' | 'light';

interface Environment {
  name: string;
  version: string;
  status: 'success' | 'warning' | 'error' | 'idle';
  label: string;
}

/**
 * Everything on this page is styled by `@import '@metapatrol/style/tailwind.css'`
 * (src/styles.css): Tailwind utilities named after the tokens (bg-surface,
 * text-fg-muted, border-line-strong, …) and the mp-* patterns.
 */
@Component({
  selector: 'app-root',
  template: `
    <header class="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
      <span class="mp-namespace flex items-center gap-3">
        <!-- the mark follows the theme: steel on dark, graphite on light -->
        <img class="size-7 light:hidden" src="brand/mark/metapatrol-mark-small-dark.svg" alt="" />
        <img class="hidden size-7 light:block" src="brand/mark/metapatrol-mark-small-light.svg" alt="" />
        <span><span class="mp-namespace-org">metapatrol / </span><span class="mp-namespace-project">angular-tailwind</span></span>
      </span>
      <button
        class="rounded-md border border-line-strong px-3 py-1.5 font-mono text-xs text-fg-muted hover:bg-surface-2"
        (click)="cycleTheme()"
      >
        theme: {{ theme() }}
      </button>
    </header>

    <main class="mx-auto grid max-w-4xl gap-4 p-6">
      <section class="mp-panel">
        <p class="mp-label"><span class="mp-label-index">01</span>deployment</p>
        <h1 class="mb-1 text-xl font-semibold tracking-tight">release 0.14.2</h1>
        <p class="text-fg-muted">
          Rolled out to {{ healthy() }} of {{ environments.length }} environments.
          <a href="#">View the change log</a>.
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <button class="rounded-md bg-signal px-4 py-2 font-medium text-on-signal">Promote</button>
          <button class="rounded-md border border-line-strong px-4 py-2 font-medium hover:bg-surface-2">Compare</button>
          <button class="rounded-md px-4 py-2 text-fg-muted hover:text-fg">Cancel</button>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <input
            class="min-w-0 flex-1 rounded-md border border-line-strong bg-bg px-3 py-2"
            placeholder="Filter by environment"
          />
          @for (f of filters; track f) {
            <button class="mp-chip" [attr.aria-pressed]="filter() === f" (click)="filter.set(f)">{{ f }}</button>
          }
        </div>
      </section>

      <section class="mp-panel">
        <p class="mp-label"><span class="mp-label-index">02</span>environments</p>
        <table class="w-full text-sm">
          <thead>
            <tr><th class="px-2 py-2">name</th><th class="px-2 py-2">version</th><th class="px-2 py-2">state</th></tr>
          </thead>
          <tbody>
            @for (env of environments; track env.name) {
              <tr [class.bg-signal-wash]="selected() === env.name" class="cursor-pointer hover:bg-surface-2" (click)="selected.set(env.name)">
                <td class="px-2 py-2">{{ env.name }}</td>
                <td class="px-2 py-2"><code>{{ env.version }}</code></td>
                <td class="px-2 py-2"><span class="mp-status" [attr.data-status]="env.status === 'idle' ? null : env.status">{{ env.label }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      </section>

      <section class="mp-panel">
        <p class="mp-label"><span class="mp-label-index">03</span>details</p>
        <dl class="mp-kv">
          <dt>image</dt><dd><code>registry.example/metapatrol/steward:0.14.2</code></dd>
          <dt>theme</dt><dd>{{ theme() }}</dd>
          <dt>selected</dt><dd>{{ selected() }}</dd>
        </dl>
      </section>

      <pre><span class="text-signal-fg">$</span> npm install &#64;metapatrol/style
<span class="text-success">✓</span> src/styles.css: &#64;import '&#64;metapatrol/style/tailwind.css';</pre>
    </main>
  `,
})
export class App {
  protected readonly environments: Environment[] = [
    { name: 'prod-eu', version: '0.14.2', status: 'success', label: 'healthy' },
    { name: 'prod-us', version: '0.14.2', status: 'warning', label: 'degraded' },
    { name: 'staging', version: '0.15.0-rc.1', status: 'error', label: 'failed' },
    { name: 'dev', version: '0.15.0-dev', status: 'idle', label: 'idle' },
  ];
  protected readonly filters = ['all', 'prod', 'staging'];
  protected readonly filter = signal('all');
  protected readonly selected = signal('prod-us');
  protected readonly healthy = computed(() => this.environments.filter((e) => e.status === 'success').length);

  /** system: no data-theme attribute, the tokens follow prefers-color-scheme */
  protected readonly theme = signal<Theme>('system');

  constructor() {
    effect(() => {
      const t = this.theme();
      if (t === 'system') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', t);
    });
  }

  protected cycleTheme(): void {
    const order: Theme[] = ['system', 'dark', 'light'];
    this.theme.set(order[(order.indexOf(this.theme()) + 1) % order.length]!);
  }
}
