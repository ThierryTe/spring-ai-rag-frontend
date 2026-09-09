import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { DocumentItem } from '../../../core/models/document.model';
import { DocumentStatusBadgeComponent } from '../../../shared/components/document-status-badge/document-status-badge.component';

@Component({
  selector: 'app-document-item',
  imports: [DocumentStatusBadgeComponent],
  templateUrl: './document-item.component.html',
  styleUrl: './document-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentItemComponent {
  readonly document = input.required<DocumentItem>();

  protected readonly sizeLabel = computed(() => {
    const bytes = this.document().sizeBytes;
    if (bytes === undefined) return null;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  });
}
