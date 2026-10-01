import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

/**
 * A destructive action in two clicks: the first asks, the second does it.
 * Escape or Cancel takes the question back; focus moves to Cancel while asking
 * and back to the button afterwards. (From the engram console.)
 */
@Component({
  selector: 'mp-confirm-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown.escape)': 'cancel()' },
  styles: `
    :host { display: inline-flex; align-items: center; gap: 8px; }
    .question { font-size: var(--mp-font-size-sm); color: var(--mp-fg-muted); }
  `,
  template: `
    @if (asking()) {
      <span class="question" role="alert">{{ question() }}</span>
      <button type="button" class="mp-btn-danger" [disabled]="busy()" (click)="confirm()">{{ confirmLabel() }}</button>
      <button #cancelButton type="button" class="mp-btn-ghost" (click)="cancel()">{{ cancelLabel() }}</button>
    } @else {
      <button
        #askButton
        type="button"
        [class]="danger() ? 'mp-btn-danger' : quiet() ? 'mp-btn-ghost' : 'mp-btn'"
        [disabled]="busy() || disabled()"
        (click)="ask()"
      >
        <ng-content />
      </button>
    }
  `,
})
export class MpConfirmButton {
  readonly question = input('Are you sure?');
  readonly confirmLabel = input('Yes');
  readonly cancelLabel = input('Cancel');
  readonly busy = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** The idle button in the danger style too. */
  readonly danger = input(false, { transform: booleanAttribute });
  /** A small, unobtrusive idle button, for actions in table rows. */
  readonly quiet = input(false, { transform: booleanAttribute });
  readonly confirmed = output<void>();

  protected readonly asking = signal(false);
  private readonly cancelButton = viewChild<ElementRef<HTMLButtonElement>>('cancelButton');
  private readonly askButton = viewChild<ElementRef<HTMLButtonElement>>('askButton');
  private readonly injector = inject(Injector);

  protected ask(): void {
    this.asking.set(true);
    afterNextRender(() => this.cancelButton()?.nativeElement.focus(), { injector: this.injector });
  }

  protected confirm(): void {
    this.asking.set(false);
    this.confirmed.emit();
    this.refocus();
  }

  protected cancel(): void {
    if (!this.asking()) return;
    this.asking.set(false);
    this.refocus();
  }

  private refocus(): void {
    afterNextRender(() => this.askButton()?.nativeElement.focus(), { injector: this.injector });
  }
}
