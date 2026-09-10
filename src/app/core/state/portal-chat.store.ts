import { Injectable, computed, inject, signal } from '@angular/core';

import { AppError } from '../models/api-error.model';
import { ChatMessage, newMessageId, toAssistantMessage } from '../models/chat.model';
import { PortalChatApi } from '../services/portal-chat.api';
import { AuthStore } from './auth.store';


@Injectable({ providedIn: 'root' })
export class PortalChatStore {
  private readonly chatApi = inject(PortalChatApi);
  private readonly authStore = inject(AuthStore);

  readonly messages = signal<readonly ChatMessage[]>([]);
  readonly isAnswering = signal(false);
  readonly lastError = signal<AppError | null>(null);
  readonly quotaBlocked = signal(false);

  readonly canAsk = computed(() => !this.isAnswering() && !this.quotaBlocked());

  ask(question: string): void {
    const trimmed = question.trim();
    if (!trimmed || !this.canAsk()) return;

    this.messages.update((list) => [...list, { role: 'user', id: newMessageId(), text: trimmed }]);
    this.isAnswering.set(true);
    this.lastError.set(null);

    this.chatApi.ask(trimmed).subscribe({
      next: (dto) => {
        this.isAnswering.set(false);
        this.quotaBlocked.set(false);
        this.messages.update((list) => [...list, toAssistantMessage(dto)]);
      },
      error: (err: AppError) => {
        this.isAnswering.set(false);
        if (err.kind === 'auth_expired') {
          this.authStore.logout();
          return;
        }
        // A 429 here means the daily question quota is exhausted — retrying (button or input)
        // would just re-fire the same error, so block further asks until a page reload picks
        // up a fresh quota window.
        if (err.kind === 'quota_exceeded') {
          this.quotaBlocked.set(true);
        }
        this.lastError.set(err);
      },
    });
  }

  retryLast(): void {
    const lastUserMessage = [...this.messages()].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      this.ask(lastUserMessage.text);
    }
  }
}
