import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';

import { AuthStore } from '../../../core/state/auth.store';
import { PortalDocumentsStore } from '../../../core/state/portal-documents.store';

@Component({
  selector: 'app-portal-document-upload',
  imports: [],
  templateUrl: './portal-document-upload.component.html',
  styleUrl: './portal-document-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalDocumentUploadComponent {
  private readonly documentsStore = inject(PortalDocumentsStore);
  protected readonly authStore = inject(AuthStore);

  readonly uploadsInFlight = this.documentsStore.uploadsInFlight;
  readonly uploadError = this.documentsStore.uploadError;
  readonly isDragOver = signal(false);

  private readonly departmentSelect = viewChild.required<ElementRef<HTMLSelectElement>>('department');

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
    const file = files?.[0];
    const departmentId = Number(this.departmentSelect().nativeElement.value);
    if (!file || !departmentId) return;
    this.documentsStore.upload(file, departmentId);
  }
}
