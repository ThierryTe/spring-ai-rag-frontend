import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { API_BASE } from '../config/api.config';
import { AppError, BackendErrorResponse } from '../models/api-error.model';


export const errorMappingInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => err);
      }
      return throwError(() => toAppError(err));
    }),
  );

function toAppError(err: HttpErrorResponse): AppError {
  const backend = isBackendErrorResponse(err.error) ? err.error : null;

  if (err.status === 0 || (err.status >= 500 && !backend)) {
    return {
      kind: 'network',
      status: err.status,
      message: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
    };
  }

  switch (err.status) {
    case 400:
      return { kind: 'validation', status: 400, message: backend?.message ?? 'La requête est invalide.' };
    case 401:
      if (isLoginRequest(err.url)) {
        return {
          kind: 'invalid_credentials',
          status: 401,
          message: backend?.message ?? 'Email ou mot de passe incorrect.',
        };
      }
      if (isDemoRequest(err.url)) {
        return {
          kind: 'session_expired',
          status: 401,
          message: 'Votre session a expiré. Veuillez démarrer une nouvelle session.',
        };
      }
      return {
        kind: 'auth_expired',
        status: 401,
        message: 'Votre session a expiré. Veuillez vous reconnecter.',
      };
    case 429:
      return {
        kind: 'quota_exceeded',
        status: 429,
        message: backend?.message ?? 'Le quota de cette session demo est atteint.',
      };
    case 500:
      return isChatRequest(err.url)
        ? { kind: 'llm_unavailable', status: 500, message: 'Le service IA est temporairement indisponible.' }
        : { kind: 'server', status: 500, message: 'Une erreur inattendue est survenue. Veuillez réessayer.' };
    default:
      return { kind: 'unknown', status: err.status, message: backend?.message ?? 'Une erreur inattendue est survenue.' };
  }
}

function isChatRequest(url: string | null): boolean {
  return !!url && url.includes('/chat');
}

function isLoginRequest(url: string | null): boolean {
  return !!url && url.includes('/auth/login');
}

function isDemoRequest(url: string | null): boolean {
  return !!url && url.includes(`${API_BASE}/demo`);
}

function isBackendErrorResponse(value: unknown): value is BackendErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'message' in value &&
    'path' in value
  );
}
