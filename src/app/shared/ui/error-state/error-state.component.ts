import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-error-state',
  imports: [ButtonComponent],
  template: `
    <div class="error-state" role="alert">
      <p>{{ message() }}</p>
      @if (retryable()) {
        <app-button variant="danger" size="sm" (click)="retry.emit()">Réessayer</app-button>
      }
    </div>
  `,
  styles: `
    .error-state {
      padding: var(--space-5) var(--space-3);
      text-align: center;
      font-size: var(--font-size-sm);
      color: var(--color-danger);
    }
    app-button {
      margin-top: var(--space-2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorStateComponent {
  readonly message = input.required<string>();
  readonly retryable = input(true);
  readonly retry = output<void>();
}
