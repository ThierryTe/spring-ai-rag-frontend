import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { API_BASE } from '../config/api.config';
import { DemoSessionDto } from '../models/session.model';

@Injectable({ providedIn: 'root' })
export class SessionApi {
  private readonly http = inject(HttpClient);

  createSession() {
    return this.http.post<DemoSessionDto>(`${API_BASE}/demo/sessions`, {});
  }

  fetchCurrent(sessionId: string) {
    return this.http.get<DemoSessionDto>(`${API_BASE}/demo/sessions/me`, {
      headers: { 'X-Demo-Session-Id': sessionId },
    });
  }
}
