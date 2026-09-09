import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { DocumentStatus } from '../../../core/models/document.model';
import { BadgeComponent, BadgeTone } from '../../ui/badge/badge.component';

const LABELS: Record<DocumentStatus, string> = {
  UPLOADED: 'En attente',
  PROCESSING: 'Traitement…',
  INDEXED: 'Indexé',
  FAILED: 'Échec',
};

const TONES: Record<DocumentStatus, BadgeTone> = {
  UPLOADED: 'warning',
  PROCESSING: 'warning',
  INDEXED: 'success',
  FAILED: 'danger',
};

@Component({
  selector: 'app-document-status-badge',
  imports: [BadgeComponent],
  template: `<app-badge [tone]="tone()">{{ label() }}</app-badge>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentStatusBadgeComponent {
  readonly status = input.required<DocumentStatus>();
  protected readonly label = computed(() => LABELS[this.status()]);
  protected readonly tone = computed(() => TONES[this.status()]);
}
