import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

import { SourceCitationDto } from '../../../core/models/chat.model';
import { SourceCardComponent } from './source-card.component';

@Component({
  selector: 'app-source-list',
  imports: [SourceCardComponent],
  templateUrl: './source-list.component.html',
  styleUrl: './source-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceListComponent {
  readonly sources = input.required<readonly SourceCitationDto[]>();
  readonly expanded = signal(false);

  toggle(): void {
    this.expanded.update((v) => !v);
  }
}
