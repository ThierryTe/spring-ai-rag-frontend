export type RefusalReason =
  | 'SENSITIVE_TOPIC'
  | 'DEPARTMENT_FORBIDDEN'
  | 'NO_RELEVANT_CONTEXT'
  | 'QUOTA_EXCEEDED'
  | 'SESSION_EXPIRED';

export interface SourceCitationDto {
  readonly referenceNumber: number;
  readonly documentTitle: string;
  readonly filename: string;
  readonly pageNumber: number | null;
  readonly sectionLabel: string | null;
  readonly similarityScore: number;
}

export interface ChatRequestDto {
  readonly question: string;
  readonly departmentId: number | null;
}

export interface ChatAnswerDto {
  readonly answer: string;
  readonly sources: readonly SourceCitationDto[];
  readonly refused: boolean;
  readonly refusalReason: RefusalReason | null;
  readonly latencyMs: number;
}

export type ChatMessage =
  | { readonly role: 'user'; readonly id: string; readonly text: string }
  | {
      readonly role: 'assistant';
      readonly id: string;
      readonly text: string;
      readonly refused: boolean;
      readonly sources: readonly SourceCitationDto[];
    };

let nextId = 0;
export function newMessageId(): string {
  nextId += 1;
  return `msg-${Date.now()}-${nextId}`;
}

export function toAssistantMessage(dto: ChatAnswerDto): ChatMessage {
  return {
    role: 'assistant',
    id: newMessageId(),
    text: dto.answer,
    refused: dto.refused,
    sources: dto.sources,
  };
}
