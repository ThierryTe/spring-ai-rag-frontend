import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { API_BASE } from '../config/api.config';
import { AuthMeDto, LoginResponseDto } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);

  login(email: string, password: string) {
    return this.http.post<LoginResponseDto>(`${API_BASE}/auth/login`, { email, password });
  }

  me() {
    return this.http.get<AuthMeDto>(`${API_BASE}/auth/me`);
  }
}
