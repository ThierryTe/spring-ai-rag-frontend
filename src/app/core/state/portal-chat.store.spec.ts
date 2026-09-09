import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AppError } from '../models/api-error.model';
import { ChatAnswerDto } from '../models/chat.model';
import { PortalChatApi } from '../services/portal-chat.api';
import { AuthStore } from './auth.store';
import { PortalChatStore } from './portal-chat.store';

describe('PortalChatStore', () => {
  function setup() {
    const logout = vi.fn();
    const askFn = vi.fn();
    const authStoreStub = { logout };
    const chatApiStub: Partial<PortalChatApi> = { ask: askFn };

    TestBed.configureTestingModule({
      providers: [
        { provide: PortalChatApi, useValue: chatApiStub },
        { provide: AuthStore, useValue: authStoreStub },
      ],
    });

    const store = TestBed.inject(PortalChatStore);
    return { store, askFn, logout };
  }

  const successDto: ChatAnswerDto = {
    answer: 'Selon les documents…',
    sources: [],
    refused: false,
    refusalReason: null,
    latencyMs: 120,
  };

  it('appends the user message immediately and the assistant message on success', () => {
    const { store, askFn } = setup();
    askFn.mockReturnValue(of(successDto));

    store.ask('Quelles obligations ?');

    expect(store.messages()).toEqual([
      expect.objectContaining({ role: 'user', text: 'Quelles obligations ?' }),
      expect.objectContaining({ role: 'assistant', text: successDto.answer, refused: false }),
    ]);
    expect(store.isAnswering()).toBe(false);
  });

  it('ignores a blank question', () => {
    const { store, askFn } = setup();
    store.ask('   ');
    expect(askFn).not.toHaveBeenCalled();
  });

  it('logs out on a 401 (JWT expired) instead of surfacing a retryable error', () => {
    const { store, askFn, logout } = setup();
    const err: AppError = { kind: 'auth_expired', status: 401, message: 'Votre session a expiré.' };
    askFn.mockReturnValue(throwError(() => err));

    store.ask('question');

    expect(logout).toHaveBeenCalledOnce();
    expect(store.lastError()).toBeNull();
  });

  it('surfaces a non-auth error for retry', () => {
    const { store, askFn, logout } = setup();
    const err: AppError = { kind: 'llm_unavailable', status: 500, message: 'Le service IA est temporairement indisponible.' };
    askFn.mockReturnValue(throwError(() => err));

    store.ask('question');

    expect(logout).not.toHaveBeenCalled();
    expect(store.lastError()).toEqual(err);
  });

  it('retryLast() re-sends the last user question', () => {
    const { store, askFn } = setup();
    askFn.mockReturnValue(of(successDto));
    store.ask('première question');
    store.retryLast();
    expect(askFn).toHaveBeenNthCalledWith(2, 'première question');
  });
});
