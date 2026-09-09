import { HttpEvent, HttpEventType, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { AppError } from '../models/api-error.model';
import { DocumentUploadDto } from '../models/document.model';
import { PortalDocumentApi } from '../services/portal-document.api';
import { AuthStore } from './auth.store';
import { PortalDocumentsStore } from './portal-documents.store';

describe('PortalDocumentsStore', () => {
  // listResource's own GET (unlike the demo store, it's unconditional — no session gate) is
  // scheduled reactively by httpResource and isn't the concern of these upload-focused tests;
  // provideHttpClientTesting without a strict verify() lets it sit unflushed harmlessly.
  function setup() {
    const uploadSubject = new Subject<HttpEvent<DocumentUploadDto>>();
    const documentApiStub: Partial<PortalDocumentApi> = { upload: () => uploadSubject.asObservable() };
    const logout = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PortalDocumentApi, useValue: documentApiStub },
        { provide: AuthStore, useValue: { logout } },
      ],
    });

    const store = TestBed.inject(PortalDocumentsStore);
    return { store, uploadSubject, logout };
  }

  it('tracks an in-flight upload and its progress', () => {
    const { store, uploadSubject } = setup();
    store.upload(new File(['x'], 'a.pdf'), 1);
    expect(store.uploadsInFlight()).toEqual([{ fileName: 'a.pdf', progress: 0 }]);

    uploadSubject.next({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 } as HttpEvent<DocumentUploadDto>);
    expect(store.uploadsInFlight()).toEqual([{ fileName: 'a.pdf', progress: 50 }]);
  });

  it('clears the in-flight entry on a successful response', () => {
    const { store, uploadSubject } = setup();
    store.upload(new File(['x'], 'a.pdf'), 1);

    uploadSubject.next({
      type: HttpEventType.Response,
      body: { documentId: 'doc-1', status: 'UPLOADED' },
    } as HttpEvent<DocumentUploadDto>);

    expect(store.uploadsInFlight()).toEqual([]);
  });

  it('surfaces an upload error and clears the in-flight entry', () => {
    const { store, uploadSubject } = setup();
    store.upload(new File(['x'], 'a.pdf'), 1);

    const appError: AppError = {
      kind: 'validation',
      status: 400,
      message: 'Le fichier depasse la taille maximale autorisee',
    };
    uploadSubject.error(appError);

    expect(store.uploadError()).toEqual(appError);
    expect(store.uploadsInFlight()).toEqual([]);
  });

  it('logs out instead of surfacing an upload error when the JWT has expired', () => {
    const { store, uploadSubject, logout } = setup();
    store.upload(new File(['x'], 'a.pdf'), 1);

    const appError: AppError = { kind: 'auth_expired', status: 401, message: 'Votre session a expiré.' };
    uploadSubject.error(appError);

    expect(logout).toHaveBeenCalledOnce();
    expect(store.uploadError()).toBeNull();
  });
});
