import { HttpEventType, httpResource } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { API_BASE } from '../config/api.config';
import { AppError } from '../models/api-error.model';
import {
  DocumentItem,
  DocumentSummaryDto,
  TERMINAL_STATUSES,
  toDocumentItem,
} from '../models/document.model';
import { PortalDocumentApi } from '../services/portal-document.api';
import { AuthStore } from './auth.store';

const POLL_INTERVAL_MS = 3000;

export interface UploadInFlight {
  readonly fileName: string;
  readonly progress: number;
}


@Injectable({ providedIn: 'root' })
export class PortalDocumentsStore {
  private readonly documentApi = inject(PortalDocumentApi);
  private readonly authStore = inject(AuthStore);

  private readonly knownSizes = new Map<string, number>();

  readonly listResource = httpResource<DocumentSummaryDto[]>(() => ({ url: `${API_BASE}/documents` }), {
    defaultValue: [],
  });

  readonly documents = computed<DocumentItem[]>(() => {
    if (!this.listResource.hasValue()) return [];
    return this.listResource.value().map((dto) => toDocumentItem(dto, this.knownSizes.get(dto.id)));
  });

  readonly hasPendingDocuments = computed(() =>
    this.documents().some((doc) => !TERMINAL_STATUSES.has(doc.status)),
  );

  readonly uploadError = signal<AppError | null>(null);
  readonly uploadsInFlight = signal<readonly UploadInFlight[]>([]);

  private pollHandle: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      if (this.hasPendingDocuments()) {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    });

    effect(() => {
      if (isAuthExpiredError(this.listResource.error())) {
        this.authStore.logout();
      }
    });
  }

  upload(file: File, departmentId: number): void {
    this.uploadError.set(null);
    this.uploadsInFlight.update((list) => [...list, { fileName: file.name, progress: 0 }]);

    this.documentApi.upload(file, departmentId).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.setProgress(file.name, Math.round((100 * event.loaded) / event.total));
        } else if (event.type === HttpEventType.Response && event.body) {
          this.knownSizes.set(event.body.documentId, file.size);
          this.removeUpload(file.name);
          this.listResource.reload();
        }
      },
      error: (err: AppError) => {
        this.removeUpload(file.name);
        if (isAuthExpiredError(err)) {
          this.authStore.logout();
          return;
        }
        this.uploadError.set(err);
      },
    });
  }

  destroyPolling(): void {
    this.stopPolling();
  }

  private setProgress(fileName: string, progress: number): void {
    this.uploadsInFlight.update((list) =>
      list.map((u) => (u.fileName === fileName ? { ...u, progress } : u)),
    );
  }

  private removeUpload(fileName: string): void {
    this.uploadsInFlight.update((list) => list.filter((u) => u.fileName !== fileName));
  }

  private startPolling(): void {
    if (this.pollHandle) return;
    this.pollHandle = setInterval(() => this.listResource.reload(), POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (!this.pollHandle) return;
    clearInterval(this.pollHandle);
    this.pollHandle = null;
  }
}

function isAuthExpiredError(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as Partial<AppError>).kind === 'auth_expired';
}
