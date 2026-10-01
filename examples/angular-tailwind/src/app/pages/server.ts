import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, input } from '@angular/core';
import { firstProblem, MpConditions, MpDetailTitle, MpId, MpLoadState, MpNotice, MpPanel } from '@metapatrol/ng';
import { MpCodeViewer } from '@metapatrol/ng/code-viewer';
import { MpMarkdown } from '@metapatrol/ng/markdown';
import { manifest, SERVERS } from './servers-data';

/** A detail page: what is wrong first, then the conditions, the manifest and the instructions. */
@Component({
  selector: 'app-server',
  imports: [MpDetailTitle, MpNotice, MpConditions, MpPanel, MpId, MpLoadState, MpCodeViewer, MpMarkdown],
  template: `
    <div class="mx-auto grid max-w-5xl gap-4">
      @if (server(); as s) {
        <mp-detail-title section="servers" link="/servers" [name]="s.name" />
        @if (problem(); as p) {
          <mp-notice [tone]="p.reason === 'ServerUnavailable' ? 'warn' : 'bad'">
            <strong>{{ p.type }}: {{ p.reason }}.</strong> {{ p.message }}
          </mp-notice>
        }
        <mp-panel index="01" title="image">
          <dl class="mp-kv">
            <dt>image</dt><dd><code>{{ s.image }}</code></dd>
            <dt>revision</dt><dd><mp-id [value]="s.revision" /></dd>
            <dt>tools</dt><dd>{{ s.tools }}</dd>
          </dl>
        </mp-panel>
        <mp-conditions [conditions]="s.conditions" [observedGeneration]="4" [generation]="4" />
        <div class="grid gap-4 lg:grid-cols-2">
          <mp-panel index="02" title="manifest">
            <mp-code-viewer language="yaml" [value]="yaml()" maxHeight="22rem" label="server manifest" />
          </mp-panel>
          <mp-panel index="03" title="instructions">
            <mp-markdown [source]="s.instructions" />
          </mp-panel>
        </div>
      } @else {
        <mp-detail-title section="servers" link="/servers" [name]="name()" />
        <mp-load-state what="server" [name]="name()" [error]="notFound" />
      }
    </div>
  `,
})
export class ServerPage {
  readonly name = input.required<string>();
  protected readonly server = computed(() => SERVERS.find((s) => s.name === this.name()));
  protected readonly problem = computed(() => firstProblem(this.server()?.conditions, ['Valid', 'Ready']));
  protected readonly yaml = computed(() => (this.server() ? manifest(this.server()!) : ''));
  protected readonly notFound = new HttpErrorResponse({ status: 404 });
}
