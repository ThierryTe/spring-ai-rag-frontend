import { HttpEvent, HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { AppError } from '../models/api-error.model';
import { DocumentUploadDto } from '../models/document.model';
import { DocumentApi } from '../services/document.api';
import { DocumentsStore } from './documents.store';
import { SessionStore } from './session.store';

describe('DocumentsStore', () => {
  // sessionId stays null throughout: the listResource factory then returns `undefined` and
  // never issues a request, so these upload-focused tests don't need to flush a GET.
  function setup() {
    const uploadSubject = new Subject<HttpEvent<DocumentUploadDto>>();
    const documentApiStub: Partial<DocumentApi> = { upload: () => uploadSubject.asObservable() };
    const recordDocumentUploaded = vi.fn();
    const handleExpiry = vi.fn();
    const sessionStoreStub = {
      sessionId: () => null,
      recordDocumentUploaded,
      handleExpiry,
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DocumentApi, useValue: documentApiStub },
        { provide: SessionStore, useValue: sessionStoreStub },
      ],
    });

    const store = TestBed.inject(DocumentsStore);
    const controller = TestBed.inject(HttpTestingController);
    return { store, uploadSubject, recordDocumentUploaded, handleExpiry, controller };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('tracks an in-flight upload and its progress', () => {
    const { store, uploadSubject } = setup();
    store.upload(new File(['x'], 'a.pdf'));
    expect(store.uploadsInFlight()).toEqual([{ fileName: 'a.pdf', progress: 0 }]);

    uploadSubject.next({ type: HttpEventType.UploadProgress, loaded: 50, total: 100 } as HttpEvent<DocumentUploadDto>);
    expect(store.uploadsInFlight()).toEqual([{ fileName: 'a.pdf', progress: 50 }]);
  });

  it('clears the in-flight entry and records the quota on a successful response', () => {
    const { store, uploadSubject, recordDocumentUploaded } = setup();
    store.upload(new File(['x'], 'a.pdf'));

    uploadSubject.next({
      type: HttpEventType.Response,
      body: { documentId: 'doc-1', status: 'UPLOADED' },
    } as HttpEvent<DocumentUploadDto>);

    expect(store.uploadsInFlight()).toEqual([]);
    expect(recordDocumentUploaded).toHaveBeenCalledOnce();
  });

  it('surfaces an upload error and clears the in-flight entry', () => {
    const { store, uploadSubject } = setup();
    store.upload(new File(['x'], 'a.pdf'));

    const appError: AppError = {
      kind: 'validation',
      status: 400,
      message: 'Le fichier depasse la taille maximale autorisee',
    };
    uploadSubject.error(appError);

    expect(store.uploadError()).toEqual(appError);
    expect(store.uploadsInFlight()).toEqual([]);
  });

  it('routes to landing instead of surfacing an upload error when the session has expired', () => {
    const { store, uploadSubject, handleExpiry } = setup();
    store.upload(new File(['x'], 'a.pdf'));

    const appError: AppError = {
      kind: 'session_expired',
      status: 401,
      message: 'Votre session a expiré. Veuillez démarrer une nouvelle session.',
    };
    uploadSubject.error(appError);

    expect(handleExpiry).toHaveBeenCalledOnce();
    expect(store.uploadError()).toBeNull();
  });
});
