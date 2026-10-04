import { Component, computed, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  conditionRank,
  findCondition,
  MpCondition,
  MpId,
  MpListSearch,
  MpLoadState,
  MpPageHeader,
  MpPanel,
  MpSort,
  MpTime,
  parseSort,
  searchRows,
  sortRows,
} from '@metapatrol/ng';
import { SERVERS } from './servers-data';

/** A list as the mcp-gateway console has them: search and sort in the URL. */
@Component({
  selector: 'app-servers',
  imports: [MpPageHeader, MpPanel, MpListSearch, MpSort, MpCondition, MpId, MpTime, MpLoadState],
  template: `
    <div class="mx-auto grid max-w-5xl gap-4">
      <!-- the grid spaces the page, so the header's own margin goes (mb-0) -->
      <mp-page-header class="mb-0" title="servers" note="MCPServer" />
      <mp-load-state [loading]="loading()" what="servers" />
      @if (!loading()) {
        <mp-list-search [query]="q()" [shown]="rows().length" [total]="servers.length" placeholder="Filter servers" (submitted)="openFirst()" />
        <mp-panel>
          <table class="mp-table">
            <thead>
              <tr>
                <th><mp-sort key="name" [sort]="sort()">name</mp-sort></th>
                <th><mp-sort key="ready" [sort]="sort()">ready</mp-sort></th>
                <th>revision</th>
                <th class="mp-num"><mp-sort key="tools" [sort]="sort()">tools</mp-sort></th>
                <th><mp-sort key="updated" [sort]="sort()">updated</mp-sort></th>
              </tr>
            </thead>
            <tbody>
              @for (s of rows(); track s.name) {
                <tr class="mp-row-link" (click)="open(s.name)">
                  <td><a class="mp-link" [href]="'/servers/' + s.name" (click)="$event.preventDefault()">{{ s.name }}</a></td>
                  <td><mp-condition bare [condition]="ready(s)" /></td>
                  <td><mp-id [value]="s.revision" /></td>
                  <td class="mp-num">{{ s.tools }}</td>
                  <td class="text-fg-muted"><mp-time [value]="s.updated" /></td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="text-fg-subtle">No server matches “{{ q() }}”.</td></tr>
              }
            </tbody>
          </table>
        </mp-panel>
      }
    </div>
  `,
})
export class Servers {
  /** ?q= and ?sort=, bound by the router */
  readonly q = input<string | undefined>();
  readonly sort = input<string | undefined>();
  protected readonly servers = SERVERS;
  protected readonly loading = signal(true);
  protected readonly ready = (s: (typeof SERVERS)[number]) => findCondition(s.conditions, 'Ready');
  protected readonly rows = computed(() =>
    sortRows(
      searchRows(this.servers, this.q(), (s) => [s.name, s.image]),
      parseSort(this.sort()),
      { ready: (s) => conditionRank(this.ready(s)), tools: (s) => s.tools, updated: (s) => Date.parse(s.updated) },
      (s) => s.name,
    ),
  );

  constructor(private readonly router: Router) {
    // as if the list came from an API
    setTimeout(() => this.loading.set(false), 400);
  }

  protected open(name: string): void {
    void this.router.navigate(['/servers', name]);
  }

  protected openFirst(): void {
    const first = this.rows()[0];
    if (first) this.open(first.name);
  }
}
