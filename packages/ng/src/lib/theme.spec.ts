import { TestBed } from '@angular/core/testing';
import { provideMetapatrol } from './config';
import { ThemeService } from './theme';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('is dark without a choice and sets no attribute', () => {
    const theme = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(theme.theme()).toBe('dark');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('toggles, sets data-theme and remembers the choice under the prefix', () => {
    TestBed.configureTestingModule({ providers: [provideMetapatrol({ storagePrefix: 'engram' })] });
    const theme = TestBed.inject(ThemeService);
    theme.toggle();
    TestBed.tick();
    expect(theme.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('engram.theme')).toBe('light');
  });

  it('reads a remembered choice', () => {
    localStorage.setItem('mp.theme', 'light');
    expect(TestBed.inject(ThemeService).theme()).toBe('light');
  });
});
