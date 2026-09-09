import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { SourceCitationDto } from '../../../core/models/chat.model';
import { CardComponent } from '../../../shared/ui/card/card.component';

@Component({
  selector: 'app-source-card',
  imports: [CardComponent],
  templateUrl: './source-card.component.html',
  styleUrl: './source-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceCardComponent {
  readonly source = input.required<SourceCitationDto>();

  protected readonly similarityLabel = computed(() => `${Math.round(this.source().similarityScore * 100)}%`);
}
