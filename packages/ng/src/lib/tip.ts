import { DOCUMENT } from '@angular/common';
import { booleanAttribute, computed, DestroyRef, Directive, ElementRef, inject, input, signal } from '@angular/core';

let next = 0;

/**
 * A tooltip for what is behind an element: shown on hover and on keyboard
 * focus after a moment, in the console's colours (mp-tip), line breaks kept.
 * It is placed on the page rather than inside the element, so a table's
 * scroll container does not clip it. An empty text shows nothing.
 * (From the mcp-gateway console.)
 *
 *   <span class="mp-pill" [mpTip]="condition.message" focusable>…</span>
 */
@Directive({
  selector: '[mpTip]',
  host: {
    '(mouseenter)': 'schedule()',
    '(focusin)': 'schedule()',
    '(mouseleave)': 'hide()',
    '(focusout)': 'hide()',
    '(keydown.escape)': 'hide()',
    '[attr.tabindex]': '(focusable() || keyboard) && text() ? 0 : null',
    '[attr.aria-describedby]': 'shown() ? id : null',
  },
})
export class MpTip {
  readonly mpTip = input<string | null | undefined>();
  /** Make the element reachable by keyboard, for elements that are not already. */
  readonly focusable = input(false, { transform: booleanAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  protected readonly id = `mp-tip-${next++}`;
  protected readonly shown = signal(false);
  private timer?: ReturnType<typeof setTimeout>;
  private el?: HTMLElement;
  private source?: () => string | null | undefined;
  protected keyboard = false;
  protected readonly text = computed(() => this.mpTip() || this.source?.() || '');

  constructor() {
    inject(DestroyRef).onDestroy(() => this.hide());
  }

  /**
   * For a component that carries the tip as a host directive: where its text
   * comes from, and whether the component is reachable by keyboard for it.
   */
  from(source: () => string | null | undefined, opts: { focusable?: boolean } = {}): void {
    this.source = source;
    this.keyboard = !!opts.focusable;
  }

  protected schedule(): void {
    const text = this.text();
    if (!text) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.show(text), 250);
  }

  protected hide(): void {
    clearTimeout(this.timer);
    this.document.defaultView?.removeEventListener('scroll', this.onScroll, { capture: true });
    this.el?.remove();
    this.el = undefined;
    this.shown.set(false);
  }

  private show(text: string): void {
    this.hide();
    const el = this.document.createElement('div');
    el.id = this.id;
    el.setAttribute('role', 'tooltip');
    el.className = 'mp-tip';
    el.textContent = text;
    this.document.body.appendChild(el);

    const anchor = this.host.nativeElement.getBoundingClientRect();
    const tip = el.getBoundingClientRect();
    const width = this.document.defaultView?.innerWidth ?? 1024;
    const gap = 6;
    // above the element when there is room, below it otherwise; inside the window sideways
    const top = anchor.top - tip.height - gap >= 0 ? anchor.top - tip.height - gap : anchor.bottom + gap;
    const left = Math.min(Math.max(8, anchor.left + anchor.width / 2 - tip.width / 2), width - tip.width - 8);
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
    this.el = el;
    this.shown.set(true);
    // a scroll moves the element away from where the tooltip was placed
    this.document.defaultView?.addEventListener('scroll', this.onScroll, { once: true, capture: true });
  }

  private readonly onScroll = () => this.hide();
}
