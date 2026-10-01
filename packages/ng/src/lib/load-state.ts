import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MP_CONFIG } from './config';
import { describeError, isNotFound } from './errors';

/**
 * What a page shows instead of its data: a quiet line while the first answer
 * is on its way, the API's own explanation when it fails, and a plain "no …
 * named …" for a 404. Shows nothing once there is data and no error.
 */
@Component({
  selector: 'mp-load-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .loading { padding: 24px 0; font-size: var(--mp-font-size-sm); color: var(--mp-fg-subtle); }
    .title { margin: 0; font-weight: var(--mp-font-weight-medium); }
    .detail { margin: 4px 0 0; font: var(--mp-font-size-xs) var(--mp-font-family-mono); opacity: 0.85; }
  `,
  template: `
    @if (error() !== undefined && error() !== null) {
      <div class="mp-notice" data-tone="bad" role="alert">
        @if (notFound()) {
          <p class="title">No {{ what() }} named <code>{{ name() }}</code>.</p>
        } @else {
          <p class="title">The {{ what() }} could not be loaded.</p>
          <p class="detail">{{ message() }}</p>
        }
      </div>
    } @else if (loading()) {
      <p class="loading" aria-live="polite">Loading…</p>
    }
  `,
})
export class MpLoadState {
  readonly error = input<unknown>();
  readonly loading = input(false);
  /** What the page loads, for the sentences: "server", "memories". */
  readonly what = input('data');
  /** The name asked for, for a 404. */
  readonly name = input('');
  private readonly service = inject(MP_CONFIG).serviceName;
  protected readonly notFound = computed(() => isNotFound(this.error()) && !!this.name());
  protected readonly message = computed(() => describeError(this.error(), this.service));
}
