export interface DemoSessionDto {
  readonly sessionId: string;
  readonly expiresAt: string;
  readonly maxQuestions: number;
  readonly maxDocuments: number;
  readonly questionsUsed: number;
  readonly documentsUsed: number;
}

export interface SessionQuota {
  readonly maxQuestions: number;
  readonly maxDocuments: number;
  readonly questionsUsed: number;
  readonly documentsUsed: number;
}

export interface SessionInfo {
  readonly sessionId: string;
  readonly expiresAt: Date;
  readonly quota: SessionQuota;
}

// The backend serializes `expiresAt` as a zone-less ISO datetime (its value is UTC, but the "Z"
// suffix is missing). Per the ECMAScript Date Time String spec, `new Date(...)` on a zone-less
// string is parsed as *local browser time*, not UTC, which silently corrupts the expiry in any
// timezone ahead of UTC. Normalize to UTC before parsing so this doesn't depend on the visitor's
// timezone.
const HAS_TIMEZONE = /(Z|[+-]\d{2}:?\d{2})$/;

function parseUtcDate(value: string): Date {
  return new Date(HAS_TIMEZONE.test(value) ? value : `${value}Z`);
}

export function toSessionInfo(dto: DemoSessionDto): SessionInfo {
  return {
    sessionId: dto.sessionId,
    expiresAt: parseUtcDate(dto.expiresAt),
    quota: {
      maxQuestions: dto.maxQuestions,
      maxDocuments: dto.maxDocuments,
      questionsUsed: dto.questionsUsed,
      documentsUsed: dto.documentsUsed,
    },
  };
}
