import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AuthStore } from '../../../core/state/auth.store';
import { PortalDocumentsStore } from '../../../core/state/portal-documents.store';
import { DocumentItemComponent } from '../../workspace/documents/document-item.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { PortalDocumentUploadComponent } from './portal-document-upload.component';

@Component({
  selector: 'app-portal-document-list',
  imports: [
    PortalDocumentUploadComponent,
    DocumentItemComponent,
    EmptyStateComponent,
    SkeletonComponent,
    ErrorStateComponent,
  ],
  templateUrl: './portal-document-list.component.html',
  styleUrl: './portal-document-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalDocumentListComponent {
  protected readonly documentsStore = inject(PortalDocumentsStore);
  private readonly authStore = inject(AuthStore);


  protected readonly canUpload = computed(() => {
    const role = this.authStore.currentUser()?.roleCode;
    return role === 'MANAGER' || role === 'ADMIN';
  });

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
