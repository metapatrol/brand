import { booleanAttribute, ChangeDetectionStrategy, Component, contentChild, Directive, input, model, signal, TemplateRef, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MpIcon } from './icon';
import { MpMark } from './mark';
import { MpNamespace } from './namespace';
import { MpThemeToggle } from './theme-toggle';

/** What goes under the panel, e.g. "Continue without signing in": <ng-template mpSignInFooter>…</ng-template> */
@Directive({ selector: 'ng-template[mpSignInFooter]' })
export class MpSignInFooter {
  readonly template = inject(TemplateRef);
}

/**
 * A console's sign-in page, standing alone without the shell around it: the
 * theme switch, the mark and "metapatrol / <project>" above a short line, and
 * a panel for whatever the console signs in with — a provider, a token —
 * which the content brings. How it signs in stays the console's.
 * (From the soulforge console.)
 *
 *   <mp-sign-in project="soulforge" subtitle="Sign in to the library">
 *     <button class="mp-btn-primary">Sign in with SSO</button>
 *     <mp-sign-in-divider />
 *     <form>…<mp-secret-input inputId="token" [(value)]="token" />…</form>
 *   </mp-sign-in>
 */
@Component({
  selector: 'mp-sign-in',
  imports: [NgTemplateOutlet, MpMark, MpNamespace, MpThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @layer components {
      :host { display: flex; flex-direction: column; min-height: 100dvh; padding: 24px 16px; background: var(--mp-bg); }
    }
    .top { display: flex; justify-content: flex-end; }
    main { display: flex; flex: 1; align-items: center; justify-content: center; padding: 32px 0; }
    .column { width: 100%; max-width: 24rem; }
    .head { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 24px; text-align: center; }
    h1 { margin: 0; font-size: var(--mp-font-size-xl); font-weight: var(--mp-font-weight-regular); color: var(--mp-fg); }
    .subtitle { margin: 0; font-size: var(--mp-font-size-sm); color: var(--mp-fg-muted); }
    .panel { display: flex; flex-direction: column; gap: 16px; }
    .footer { margin-top: 16px; text-align: center; font-size: var(--mp-font-size-sm); }
  `,
  template: `
    <div class="top"><mp-theme-toggle /></div>
    <main>
      <div class="column">
        <div class="head">
          <mp-mark [size]="48" />
          <h1><mp-namespace [project]="project()" [org]="org()" /></h1>
          @if (subtitle()) {
            <p class="subtitle">{{ subtitle() }}</p>
          }
        </div>
        <section class="mp-panel panel"><ng-content /></section>
        @if (footer(); as f) {
          <div class="footer"><ng-container [ngTemplateOutlet]="f.template" /></div>
        }
      </div>
    </main>
  `,
})
export class MpSignIn {
  readonly project = input.required<string>();
  readonly org = input('metapatrol');
  /** One line under the name: what signing in is for. */
  readonly subtitle = input<string>();
  protected readonly footer = contentChild(MpSignInFooter);
}

/** The "or" between two ways of signing in. */
@Component({
  selector: 'mp-sign-in-divider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'separator' },
  styles: `
    @layer components {
      :host { display: flex; align-items: center; gap: 12px; font-size: var(--mp-font-size-xs); color: var(--mp-fg-subtle); }
    }
    .line { flex: 1; height: 1px; background: var(--mp-line); }
  `,
  template: `<span class="line"></span>{{ label() }}<span class="line"></span>`,
})
export class MpSignInDivider {
  readonly label = input('or');
}

/**
 * A field for a secret — a token, a key — hidden as it is typed, with a
 * button to show it. Label it with a <label for> on its inputId.
 *
 *   <label class="mp-field-label" for="token">Token</label>
 *   <mp-secret-input inputId="token" [(value)]="token" />
 */
@Component({
  selector: 'mp-secret-input',
  imports: [MpIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @layer components { :host { display: block; position: relative; } }
    input { padding-right: 36px; font-family: var(--mp-font-family-mono); }
    button {
      position: absolute; top: 0; bottom: 0; right: 0; display: grid; place-items: center; width: 36px; padding: 0;
      font-size: 16px; color: var(--mp-fg-subtle); background: transparent; border: 0; cursor: pointer;
    }
    button:hover { color: var(--mp-fg); }
  `,
  template: `
    <input
      class="mp-input"
      [id]="inputId()"
      [name]="name() || inputId()"
      [type]="shown() ? 'text' : 'password'"
      [value]="value()"
      [attr.placeholder]="placeholder() || null"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-describedby]="describedBy() || null"
      autocomplete="off"
      spellcheck="false"
      (input)="value.set($any($event.target).value)"
    />
    <button
      type="button"
      [attr.aria-label]="shown() ? 'Hide the ' + what() : 'Show the ' + what()"
      [attr.aria-pressed]="shown()"
      (click)="shown.set(!shown())"
    >
      <mp-icon [name]="shown() ? 'eye-off' : 'eye'" />
    </button>
  `,
})
export class MpSecretInput {
  readonly value = model('');
  readonly inputId = input.required<string>();
  readonly name = input<string>();
  readonly placeholder = input<string>();
  /** What the secret is, for the show and hide buttons: "Show the token". */
  readonly what = input('token');
  readonly invalid = input(false, { transform: booleanAttribute });
  /** The id of the message that explains an invalid value. */
  readonly describedBy = input<string>();
  protected readonly shown = signal(false);
}
