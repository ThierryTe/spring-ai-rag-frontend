export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'INDEXED' | 'FAILED';

export const TERMINAL_STATUSES: ReadonlySet<DocumentStatus> = new Set(['INDEXED', 'FAILED']);

export interface DocumentSummaryDto {
  readonly id: string;
  readonly filename: string;
  readonly title: string | null;
  readonly status: DocumentStatus;
  readonly pageCount: number | null;
  readonly ingestedAt: string | null;
}

export interface DocumentUploadDto {
  readonly documentId: string;
  readonly status: DocumentStatus;
}


export interface DocumentItem {
  readonly id: string;
  readonly filename: string;
  readonly status: DocumentStatus;
  readonly pageCount: number | null;
  readonly sizeBytes?: number;
}

export function toDocumentItem(dto: DocumentSummaryDto, knownSizeBytes?: number): DocumentItem {
  return {
    id: dto.id,
    filename: dto.filename,
    status: dto.status,
    pageCount: dto.pageCount,
    sizeBytes: knownSizeBytes,
  };
}
