import { TestBed } from '@angular/core/testing';
import { markdownPreview, MpMarkdown, renderMarkdown } from './markdown';

describe('markdown', () => {
  it('escapes HTML and refuses script links', () => {
    expect(renderMarkdown('<script>alert(1)</script>')).not.toContain('<script>');
    expect(renderMarkdown('[x](javascript:alert(1))')).not.toContain('href="javascript');
  });

  it('opens links in a new tab without opener', () => {
    expect(renderMarkdown('[docs](https://example.org)')).toContain('target="_blank" rel="noopener noreferrer"');
  });

  it('previews the first line without syntax, keeping names with underscores', () => {
    expect(markdownPreview('\n## Use the **npm_token** for `ci`\nmore')).toBe('Use the npm_token for ci');
    expect(markdownPreview('x'.repeat(200), 10)).toBe('xxxxxxxxx…');
  });

  it('renders into the element with the mp-markdown class', async () => {
    const fixture = TestBed.createComponent(MpMarkdown);
    fixture.componentRef.setInput('source', '# Title\n\n- a\n- b');
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.classList).toContain('mp-markdown');
    expect(el.querySelector('h1')?.textContent).toBe('Title');
    expect(el.querySelectorAll('li').length).toBe(2);
  });
});
