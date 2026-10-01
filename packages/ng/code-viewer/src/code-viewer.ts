import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { defaultKeymap } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { bracketMatching, foldGutter, foldKeymap, HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { highlightSelectionMatches, search, searchKeymap } from '@codemirror/search';
import { Compartment, EditorState, Extension } from '@codemirror/state';
import { EditorView, highlightActiveLine, keymap, lineNumbers } from '@codemirror/view';
import { tags } from '@lezer/highlight';

export type CodeLanguage = 'json' | 'yaml' | 'text';

/*
 * Colours are the brand's roles, as CSS variables, so the viewer follows the
 * theme without being rebuilt when it changes. (From the mcp-gateway console.)
 */
const theme = EditorView.theme({
  '&': { fontSize: '12.5px', backgroundColor: 'transparent', color: 'var(--mp-fg)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--mp-font-family-mono)', lineHeight: '1.6', fontVariantLigatures: 'none' },
  '.cm-content': { padding: '10px 0', caretColor: 'var(--mp-fg)' },
  '.cm-gutters': {
    backgroundColor: 'var(--mp-surface-2)',
    color: 'var(--mp-fg-subtle)',
    border: 'none',
    borderRight: '1px solid var(--mp-line)',
  },
  '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--mp-signal-wash) 60%, transparent)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--mp-fg-muted)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'var(--mp-signal-wash) !important',
  },
  '.cm-matchingBracket': { backgroundColor: 'var(--mp-signal-wash)', outline: '1px solid var(--mp-line-strong)' },
  '.cm-foldPlaceholder': { backgroundColor: 'var(--mp-surface-2)', border: '1px solid var(--mp-line)', color: 'var(--mp-fg-muted)' },
  '.cm-searchMatch': { backgroundColor: 'color-mix(in srgb, var(--mp-warning) 20%, transparent)', outline: '1px solid var(--mp-warning)' },
  '.cm-panels': { backgroundColor: 'var(--mp-surface-2)', color: 'var(--mp-fg)', borderColor: 'var(--mp-line)' },
  '.cm-panels input, .cm-panels button': { fontFamily: 'var(--mp-font-family-sans)' },
});

const highlight = HighlightStyle.define([
  { tag: [tags.propertyName, tags.definition(tags.propertyName)], color: 'var(--mp-signal-fg)' },
  { tag: [tags.string, tags.special(tags.string)], color: 'var(--mp-success)' },
  { tag: tags.number, color: 'var(--mp-warning)' },
  { tag: [tags.bool, tags.null, tags.atom], color: 'var(--mp-error)' },
  { tag: [tags.keyword, tags.typeName, tags.labelName], color: 'var(--mp-info)' },
  { tag: tags.comment, color: 'var(--mp-fg-subtle)', fontStyle: 'italic' },
  { tag: [tags.brace, tags.squareBracket, tags.separator, tags.punctuation, tags.meta], color: 'var(--mp-fg-muted)' },
]);

const languages: Record<CodeLanguage, () => Extension> = { json: () => json(), yaml: () => yaml(), text: () => [] };

/**
 * JSON or YAML in a read-only editor: highlighted, foldable, searchable
 * (Ctrl/Cmd-F), selectable for copying. A value that is not a string is shown
 * as indented JSON (which YAML reads too).
 *
 *   import { MpCodeViewer } from '@metapatrol/ng/code-viewer';
 *   <mp-code-viewer language="yaml" [value]="manifest()" />
 */
@Component({
  selector: 'mp-code-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mp-code-viewer' },
  styles: `
    :host { display: block; min-width: 0; overflow: hidden; background: var(--mp-bg); border: 1px solid var(--mp-line); border-radius: var(--mp-radius-md); }
    .host { overflow: auto; }
  `,
  template: `<div #host class="host" [style.max-height]="maxHeight()"></div>`,
})
export class MpCodeViewer {
  readonly value = input.required<unknown>();
  readonly language = input<CodeLanguage>('json');
  readonly maxHeight = input('75vh');
  readonly label = input('');

  protected readonly text = computed(() => {
    const v = this.value();
    return typeof v === 'string' ? v : JSON.stringify(v, null, 2) ?? '';
  });

  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private readonly lang = new Compartment();
  private view?: EditorView;

  constructor() {
    afterNextRender(() => {
      this.view = new EditorView({
        parent: this.host().nativeElement,
        state: EditorState.create({
          doc: this.text(),
          extensions: [
            EditorState.readOnly.of(true),
            EditorView.contentAttributes.of({ 'aria-label': this.label() || `${this.language()} document` }),
            lineNumbers(),
            foldGutter(),
            highlightActiveLine(),
            bracketMatching(),
            search({ top: true }),
            highlightSelectionMatches(),
            keymap.of([...defaultKeymap, ...foldKeymap, ...searchKeymap]),
            this.lang.of(languages[this.language()]()),
            syntaxHighlighting(highlight),
            EditorView.lineWrapping,
            theme,
          ],
        }),
      });
    });
    // A new value replaces the document, keeping the viewer where it is.
    effect(() => {
      const text = this.text();
      const view = this.view;
      if (view && view.state.doc.toString() !== text) {
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
      }
    });
    effect(() => {
      const language = this.language();
      this.view?.dispatch({ effects: this.lang.reconfigure(languages[language]()) });
    });
    inject(DestroyRef).onDestroy(() => this.view?.destroy());
  }

  /** The editor, for tests and for applications that need more of CodeMirror. */
  get editor(): EditorView | undefined {
    return this.view;
  }
}
