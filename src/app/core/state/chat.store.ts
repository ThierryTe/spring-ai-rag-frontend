import { Injectable, computed, inject, signal } from '@angular/core';

import { AppError } from '../models/api-error.model';
import { ChatAnswerDto, ChatMessage, newMessageId, toAssistantMessage } from '../models/chat.model';
import { ChatApi } from '../services/chat.api';
import { SessionStore } from './session.store';

@Injectable({ providedIn: 'root' })
export class ChatStore {
  private readonly chatApi = inject(ChatApi);
  private readonly sessionStore = inject(SessionStore);

  readonly messages = signal<readonly ChatMessage[]>([]);
  readonly isAnswering = signal(false);
  readonly lastError = signal<AppError | null>(null);

  readonly quotaExhausted = computed(() => {
    const quota = this.sessionStore.quota();
    return !!quota && quota.questionsUsed >= quota.maxQuestions;
  });

  readonly canAsk = computed(() => !this.isAnswering() && !this.quotaExhausted());

  ask(question: string): void {
    const trimmed = question.trim();
    if (!trimmed || !this.canAsk()) return;

    this.messages.update((list) => [...list, { role: 'user', id: newMessageId(), text: trimmed }]);
    this.isAnswering.set(true);
    this.lastError.set(null);

    this.chatApi.ask(trimmed).subscribe({
      next: (dto) => {
        this.isAnswering.set(false);
        // A graceful 200 SESSION_EXPIRED refusal means the session is dead — send the user
        // back to Landing to start a new one rather than adding a bubble they can't act on.
        if (dto.refusalReason === 'SESSION_EXPIRED') {
          this.sessionStore.handleExpiry();
          return;
        }
        this.messages.update((list) => [...list, toAssistantMessage(dto)]);
        this.recordQuotaConsumption(dto);
      },
      error: (err: AppError) => {
        this.isAnswering.set(false);
        // A 401 here means the demo session row is gone entirely (e.g. the TTL cleanup job
        // deleted it) — same recovery as the graceful refusal above.
        if (err.kind === 'session_expired') {
          this.sessionStore.handleExpiry();
          return;
        }
        this.lastError.set(err);
        // See QuotaGuard.checkAndConsume: the question slot is consumed on the way IN, before
        // sensitive-topic/no-context checks or the LLM call — so any failure that reached that
        // point (a real backend 500, i.e. 'llm_unavailable'/'server') already burned a slot.
        // 400/429 both happen before consumption (blank question, quota already at ceiling)
        // and 'network' never reached the backend at all.
        if (err.kind === 'llm_unavailable' || err.kind === 'server') {
          this.sessionStore.recordQuestionAsked();
        }
      },
    });
  }

  retryLast(): void {
    const lastUserMessage = [...this.messages()].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      this.ask(lastUserMessage.text);
    }
  }

  private recordQuotaConsumption(dto: ChatAnswerDto): void {
    // QuotaGuard checks expiry before consuming, so a SESSION_EXPIRED refusal never burns a slot.
    if (dto.refusalReason !== 'SESSION_EXPIRED') {
      this.sessionStore.recordQuestionAsked();
    }
  }
}
