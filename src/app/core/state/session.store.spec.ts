import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AppError } from '../models/api-error.model';
import { DemoSessionDto } from '../models/session.model';
import { SessionApi } from '../services/session.api';
import { SessionStore } from './session.store';

describe('SessionStore', () => {
  const dto: DemoSessionDto = {
    sessionId: 'session-1',
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    maxQuestions: 5,
    maxDocuments: 2,
    questionsUsed: 0,
    documentsUsed: 0,
  };

  function setup(apiStub: Partial<SessionApi>) {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: SessionApi, useValue: apiStub }, provideRouter([])],
    });
    return TestBed.inject(SessionStore);
  }

  it('has no session initially', () => {
    const store = setup({ createSession: () => of(dto) });
    expect(store.hasSession()).toBe(false);
    expect(store.sessionId()).toBeNull();
  });

  it('populates session state on successful creation', () => {
    const store = setup({ createSession: () => of(dto) });
    store.createSession().subscribe();
    expect(store.hasSession()).toBe(true);
    expect(store.sessionId()).toBe('session-1');
    expect(store.quota()).toEqual({
      maxQuestions: 5,
      maxDocuments: 2,
      questionsUsed: 0,
      documentsUsed: 0,
    });
    expect(store.isCreating()).toBe(false);
  });

  it('exposes the error and clears loading state on failure', () => {
    const appError: AppError = { kind: 'network', status: 0, message: 'Impossible de contacter le serveur.' };
    const store = setup({ createSession: () => throwError(() => appError) });
    store.createSession().subscribe({ error: () => {} });
    expect(store.hasSession()).toBe(false);
    expect(store.isCreating()).toBe(false);
    expect(store.error()).toEqual(appError);
  });

  it('increments quota optimistically', () => {
    const store = setup({ createSession: () => of(dto) });
    store.createSession().subscribe();
    store.recordQuestionAsked();
    store.recordDocumentUploaded();
    expect(store.quota()).toEqual({
      maxQuestions: 5,
      maxDocuments: 2,
      questionsUsed: 1,
      documentsUsed: 1,
    });
  });

  it('treats a session with a past expiry as expired', () => {
    const expiredDto: DemoSessionDto = { ...dto, expiresAt: new Date(Date.now() - 1000).toISOString() };
    const store = setup({ createSession: () => of(expiredDto) });
    store.createSession().subscribe();
    expect(store.isExpiredNow()).toBe(true);
  });

  it('clears the session', () => {
    const store = setup({ createSession: () => of(dto) });
    store.createSession().subscribe();
    store.clear();
    expect(store.hasSession()).toBe(false);
    expect(sessionStorage.getItem('ai-compliance-copilot.demo-session')).toBeNull();
  });

  it('handleExpiry clears the session and navigates back to landing', () => {
    const store = setup({ createSession: () => of(dto) });
    store.createSession().subscribe();
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');

    store.handleExpiry();

    expect(store.hasSession()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });
});
