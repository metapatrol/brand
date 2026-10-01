import { Component, computed, signal } from '@angular/core';
import { MpCodeBlock, MpPanel, MpPanelActions, MpPanelNote, MpStatus, MpStatusKind } from '@metapatrol/ng';

interface Environment {
  name: string;
  version: string;
  status: MpStatusKind;
  label: string;
}

/** Components from @metapatrol/ng beside Tailwind utilities named after the tokens. */
@Component({
  selector: 'app-overview',
  imports: [MpPanel, MpPanelActions, MpPanelNote, MpStatus, MpCodeBlock],
  template: `
    <div class="mx-auto grid max-w-4xl gap-4">
      <h1 class="mp-page-title">release 0.14.2 <mp-status status="warning">rolling out</mp-status></h1>

      <mp-panel index="01" title="deployment">
        <button mpPanelActions type="button" class="mp-btn-primary">Promote</button>
        <p class="text-fg-muted">
          Rolled out to {{ healthy() }} of {{ environments.length }} environments.
          <a href="#">View the change log</a>.
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          @for (f of filters; track f) {
            <button class="mp-chip" [attr.aria-pressed]="filter() === f" (click)="filter.set(f)">{{ f }}</button>
          }
        </div>
      </mp-panel>

      <mp-panel index="02" title="environments">
        <table class="mp-table">
          <thead>
            <tr><th>name</th><th>version</th><th>state</th></tr>
          </thead>
          <tbody>
            @for (env of environments; track env.name) {
              <tr class="mp-row-link" [class.bg-signal-wash]="selected() === env.name" (click)="selected.set(env.name)">
                <td>{{ env.name }}</td>
                <td><code>{{ env.version }}</code></td>
                <td><mp-status [status]="env.status">{{ env.label }}</mp-status></td>
              </tr>
            }
          </tbody>
        </table>
        <p mpPanelNote>selected: {{ selected() }}</p>
      </mp-panel>

      <mp-code-block [prompt]="true" code="npm install @metapatrol/style @metapatrol/ng" />
    </div>
  `,
})
export class Overview {
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
}
