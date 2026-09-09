import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, switchMap, tap, throwError } from 'rxjs';

import { AppError } from '../models/api-error.model';
import { CurrentUser, toCurrentUser } from '../models/auth.model';
import { AuthApi } from '../services/auth.api';

const STORAGE_KEY = 'ai-compliance-copilot.auth';

interface StoredAuth {
  readonly token: string;
  readonly currentUser: CurrentUser;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);

  private readonly restored = this.restore();


  readonly token = signal<string | null>(this.restored?.token ?? null);
  readonly currentUser = signal<CurrentUser | null>(this.restored?.currentUser ?? null);
  readonly isAuthenticating = signal(false);
  readonly error = signal<AppError | null>(null);

  readonly isAuthenticated = computed(() => this.token() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.roleCode === 'ADMIN');

  constructor() {
    effect(() => {
      const token = this.token();
      const currentUser = this.currentUser();
      if (typeof localStorage === 'undefined') return;
      if (token && currentUser) {
        const toStore: StoredAuth = { token, currentUser };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    });

    if (this.restored) {
      queueMicrotask(() => this.refreshCurrentUser());
    }
  }

  login(email: string, password: string): Observable<CurrentUser> {
    this.isAuthenticating.set(true);
    this.error.set(null);
    return this.authApi.login(email, password).pipe(
      // token must land in the signal before /me fires: auth.interceptor reads it synchronously
      // when the next request goes out.
      tap((res) => this.token.set(res.token)),
      switchMap(() => this.authApi.me()),
      map((dto) => toCurrentUser(dto)),
      tap((user) => {
        this.currentUser.set(user);
        this.isAuthenticating.set(false);
      }),
      catchError((err: AppError) => {
        this.token.set(null);
        this.currentUser.set(null);
        this.isAuthenticating.set(false);
        this.error.set(err);
        return throwError(() => err);
      }),
    );
  }

  logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private refreshCurrentUser(): void {
    this.authApi.me().subscribe({
      next: (dto) => this.currentUser.set(toCurrentUser(dto)),
      error: () => this.logout(),
    });
  }

  private restore(): StoredAuth | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredAuth;
    } catch {
      return null;
    }
  }
}
