import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  inject,
  input,
  signal,
  TemplateRef,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MP_CONFIG, readStored, writeStored } from './config';
import { MpIcon } from './icon';
import { MpMark } from './mark';
import { MpNamespace } from './namespace';
import { MpThemeToggle } from './theme-toggle';
import { MpTip } from './tip';

export interface MpNavItem {
  path: string;
  label: string;
  /** a built-in icon or one registered with provideMpIcons() */
  icon?: string;
  /** match the path exactly, e.g. for "/" */
  exact?: boolean;
  /** A count beside the label, e.g. of what is not ready; 0 or absent shows nothing. */
  badge?: MpNavBadge;
}

export interface MpNavBadge {
  count: number;
  /** bad when one of them is at fault itself, warn when they only pass trouble on */
  tone?: 'bad' | 'warn' | 'info' | 'neutral';
  /** What the count stands for, on hover and focus: which ones, and why. */
  tip?: string;
  /** For screen readers after the number, e.g. "not ready". */
  label?: string;
}

export interface MpNavGroup {
  label: string;
  items: MpNavItem[];
  /** A small action beside the label, e.g. "+" to make one of the group's items. Not shown without a label. */
  action?: MpNavAction;
}

/** A link beside a nav group's label: an action, never shown as the current page. */
export interface MpNavAction {
  /** Where it leads, like an item's path (routerLink). */
  path: string;
  /** What it does, e.g. "New project": its tooltip and accessible name. */
  label: string;
  /** A built-in icon or one registered with provideMpIcons(); "plus" by default. */
  icon?: string;
}

/** The signed-in user or other account controls: <ng-template mpShellAccount>…</ng-template> */
@Directive({ selector: 'ng-template[mpShellAccount]' })
export class MpShellAccount {
  readonly template = inject(TemplateRef);
}

/** One line of status at the foot of the sidebar; the context says whether it is folded. */
@Directive({ selector: 'ng-template[mpShellStatus]' })
export class MpShellStatus {
  readonly template = inject<TemplateRef<{ $implicit: boolean }>>(TemplateRef);
}

/** Content for the top bar beside the account, e.g. a search: <ng-template mpShellHeader>…</ng-template> */
@Directive({ selector: 'ng-template[mpShellHeader]' })
export class MpShellHeader {
  readonly template = inject(TemplateRef);
}

/** Where the sidebar becomes a column (Tailwind's lg). */
const DESKTOP = '(min-width: 64rem)';

/**
 * The frame of a metapatrol console, as the engram console has it: a sidebar
 * with the mark, the namespace and grouped navigation, folding to icons on a
 * desktop and opening below the top bar on a phone; the theme switch and a
 * status line at its foot; the account at the top; a skip link to the content.
 *
 *   <mp-app-shell project="engram" [nav]="groups">
 *     <ng-template mpShellAccount>…</ng-template>
 *     <router-outlet />
 *   </mp-app-shell>
 */
@Component({
  selector: 'mp-app-shell',
  imports: [RouterLink, RouterLinkActive, NgTemplateOutlet, MpIcon, MpMark, MpNamespace, MpThemeToggle, MpTip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'navOpen.set(false)' },
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class MpAppShell {
  readonly project = input.required<string>();
  readonly nav = input<MpNavGroup[]>([]);
  /** Where the namespace links to. */
  readonly home = input('/');
  readonly org = input('metapatrol');

  protected readonly account = contentChild(MpShellAccount);
  protected readonly status = contentChild(MpShellStatus);
  protected readonly header = contentChild(MpShellHeader);

  private readonly key = `${inject(MP_CONFIG).storagePrefix}.sidebar.collapsed`;
  /** Desktop: the sidebar shows icons only. */
  readonly collapsed = signal(readStored(this.key) === '1');
  /** Phone: the navigation is open below the top bar. */
  readonly navOpen = signal(false);

  protected readonly expanded = computed(() => (isDesktop() ? !this.collapsed() : this.navOpen()));
  protected readonly toggleLabel = computed(() => (this.expanded() ? 'Collapse the navigation' : 'Expand the navigation'));

  toggleSidebar(): void {
    if (!isDesktop()) {
      this.navOpen.set(!this.navOpen());
      return;
    }
    const next = !this.collapsed();
    this.collapsed.set(next);
    writeStored(this.key, next ? '1' : '0');
  }

  /** With <base href> a plain #mp-main would leave the page. */
  protected skipToContent(event: Event): void {
    event.preventDefault();
    (event.target as HTMLElement).ownerDocument.getElementById('mp-main')?.focus();
  }
}

function isDesktop(): boolean {
  return typeof matchMedia === 'function' && matchMedia(DESKTOP).matches;
}
