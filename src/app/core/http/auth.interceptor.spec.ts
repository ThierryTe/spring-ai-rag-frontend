import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthStore } from '../state/auth.store';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let authStore: { token: () => string | null };

  beforeEach(() => {
    authStore = { token: () => null };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStore, useFactory: () => authStore },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('adds Authorization: Bearer to non-demo /api/** calls when a token exists', () => {
    authStore.token = () => 'jwt-token';
    http.get('/api/documents').subscribe();
    const req = controller.expectOne('/api/documents');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush([]);
  });

  it('does not add the header when there is no token', () => {
    http.get('/api/auth/me').subscribe();
    const req = controller.expectOne('/api/auth/me');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('does not add the header on /api/demo/** endpoints even with a token', () => {
    authStore.token = () => 'jwt-token';
    http.get('/api/demo/documents').subscribe();
    const req = controller.expectOne('/api/demo/documents');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });
});
