import { httpResource } from '@angular/common/http';
import { Injectable, computed, effect, inject } from '@angular/core';

import { API_BASE } from '../config/api.config';
import { AppError } from '../models/api-error.model';
import { ObservabilitySummaryDto } from '../models/observability.model';
import { AuthStore } from './auth.store';

const DEFAULT_DAYS = 30;

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly authStore = inject(AuthStore);

  readonly summaryResource = httpResource<ObservabilitySummaryDto>(() => ({
    url: `${API_BASE}/admin/observability/summary`,
    params: { days: DEFAULT_DAYS },
  }));

  readonly errorMessage = computed(() => {
    const err = this.summaryResource.error();
    if (!err || isAuthExpiredError(err)) return null;
    return typeof err === 'object' && 'message' in err
      ? String((err as { message: unknown }).message)
      : "Impossible de charger les métriques d'observabilité.";
  });

  readonly errorRetryable = computed(() => !isForbiddenError(this.summaryResource.error()));

  constructor() {
    effect(() => {
      if (isAuthExpiredError(this.summaryResource.error())) {
        this.authStore.logout();
      }
    });
  }

  reload(): void {
    this.summaryResource.reload();
  }
}

function isAuthExpiredError(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as Partial<AppError>).kind === 'auth_expired';
}

function isForbiddenError(err: unknown): boolean {
  return !!err && typeof err === 'object' && (err as Partial<AppError>).kind === 'forbidden';
}
