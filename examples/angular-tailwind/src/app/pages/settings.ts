import { Component, signal } from '@angular/core';
import { MpConfirmButton, MpPanel } from '@metapatrol/ng';

/** Form fields and buttons from @metapatrol/style, the two-step delete from @metapatrol/ng. */
@Component({
  selector: 'app-settings',
  imports: [MpPanel, MpConfirmButton],
  template: `
    <div class="mx-auto grid max-w-2xl gap-4">
      <h1 class="mp-page-title">settings</h1>
      <mp-panel index="01" title="environment">
        <form class="grid gap-4" (submit)="$event.preventDefault(); saved.set(true)">
          <label>
            <span class="mp-field-label">name</span>
            <input class="mp-input" value="prod-eu" />
          </label>
          <label>
            <span class="mp-field-label">replicas</span>
            <input class="mp-input" value="-1" aria-invalid="true" />
            <span class="mp-field-error">at least 1</span>
          </label>
          <div class="flex gap-2">
            <button type="submit" class="mp-btn-primary">Save</button>
            <button type="button" class="mp-btn">Reset</button>
            <button type="button" class="mp-btn-ghost">Cancel</button>
          </div>
          @if (saved()) {
            <p class="text-success text-sm">saved</p>
          }
        </form>
      </mp-panel>
      <mp-panel index="02" title="danger zone">
        <mp-confirm-button danger question="Delete prod-eu and its history?" confirmLabel="Delete" (confirmed)="deleted.set(true)">
          Delete environment
        </mp-confirm-button>
        @if (deleted()) {
          <p class="mt-2 text-sm text-fg-muted">deleted (not really)</p>
        }
      </mp-panel>
    </div>
  `,
})
export class Settings {
  protected readonly saved = signal(false);
  protected readonly deleted = signal(false);
}
