import { TestBed } from '@angular/core/testing';
import { MpIcon, provideMpIcons } from './icon';

function render(name: string) {
  const fixture = TestBed.createComponent(MpIcon);
  fixture.componentRef.setInput('name', name);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('MpIcon', () => {
  it('renders a built-in icon, hidden from assistive technology', () => {
    const el = render('chevron-left');
    expect(el.querySelector('svg path')?.getAttribute('d')).toBe('m15 18-6-6 6-6');
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders icons the application registered', () => {
    TestBed.configureTestingModule({ providers: [provideMpIcons({ dot: '<circle cx="12" cy="12" r="4"/>' })] });
    expect(render('dot').querySelector('circle')).not.toBeNull();
  });

  it('warns and renders nothing for an unknown name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(render('nope').querySelector('svg')?.innerHTML).toBe('');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"nope"'));
    warn.mockRestore();
  });
});
