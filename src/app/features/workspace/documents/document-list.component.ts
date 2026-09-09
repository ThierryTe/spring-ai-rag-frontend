import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { DocumentsStore } from '../../../core/state/documents.store';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { DocumentItemComponent } from './document-item.component';
import { DocumentUploadComponent } from './document-upload.component';

@Component({
  selector: 'app-document-list',
  imports: [DocumentUploadComponent, DocumentItemComponent, EmptyStateComponent, SkeletonComponent, ErrorStateComponent],
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentListComponent {
  protected readonly documentsStore = inject(DocumentsStore);

  protected readonly errorMessage = computed(() => {
    const err = this.documentsStore.listResource.error();
    return err && typeof err === 'object' && 'message' in err
      ? String((err as { message: unknown }).message)
      : 'Impossible de charger les documents.';
  });

  retryLoad(): void {
    this.documentsStore.listResource.reload();
  }
}
