import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_BASE, DEMO_SESSION_HEADER } from '../config/api.config';
import { SessionStore } from '../state/session.store';

/** Attaches X-Demo-Session-Id to every /api/demo/** call so API clients never have to. */
export const demoSessionInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionId = inject(SessionStore).sessionId();
  if (sessionId && req.url.startsWith(`${API_BASE}/demo`)) {
    req = req.clone({ setHeaders: { [DEMO_SESSION_HEADER]: sessionId } });
  }
  return next(req);
};
