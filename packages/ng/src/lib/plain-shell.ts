import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MpMark } from './mark';
import { MpNamespace } from './namespace';
import { MpThemeToggle } from './theme-toggle';

/**
 * The project's lockup, "metapatrol / <project>" beside the mark, from the
 * brand's components rather than an image: colours and type follow the
 * theme. Compact at the top of a page, large on a start page.
 * (From the websearch and webfetch consoles.)
 */
@Component({
  selector: 'mp-lockup',
  imports: [MpMark, MpNamespace],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.lg]': "size() === 'lg'" },
  styles: `
    @layer components {
      :host {
        display: inline-flex; align-items: center; gap: 10px;
        font-size: 15px; line-height: 1; color: var(--mp-fg); white-space: nowrap;
      }
      :host(.lg) { gap: 18px; font-size: clamp(24px, 6vw, 34px); letter-spacing: -0.01em; }
    }
  `,
  template: `<mp-mark [size]="size() === 'lg' ? 64 : 26" /><mp-namespace [project]="project()" [org]="org()" />`,
})
export class MpLockup {
  readonly project = input.required<string>();
  readonly org = input('metapatrol');
  readonly size = input<'sm' | 'lg'>('sm');
}

/**
 * The plain frame of a tool that does one thing — a search, a fetch — and
 * so needs no sidebar: the compact lockup at the top left, leading to the
 * start page, room beside it ([mpFrameTop]: the search box, tabs), and the
 * page under it on the same left edge. The start page itself has no frame:
 * the large lockup and its one field. With mp-footer-bar at the foot of the
 * root, it is the other shell beside mp-app-shell. (From websearch and webfetch.)
 *
 *   <mp-frame project="websearch">
 *     <form mpFrameTop role="search">…</form>
 *     …the page…
 *   </mp-frame>
 */
@Component({
  selector: 'mp-frame',
  imports: [RouterLink, MpLockup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @layer components { :host { display: block; } }
    header { padding-block: 14px 12px; border-bottom: 1px solid var(--mp-line); }
    .row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 32px; min-height: 44px; }
    .page { padding: 24px 0 48px; }
    .row, .page { padding-inline: 16px; }
    @media (min-width: 64rem) { .row, .page { padding-inline: 24px; } }
    .home { text-decoration: none; border-radius: var(--mp-radius-md); }
    .home:focus-visible { outline: 2px solid var(--mp-signal-fg); outline-offset: 4px; }
  `,
  template: `
    <header>
      <div class="row">
        <a class="home" [routerLink]="home()" [attr.aria-label]="homeName()"><mp-lockup [project]="project()" [org]="org()" /></a>
        <ng-content select="[mpFrameTop]" />
      </div>
    </header>
    <div class="page"><ng-content /></div>
  `,
})
export class MpFrame {
  readonly project = input.required<string>();
  readonly org = input('metapatrol');
  /** Where the lockup leads: the start page. */
  readonly home = input<string | unknown[]>('/');
  /** The lockup link's accessible name. */
  readonly homeLabel = input<string>();
  protected readonly homeName = computed(() => this.homeLabel() ?? `${this.project()}: start page`);
}

/** A link in the footer bar. */
export interface MpFooterLink {
  path: string;
  label: string;
  /** Match the path exactly, e.g. for "/". */
  exact?: boolean;
}

/**
 * The thin bar at the foot of every page, as a search engine has it: the
 * project and its version on the left; on the right quiet links to the
 * pages (the app leaves out what someone may not open), the content —
 * the language, who is signed in, the way out — and the theme switch.
 * (From websearch and webfetch.)
 *
 *   <mp-footer-bar project="websearch" [version]="version" [links]="links">
 *     <button class="mp-quiet-link" (click)="signOut()">Sign out</button>
 *   </mp-footer-bar>
 */
@Component({
  selector: 'mp-footer-bar',
  imports: [RouterLink, RouterLinkActive, MpThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @layer components { :host { display: block; } }
    footer {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 20px;
      padding: 10px 16px; font-size: var(--mp-font-size-sm);
      background: var(--mp-surface); border-top: 1px solid var(--mp-line);
    }
    @media (min-width: 64rem) { footer { padding-inline: 24px; } }
    .version { color: var(--mp-fg-subtle); }
    .version span { font-family: var(--mp-font-family-mono); }
    nav { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 20px; }
  `,
  template: `
    <footer>
      <span class="version">
        @if (version()) {
          {{ project() }} <span>{{ version() }}</span>
        }
      </span>
      <nav [attr.aria-label]="project()">
        @for (l of links(); track l.path) {
          <a
            class="mp-quiet-link"
            [routerLink]="l.path"
            routerLinkActive="mp-here"
            [routerLinkActiveOptions]="{ exact: !!l.exact }"
            >{{ l.label }}</a
          >
        }
        <ng-content />
        <mp-theme-toggle />
      </nav>
    </footer>
  `,
})
export class MpFooterBar {
  readonly project = input.required<string>();
  /** The running version, e.g. from the backend; nothing shown without one. */
  readonly version = input<string | null | undefined>();
  readonly links = input<readonly MpFooterLink[]>([]);
}
