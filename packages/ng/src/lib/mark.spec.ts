import { TestBed } from '@angular/core/testing';
import { MpMark } from './mark';

function render(inputs: Record<string, unknown>) {
  const fixture = TestBed.createComponent(MpMark);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

describe('MpMark', () => {
  it('chooses the optical size by the rendered size', () => {
    expect(render({ size: 16 }).componentInstance.chosen()).toBe('favicon');
    expect(render({ size: 24 }).componentInstance.chosen()).toBe('small');
    expect(render({ size: 40 }).componentInstance.chosen()).toBe('small');
    expect(render({ size: 41 }).componentInstance.chosen()).toBe('primary');
    expect(render({ size: 16, variant: 'primary' }).componentInstance.chosen()).toBe('primary');
  });

  it('is coloured by the theme classes, never by fixed colours', () => {
    const el: HTMLElement = render({ size: 64 }).nativeElement;
    expect(el.querySelector('g.mp-mark-structure')).not.toBeNull();
    expect(el.querySelector('path.mp-mark-signal')).not.toBeNull();
    expect(el.innerHTML).not.toMatch(/fill="#/);
    expect(el.style.width).toBe('64px');
  });

  it('is decorative without a label and an image with one', () => {
    expect(render({}).nativeElement.getAttribute('aria-hidden')).toBe('true');
    const labelled: HTMLElement = render({ label: 'metapatrol' }).nativeElement;
    expect(labelled.getAttribute('role')).toBe('img');
    expect(labelled.getAttribute('aria-label')).toBe('metapatrol');
    expect(labelled.hasAttribute('aria-hidden')).toBe(false);
  });
});
