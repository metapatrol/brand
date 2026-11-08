import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MpPageHeader } from '@metapatrol/ng';

/** Where the "+" beside the deployments group leads: a form that creates nothing. */
@Component({
  selector: 'app-new-server',
  imports: [MpPageHeader],
  template: `
    <div class="mx-auto grid max-w-xl gap-4">
      <mp-page-header class="mb-0" section="servers" link="/servers" title="new server" />
      <form class="mp-panel grid gap-4" (submit)="$event.preventDefault(); create()">
        <div>
          <label class="mp-field-label" for="name">name</label>
          <input id="name" class="mp-input font-mono" [value]="name()" (input)="name.set($any($event.target).value)" placeholder="grep" />
        </div>
        <div>
          <label class="mp-field-label" for="endpoint">endpoint</label>
          <input id="endpoint" class="mp-input font-mono" placeholder="http://grep.mcp.svc:8080/mcp" />
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" class="mp-btn-ghost" (click)="back()">Cancel</button>
          <button type="submit" class="mp-btn-primary" [disabled]="!name().trim()">Create</button>
        </div>
      </form>
    </div>
  `,
})
export class NewServer {
  private readonly router = inject(Router);
  protected readonly name = signal('');
  protected create(): void {
    void this.router.navigateByUrl('/servers');
  }
  protected back(): void {
    void this.router.navigateByUrl('/servers');
  }
}
