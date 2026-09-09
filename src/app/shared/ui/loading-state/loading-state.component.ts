import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  imports: [],
  template: `<p class="loading-state" role="status">{{ message() }}</p>`,
  styles: `
    .loading-state {
      padding: var(--space-5) var(--space-3);
      text-align: center;
      font-size: var(--font-size-sm);
      color: var(--color-text-subtle);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingStateComponent {
  readonly message = input<string>('Chargement…');
}
