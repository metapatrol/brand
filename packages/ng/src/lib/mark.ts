import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MARKS, MarkSize } from './generated/marks';

/**
 * The metapatrol mark, inline: its colours follow the theme through
 * @metapatrol/style (steel on dark, graphite on light), so no image pair is
 * needed. The optical size follows the rendered size — the favicon
 * construction up to 16 px, the small one up to 40 px, the primary mark above —
 * unless `variant` says otherwise.
 */
@Component({
  selector: 'mp-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'mp-mark',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
  styles: `
    :host { display: inline-block; flex: none; }
    svg { display: block; width: 100%; height: 100%; }
  `,
  template: `<svg xmlns="http://www.w3.org/2000/svg" [attr.viewBox]="mark().viewBox" [innerHTML]="body()"></svg>`,
})
export class MpMark {
  private readonly sanitizer = inject(DomSanitizer);
  /** Rendered size in CSS pixels. */
  readonly size = input(24);
  /** Force an optical size instead of choosing by `size`. */
  readonly variant = input<MarkSize | undefined>(undefined);
  /** Accessible name; without one the mark is decorative. */
  readonly label = input('');

  readonly chosen = computed<MarkSize>(() => {
    const forced = this.variant();
    if (forced) return forced;
    const px = this.size();
    return px <= 16 ? 'favicon' : px <= 40 ? 'small' : 'primary';
  });
  protected readonly mark = computed(() => MARKS[this.chosen()]);
  // generated from @metapatrol/brand at build time, never user input
  protected readonly body = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.mark().body));
}
