import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

/** Content for the panel's head, beside the title: <div mpPanelActions>…</div> */
@Directive({ selector: '[mpPanelActions]', host: { class: 'mp-panel-actions' } })
export class MpPanelActions {}

/** A footnote under the panel body: <p mpPanelNote>…</p> */
@Directive({ selector: '[mpPanelNote]', host: { class: 'mp-panel-note' } })
export class MpPanelNote {}

/**
 * The basic surface. With a title it gets a head ("01  ENVIRONMENTS", the
 * mp-label pattern) and its body is padded; actions and a note are projected.
 */
@Component({
  selector: 'mp-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mp-panel mp-panel-flush', role: 'region', '[attr.aria-label]': 'title() || null' },
  styles: `:host { display: block; min-width: 0; }`,
  template: `
    @if (title()) {
      <div class="mp-panel-head">
        <h2 class="mp-label">
          @if (index()) {
            <span class="mp-label-index">{{ index() }}</span>
          }{{ title() }}
        </h2>
        <ng-content select="[mpPanelActions]" />
      </div>
    }
    <div class="mp-panel-body"><ng-content /></div>
    <ng-content select="[mpPanelNote]" />
  `,
})
export class MpPanel {
  readonly title = input('');
  /** "01", "02": the numbering of sections on a page. */
  readonly index = input('');
}
