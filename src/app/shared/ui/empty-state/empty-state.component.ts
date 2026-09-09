import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  imports: [],
  template: `<p class="empty-state">{{ message() }}</p>`,
  styles: `
    .empty-state {
      padding: var(--space-5) var(--space-3);
      text-align: center;
      font-size: var(--font-size-sm);
      color: var(--color-text-subtle);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly message = input.required<string>();
}
