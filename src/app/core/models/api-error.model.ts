export type AppErrorKind =
  | 'session_expired'
  | 'auth_expired'
  | 'invalid_credentials'
  | 'forbidden'
  | 'quota_exceeded'
  | 'validation'
  | 'llm_unavailable'
  | 'server'
  | 'network'
  | 'unknown';

export interface AppError {
  readonly kind: AppErrorKind;
  readonly message: string;
  readonly status: number;
}


export interface BackendErrorResponse {
  readonly status: number;
  readonly error: string;
  readonly message: string;
  readonly path: string;
}
