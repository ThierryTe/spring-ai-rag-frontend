import { DocumentSummaryDto, toDocumentItem } from './document.model';

describe('toDocumentItem', () => {
  const dto: DocumentSummaryDto = {
    id: 'doc-1',
    filename: 'contrat.pdf',
    title: 'Contrat',
    status: 'INDEXED',
    pageCount: 12,
    ingestedAt: '2026-09-06T10:00:00',
  };

  it('maps DTO fields and attaches a locally-known size when provided', () => {
    expect(toDocumentItem(dto, 2_400_000)).toEqual({
      id: 'doc-1',
      filename: 'contrat.pdf',
      status: 'INDEXED',
      pageCount: 12,
      sizeBytes: 2_400_000,
    });
  });

  it('leaves size undefined when not known locally (e.g. after a page reload)', () => {
    expect(toDocumentItem(dto).sizeBytes).toBeUndefined();
  });
});
