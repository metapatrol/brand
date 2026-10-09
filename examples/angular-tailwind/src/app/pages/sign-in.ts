import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MpIcon, MpNotice, MpSecretInput, MpSignIn, MpSignInDivider, MpSignInFooter, safeReturnTo } from '@metapatrol/ng';

/**
 * The sign-in page, standing alone without the shell (route data bare). It
 * signs in with nothing: a console puts its own provider and token check
 * behind the same controls. Try the token "wrong".
 */
@Component({
  selector: 'app-sign-in',
  imports: [RouterLink, MpSignIn, MpSignInDivider, MpSignInFooter, MpSecretInput, MpIcon, MpNotice],
  template: `
    <mp-sign-in project="angular-tailwind" subtitle="Sign in to the console">
      @if (signedOut()) {
        <mp-notice tone="info">Signed out.</mp-notice>
      }
      <button type="button" class="mp-btn-primary w-full" [disabled]="redirecting()" (click)="sso()">
        <mp-icon name="log-in" />
        {{ redirecting() ? 'Redirecting…' : 'Sign in with SSO' }}
      </button>

      <mp-sign-in-divider />

      <form class="flex flex-col gap-2" (submit)="$event.preventDefault(); submit()">
        <label class="mp-field-label" for="token">Token</label>
        <mp-secret-input inputId="token" [(value)]="token" [invalid]="!!error()" describedBy="token-error" />
        @if (error(); as e) {
          <p id="token-error" class="mp-field-error" role="alert">{{ e }}</p>
        }
        <button type="submit" class="mp-btn" [disabled]="!token().trim()">Sign in with a token</button>
      </form>

      <ng-template mpSignInFooter>
        <a class="mp-link" [routerLink]="'/' + target()">Continue without signing in</a>
      </ng-template>
    </mp-sign-in>
  `,
})
export class SignInPage {
  private readonly router = inject(Router);
  /** ?returnTo=, where the visitor was going. */
  readonly returnTo = input<string>();
  /** ?signedOut=1, after the account menu's sign-out. */
  readonly signedOutParam = input<string>(undefined, { alias: 'signedOut' });
  protected readonly token = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly redirecting = signal(false);
  protected readonly signedOut = () => !!this.signedOutParam();
  protected readonly target = () => safeReturnTo(this.returnTo());

  protected sso(): void {
    this.redirecting.set(true);
    // a console would go to its provider here; the example comes straight back
    setTimeout(() => void this.router.navigateByUrl('/' + this.target()), 600);
  }

  protected submit(): void {
    if (this.token().trim() === 'wrong') {
      this.error.set('This token is not valid here.');
      return;
    }
    void this.router.navigateByUrl('/' + this.target());
  }
}
