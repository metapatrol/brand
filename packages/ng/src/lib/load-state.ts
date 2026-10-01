import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MP_CONFIG } from './config';
import { describeError, isForbidden, isNotFound } from './errors';

/**
 * What a page shows instead of its data: a quiet line while the first answer
 * is on its way, the API's own explanation when it fails, a plain "no …" for a
 * 404 and what the token lacks for a 403. Shows nothing once there is data and
 * no error.
 */
@Component({
  selector: 'mp-load-state',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @layer components { :host { display: block; } }
    .loading { padding: 24px 0; font-size: var(--mp-font-size-sm); color: var(--mp-fg-subtle); }
    .title { margin: 0; font-weight: var(--mp-font-weight-medium); }
    .hint { margin: 4px 0 0; color: var(--mp-fg-muted); }
    .detail { margin: 4px 0 0; font: var(--mp-font-size-xs) var(--mp-font-family-mono); opacity: 0.85; }
    .back { display: inline-block; margin-top: 8px; color: inherit; }
  `,
  template: `
    @if (error() !== undefined && error() !== null) {
      <div class="mp-notice" data-tone="bad" role="alert">
        @if (forbidden()) {
          <p class="title">Your token may not read {{ what() }}.</p>
          @if (forbiddenHint) {
            <p class="hint">{{ forbiddenHint }}</p>
          }
        } @else if (notFound()) {
          @if (name()) {
            <p class="title">No {{ what() }} named <code>{{ name() }}</code>.</p>
          } @else {
            <p class="title">No {{ what() }} found.</p>
          }
          @if (back()) {
            <a class="back" [routerLink]="back()">Back to the list</a>
          }
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
  /** Where to go instead of a missing item, e.g. the list it came from. */
  readonly back = input<string | unknown[]>('');
  private readonly config = inject(MP_CONFIG);
  protected readonly forbiddenHint = this.config.forbiddenHint;
  protected readonly forbidden = computed(() => isForbidden(this.error()));
  protected readonly notFound = computed(() => isNotFound(this.error()));
  protected readonly message = computed(() => describeError(this.error(), this.config.serviceName));
}
