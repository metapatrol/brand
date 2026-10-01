import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import MarkdownIt from 'markdown-it';

/*
 * Markdown is written by whoever runs a backend or stores a memory, so it is
 * rendered as text that may not do anything (from the engram and mcp-gateway
 * consoles):
 *
 *   - html: false — HTML in the Markdown is escaped, never parsed.
 *   - markdown-it refuses javascript:, vbscript:, file: and data: links.
 *   - Angular sanitizes what goes into [innerHTML] again.
 *
 * Links open in a new tab, without an opener or a referrer.
 */
const md = new MarkdownIt({ html: false, linkify: true, typographer: false, breaks: false });

const defaultLinkOpen =
  md.renderer.rules['link_open'] ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules['link_open'] = (tokens, idx, options, env, self) => {
  tokens[idx]!.attrSet('target', '_blank');
  tokens[idx]!.attrSet('rel', 'noopener noreferrer');
  return defaultLinkOpen(tokens, idx, options, env, self);
};

export function renderMarkdown(source: string): string {
  return md.render(source);
}

/** The first line of a Markdown text without its syntax, for tables and lists. */
export function markdownPreview(source: string, max = 160): string {
  const line =
    source
      .split('\n')
      .map((l) => l.replace(/^\s*(#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s*)/, '').trim())
      .find((l) => l.length > 0) ?? '';
  // Drop emphasis and code markers, but keep underscores inside names (npm_token).
  const plain = line.replace(/[*`]/g, '').replace(/(^|[\s(])_{1,2}([^_\s][^_]*?)_{1,2}(?=$|[\s).,;:!?])/g, '$1$2');
  return plain.length > max ? plain.slice(0, max - 1) + '…' : plain;
}

/** Markdown rendered in the console's type (mp-markdown). */
@Component({
  selector: 'mp-markdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mp-markdown', '[innerHTML]': 'html()' },
  styles: `:host { display: block; min-width: 0; }`,
  template: ``,
})
export class MpMarkdown {
  readonly source = input.required<string>();
  // a string, so Angular's sanitizer runs over it
  protected readonly html = computed(() => renderMarkdown(this.source() ?? ''));
}
