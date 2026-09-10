import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AppError } from '../models/api-error.model';
import { errorMappingInterceptor } from './error-mapping.interceptor';

describe('errorMappingInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorMappingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  function expectError(
    url: string,
    status: number,
    backendBody: Record<string, unknown>,
    expected: Partial<AppError>,
  ) {
    let captured: AppError | undefined;
    http.get(url).subscribe({ error: (err: AppError) => (captured = err) });
    controller.expectOne(url).flush(backendBody, { status, statusText: 'Error' });
    expect(captured).toMatchObject(expected);
  }

  it('maps 401 on a demo endpoint to a session-expired AppError with a French message', () => {
    expectError('/api/demo/sessions/me', 401, { status: 401, error: 'Unauthorized', message: 'x', path: '/x' }, {
      kind: 'session_expired',
      status: 401,
      message: 'Votre session a expiré. Veuillez démarrer une nouvelle session.',
    });
  });

  it('maps 401 on /auth/login to invalid_credentials, keeping the backend message', () => {
    expectError(
      '/api/auth/login',
      401,
      { status: 401, error: 'Unauthorized', message: 'Email ou mot de passe incorrect', path: '/api/auth/login' },
      { kind: 'invalid_credentials', status: 401, message: 'Email ou mot de passe incorrect' },
    );
  });

  it('maps 401 on any other authenticated endpoint to auth_expired', () => {
    expectError('/api/auth/me', 401, { status: 401, error: 'Unauthorized', message: 'x', path: '/api/auth/me' }, {
      kind: 'auth_expired',
      status: 401,
      message: 'Votre session a expiré. Veuillez vous reconnecter.',
    });
  });

  it('maps 403 to forbidden, replacing the backend message with a fixed French one', () => {
    expectError(
      '/api/admin/observability/summary',
      403,
      { status: 403, error: 'Forbidden', message: 'Access denied', path: '/api/admin/observability/summary' },
      { kind: 'forbidden', status: 403, message: "Vous n'avez pas les droits nécessaires pour effectuer cette action." },
    );
  });

  it('maps 429 to quota-exceeded, keeping the backend message', () => {
    expectError(
      '/api/demo/chat',
      429,
      { status: 429, error: 'Too Many Requests', message: 'Quota de documents atteint pour cette session demo', path: '/api/demo/chat' },
      { kind: 'quota_exceeded', status: 429, message: 'Quota de documents atteint pour cette session demo' },
    );
  });

  it('maps 400 to validation, keeping the backend message', () => {
    expectError(
      '/api/demo/documents',
      400,
      { status: 400, error: 'Bad Request', message: 'Le fichier depasse la taille maximale autorisee', path: '/api/demo/documents' },
      { kind: 'validation', status: 400, message: 'Le fichier depasse la taille maximale autorisee' },
    );
  });

  it('maps 500 on a chat endpoint to llm_unavailable', () => {
    expectError('/api/demo/chat', 500, { status: 500, error: 'Internal Server Error', message: 'x', path: '/api/demo/chat' }, {
      kind: 'llm_unavailable',
      status: 500,
      message: 'Le service IA est temporairement indisponible.',
    });
  });

  it('maps 500 on a non-chat endpoint to a generic server error', () => {
    expectError('/api/demo/documents', 500, { status: 500, error: 'Internal Server Error', message: 'x', path: '/api/demo/documents' }, {
      kind: 'server',
      status: 500,
    });
  });

  it('maps a network failure (status 0) to network', () => {
    let captured: AppError | undefined;
    http.get('/api/demo/sessions/me').subscribe({ error: (err: AppError) => (captured = err) });
    controller.expectOne('/api/demo/sessions/me').error(new ProgressEvent('error'), { status: 0 });
    expect(captured).toMatchObject({ kind: 'network', status: 0 });
  });

  it('maps a bodyless 500 (dev-server proxy target unreachable) to network, not server', () => {
    let captured: AppError | undefined;
    http.post('/api/demo/sessions', {}).subscribe({ error: (err: AppError) => (captured = err) });
    controller.expectOne('/api/demo/sessions').flush('', { status: 500, statusText: 'Internal Server Error' });
    expect(captured).toMatchObject({
      kind: 'network',
      message: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
    });
  });
});
