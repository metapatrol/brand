import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** "metapatrol / <project>": the organisation in Inter, the project in JetBrains Mono. */
@Component({
  selector: 'mp-namespace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mp-namespace' },
  // the space lives inside the text: Angular drops whitespace between elements
  template: `<span class="mp-namespace-org">{{ org() }} / </span><span class="mp-namespace-project">{{ project() }}</span>`,
})
export class MpNamespace {
  readonly project = input.required<string>();
  readonly org = input('metapatrol');
}
