import { RefusalReason } from './chat.model';

export interface RefusalReasonCountDto {
  readonly reason: RefusalReason;
  readonly count: number;
}

export interface DailyQueryCountDto {
  readonly day: string;
  readonly count: number;
}

export interface ObservabilitySummaryDto {
  readonly days: number;
  readonly totalQueries: number;
  readonly allowedQueries: number;
  readonly refusedQueries: number;
  readonly refusalBreakdown: readonly RefusalReasonCountDto[];
  readonly avgLatencyMs: number | null;
  readonly totalTokensUsed: number;
  readonly totalEstimatedCostUsd: number;
  readonly dailyVolume: readonly DailyQueryCountDto[];
}

const REFUSAL_REASON_LABELS: Record<RefusalReason, string> = {
  SENSITIVE_TOPIC: 'Sujet sensible',
  DEPARTMENT_FORBIDDEN: 'Hors périmètre département',
  NO_RELEVANT_CONTEXT: 'Aucun contexte pertinent',
  QUOTA_EXCEEDED: 'Quota dépassé',
  SESSION_EXPIRED: 'Session expirée',
};

export function refusalReasonLabel(reason: RefusalReason): string {
  return REFUSAL_REASON_LABELS[reason] ?? reason;
}

export function formatDayLabel(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}
