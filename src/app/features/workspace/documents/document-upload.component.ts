import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { DocumentsStore } from '../../../core/state/documents.store';
import { SessionStore } from '../../../core/state/session.store';

@Component({
  selector: 'app-document-upload',
  imports: [],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentUploadComponent {
  private readonly documentsStore = inject(DocumentsStore);
  private readonly sessionStore = inject(SessionStore);

  readonly uploadsInFlight = this.documentsStore.uploadsInFlight;
  readonly uploadError = this.documentsStore.uploadError;
  readonly isDragOver = signal(false);

  readonly quotaReached = computed(() => {
    const quota = this.sessionStore.quota();
    return !!quota && quota.documentsUsed >= quota.maxDocuments;
  });

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    this.uploadFiles(event.dataTransfer?.files ?? null);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.uploadFiles(input.files);
    input.value = '';
  }

  private uploadFiles(files: FileList | null): void {
    if (!files || this.quotaReached()) return;
    // Demo mode caps documents per session (max-documents), so upload one at a time is enough —
    // the quota badge and the disabled state above already communicate the limit.
    const file = files[0];
    if (file) {
      this.documentsStore.upload(file);
    }
  }
}
