import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { SessionStore } from '../state/session.store';
import { demoSessionInterceptor } from './demo-session.interceptor';

describe('demoSessionInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let sessionStore: { sessionId: () => string | null };

  beforeEach(() => {
    sessionStore = { sessionId: () => null };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([demoSessionInterceptor])),
        provideHttpClientTesting(),
        { provide: SessionStore, useFactory: () => sessionStore },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('adds X-Demo-Session-Id to /api/demo/** calls when a session exists', () => {
    sessionStore.sessionId = () => 'session-1';
    http.get('/api/demo/documents').subscribe();
    const req = controller.expectOne('/api/demo/documents');
    expect(req.request.headers.get('X-Demo-Session-Id')).toBe('session-1');
    req.flush([]);
  });

  it('does not add the header when there is no session yet', () => {
    http.post('/api/demo/sessions', {}).subscribe();
    const req = controller.expectOne('/api/demo/sessions');
    expect(req.request.headers.has('X-Demo-Session-Id')).toBe(false);
    req.flush({});
  });

  it('does not add the header on non-demo endpoints', () => {
    sessionStore.sessionId = () => 'session-1';
    http.get('/api/documents').subscribe();
    const req = controller.expectOne('/api/documents');
    expect(req.request.headers.has('X-Demo-Session-Id')).toBe(false);
    req.flush([]);
  });
});
