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

export function toSessionInfo(dto: DemoSessionDto): SessionInfo {
  return {
    sessionId: dto.sessionId,
    expiresAt: new Date(dto.expiresAt),
    quota: {
      maxQuestions: dto.maxQuestions,
      maxDocuments: dto.maxDocuments,
      questionsUsed: dto.questionsUsed,
      documentsUsed: dto.documentsUsed,
    },
  };
}
