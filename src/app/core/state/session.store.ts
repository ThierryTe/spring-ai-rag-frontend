import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, tap, throwError } from 'rxjs';

import { AppError } from '../models/api-error.model';
import { SessionInfo, SessionQuota, toSessionInfo } from '../models/session.model';
import { SessionApi } from '../services/session.api';

const STORAGE_KEY = 'ai-compliance-copilot.demo-session';

interface StoredSession {
  readonly sessionId: string;
  readonly expiresAt: string;
  readonly quota: SessionQuota;
}

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly sessionApi = inject(SessionApi);
  private readonly router = inject(Router);

  readonly session = signal<SessionInfo | null>(this.restore());
  readonly isCreating = signal(false);
  readonly error = signal<AppError | null>(null);

  readonly sessionId = computed(() => this.session()?.sessionId ?? null);
  readonly quota = computed(() => this.session()?.quota ?? null);
  readonly hasSession = computed(() => this.session() !== null);

  constructor() {
    // SessionStorage (not localStorage): the demo session is meant to die with the tab,
    // consistent with its 2h server-side TTL.
    effect(() => {
      const current = this.session();
      if (typeof sessionStorage === 'undefined') return;
      if (current) {
        const toStore: StoredSession = {
          sessionId: current.sessionId,
          expiresAt: current.expiresAt.toISOString(),
          quota: current.quota,
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    });
  }

  createSession(): Observable<SessionInfo> {
    this.isCreating.set(true);
    this.error.set(null);
    return this.sessionApi.createSession().pipe(
      map((dto) => toSessionInfo(dto)),
      tap((info) => {
        this.session.set(info);
        this.isCreating.set(false);
      }),
      catchError((err: AppError) => {
        this.error.set(err);
        this.isCreating.set(false);
        return throwError(() => err);
      }),
    );
  }

  isExpiredNow(): boolean {
    const current = this.session();
    return !current || current.expiresAt.getTime() <= Date.now();
  }
  recordQuestionAsked(): void {
    this.bumpQuota((quota) => ({ ...quota, questionsUsed: quota.questionsUsed + 1 }));
  }
  recordDocumentUploaded(): void {
    this.bumpQuota((quota) => ({ ...quota, documentsUsed: quota.documentsUsed + 1 }));
  }

  clear(): void {
    this.session.set(null);
  }

  handleExpiry(): void {
    this.clear();
    this.router.navigate(['/']);
  }

  private bumpQuota(update: (quota: SessionQuota) => SessionQuota): void {
    const current = this.session();
    if (!current) return;
    this.session.set({ ...current, quota: update(current.quota) });
  }

  private restore(): SessionInfo | null {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as StoredSession;
      const expiresAt = new Date(parsed.expiresAt);
      if (expiresAt.getTime() <= Date.now()) return null;
      return { sessionId: parsed.sessionId, expiresAt, quota: parsed.quota };
    } catch {
      return null;
    }
  }
}
