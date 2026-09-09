import { HttpEventType, httpResource } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { API_BASE, DEMO_SESSION_HEADER } from '../config/api.config';
import { AppError } from '../models/api-error.model';
import {
  DocumentItem,
  DocumentSummaryDto,
  TERMINAL_STATUSES,
  toDocumentItem,
} from '../models/document.model';
import { DocumentApi } from '../services/document.api';
import { SessionStore } from './session.store';

const POLL_INTERVAL_MS = 3000;

export interface UploadInFlight {
  readonly fileName: string;
  readonly progress: number;
}

@Injectable({ providedIn: 'root' })
export class DocumentsStore {
  private readonly documentApi = inject(DocumentApi);
  private readonly sessionStore = inject(SessionStore);


  private readonly knownSizes = new Map<string, number>();

  readonly listResource = httpResource<DocumentSummaryDto[]>(
    () => {
      const sessionId = this.sessionStore.sessionId();
      return sessionId
        ? { url: `${API_BASE}/demo/documents`, headers: { [DEMO_SESSION_HEADER]: sessionId } }
        : undefined;
    },
    { defaultValue: [] },
  );

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
      const err = this.listResource.error();
      if (isSessionExpiredError(err)) {
        this.sessionStore.handleExpiry();
      }
    });
  }

  upload(file: File): void {
    this.uploadError.set(null);
    this.uploadsInFlight.update((list) => [...list, { fileName: file.name, progress: 0 }]);

    this.documentApi.upload(file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.setProgress(file.name, Math.round((100 * event.loaded) / event.total));
        } else if (event.type === HttpEventType.Response && event.body) {
          this.knownSizes.set(event.body.documentId, file.size);
          this.sessionStore.recordDocumentUploaded();
          this.removeUpload(file.name);
          this.listResource.reload();
        }
      },
      error: (err: AppError) => {
        this.removeUpload(file.name);
        if (isSessionExpiredError(err)) {
          this.sessionStore.handleExpiry();
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

function isSessionExpiredError(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as Partial<AppError>).kind === 'session_expired';
}
