import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MpSecretInput, MpSignIn, MpSignInDivider, MpSignInFooter } from './sign-in';

@Component({
  imports: [MpSignIn, MpSignInDivider, MpSignInFooter, MpSecretInput],
  template: `
    <mp-sign-in project="soulforge" subtitle="Sign in to the library">
      <button class="sso" type="button">Sign in with SSO</button>
      <mp-sign-in-divider />
      <label for="token">Token</label>
      <mp-secret-input inputId="token" [(value)]="token" />
      <ng-template mpSignInFooter><a class="on" href="#">Continue without signing in</a></ng-template>
    </mp-sign-in>
  `,
})
class SignInHost {
  readonly token = signal('');
}

describe('MpSignIn', () => {
  it('stands alone: theme switch, mark, namespace, subtitle, the content in a panel, the footer under it', async () => {
    const fixture = TestBed.createComponent(SignInHost);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('mp-theme-toggle')).not.toBeNull();
    expect(el.querySelector('mp-mark')).not.toBeNull();
    expect(el.querySelector('h1')?.textContent).toBe('metapatrol / soulforge');
    expect(el.querySelector('.subtitle')?.textContent).toBe('Sign in to the library');
    expect(el.querySelector('section.mp-panel .sso')).not.toBeNull();
    expect(el.querySelector('mp-sign-in-divider')?.getAttribute('role')).toBe('separator');
    expect(el.querySelector('.footer a.on')?.textContent).toBe('Continue without signing in');
  });

  it('keeps a secret hidden until asked, and binds its value both ways', async () => {
    const fixture = TestBed.createComponent(SignInHost);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const input = el.querySelector<HTMLInputElement>('mp-secret-input input')!;
    const toggle = el.querySelector<HTMLButtonElement>('mp-secret-input button')!;
    expect(input.id).toBe('token');
    expect(input.type).toBe('password');
    expect(toggle.getAttribute('aria-label')).toBe('Show the token');

    input.value = 'abc';
    input.dispatchEvent(new Event('input'));
    expect(fixture.componentInstance.token()).toBe('abc');

    toggle.click();
    await fixture.whenStable();
    expect(input.type).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Hide the token');
  });
});
