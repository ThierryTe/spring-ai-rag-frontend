import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppError } from '../../../core/models/api-error.model';
import { DocumentsStore, UploadInFlight } from '../../../core/state/documents.store';
import { SessionQuota } from '../../../core/models/session.model';
import { SessionStore } from '../../../core/state/session.store';
import { DocumentUploadComponent } from './document-upload.component';

describe('DocumentUploadComponent', () => {
  function setup(options: {
    quota?: SessionQuota | null;
    uploadsInFlight?: readonly UploadInFlight[];
    uploadError?: AppError | null;
  }) {
    const upload = vi.fn();
    const documentsStoreStub = {
      upload,
      uploadsInFlight: () => options.uploadsInFlight ?? [],
      uploadError: () => options.uploadError ?? null,
    };
    const sessionStoreStub = { quota: () => options.quota ?? null };

    TestBed.configureTestingModule({
      providers: [
        { provide: DocumentsStore, useValue: documentsStoreStub },
        { provide: SessionStore, useValue: sessionStoreStub },
      ],
    });

    const fixture: ComponentFixture<DocumentUploadComponent> = TestBed.createComponent(DocumentUploadComponent);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement, upload };
  }

  const quotaFree: SessionQuota = { maxQuestions: 5, maxDocuments: 2, questionsUsed: 0, documentsUsed: 0 };
  const quotaFull: SessionQuota = { maxQuestions: 5, maxDocuments: 2, questionsUsed: 0, documentsUsed: 2 };

  it('enables the file input when the document quota is not reached', () => {
    const { element } = setup({ quota: quotaFree });
    const input = element.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.disabled).toBe(false);
    expect(element.textContent).toContain('parcourir');
  });

  it('disables the file input and shows a message once the document quota is reached', () => {
    const { element } = setup({ quota: quotaFull });
    const input = element.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(element.textContent).toContain('Quota de documents atteint pour cette session');
  });

  it('uploads a selected file through the store', () => {
    const { fixture, upload } = setup({ quota: quotaFree });
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    const fileList = { 0: file, length: 1, item: (i: number) => (i === 0 ? file : null) } as unknown as FileList;
    Object.defineProperty(input, 'files', { value: fileList });

    input.dispatchEvent(new Event('change'));

    expect(upload).toHaveBeenCalledWith(file);
  });

  it('renders progress bars for in-flight uploads', () => {
    const { element } = setup({ quota: quotaFree, uploadsInFlight: [{ fileName: 'a.pdf', progress: 42 }] });
    const bar = element.querySelector('.upload-progress__fill') as HTMLElement;
    expect(element.textContent).toContain('a.pdf');
    expect(bar.style.width).toBe('42%');
  });

  it('renders an upload error message', () => {
    const err: AppError = { kind: 'validation', status: 400, message: 'Le fichier depasse la taille maximale autorisee' };
    const { element } = setup({ quota: quotaFree, uploadError: err });
    expect(element.textContent).toContain(err.message);
  });
});
