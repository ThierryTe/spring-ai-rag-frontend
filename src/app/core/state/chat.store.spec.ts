import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AppError } from '../models/api-error.model';
import { ChatAnswerDto } from '../models/chat.model';
import { ChatApi } from '../services/chat.api';
import { SessionStore } from './session.store';
import { ChatStore } from './chat.store';

describe('ChatStore', () => {
  function setup(quota: { questionsUsed: number; maxQuestions: number } = { questionsUsed: 0, maxQuestions: 5 }) {
    const recordQuestionAsked = vi.fn();
    const handleExpiry = vi.fn();
    const askFn = vi.fn();
    const sessionStoreStub = {
      quota: () => quota,
      recordQuestionAsked,
      handleExpiry,
    };
    const chatApiStub: Partial<ChatApi> = { ask: askFn };

    TestBed.configureTestingModule({
      providers: [
        { provide: ChatApi, useValue: chatApiStub },
        { provide: SessionStore, useValue: sessionStoreStub },
      ],
    });

    const store = TestBed.inject(ChatStore);
    return { store, askFn, recordQuestionAsked, handleExpiry };
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

  it('records a question on a normal success', () => {
    const { store, askFn, recordQuestionAsked } = setup();
    askFn.mockReturnValue(of(successDto));
    store.ask('question');
    expect(recordQuestionAsked).toHaveBeenCalledOnce();
  });

  it('does not record a question when refused for SESSION_EXPIRED (QuotaGuard never consumes on expiry)', () => {
    const { store, askFn, recordQuestionAsked } = setup();
    askFn.mockReturnValue(of({ ...successDto, refused: true, refusalReason: 'SESSION_EXPIRED' as const }));
    store.ask('question');
    expect(recordQuestionAsked).not.toHaveBeenCalled();
  });

  it('does still record a question when refused for NO_RELEVANT_CONTEXT (consumed before that guard runs)', () => {
    const { store, askFn, recordQuestionAsked } = setup();
    askFn.mockReturnValue(of({ ...successDto, refused: true, refusalReason: 'NO_RELEVANT_CONTEXT' as const }));
    store.ask('question');
    expect(recordQuestionAsked).toHaveBeenCalledOnce();
  });

  it('does not record a question on a 429 (quota already exhausted, nothing consumed)', () => {
    const { store, askFn, recordQuestionAsked } = setup();
    const err: AppError = { kind: 'quota_exceeded', status: 429, message: 'Quota atteint' };
    askFn.mockReturnValue(throwError(() => err));
    store.ask('question');
    expect(recordQuestionAsked).not.toHaveBeenCalled();
    expect(store.lastError()).toEqual(err);
  });

  it('records a question on a real 500 (llm_unavailable) since the slot was consumed before the LLM call', () => {
    const { store, askFn, recordQuestionAsked } = setup();
    const err: AppError = { kind: 'llm_unavailable', status: 500, message: 'Le service IA est temporairement indisponible.' };
    askFn.mockReturnValue(throwError(() => err));
    store.ask('question');
    expect(recordQuestionAsked).toHaveBeenCalledOnce();
  });

  it('does not record a question on a network failure (never reached the backend)', () => {
    const { store, askFn, recordQuestionAsked } = setup();
    const err: AppError = { kind: 'network', status: 0, message: 'Impossible de contacter le serveur.' };
    askFn.mockReturnValue(throwError(() => err));
    store.ask('question');
    expect(recordQuestionAsked).not.toHaveBeenCalled();
  });

  it('blocks ask() once the question quota is exhausted', () => {
    const { store, askFn } = setup({ questionsUsed: 5, maxQuestions: 5 });
    expect(store.canAsk()).toBe(false);
    store.ask('question');
    expect(askFn).not.toHaveBeenCalled();
    expect(store.messages()).toEqual([]);
  });

  it('ignores a blank question', () => {
    const { store, askFn } = setup();
    store.ask('   ');
    expect(askFn).not.toHaveBeenCalled();
  });

  it('routes to landing (and drops the bubble) on a graceful SESSION_EXPIRED refusal', () => {
    const { store, askFn, recordQuestionAsked, handleExpiry } = setup();
    askFn.mockReturnValue(of({ ...successDto, refused: true, refusalReason: 'SESSION_EXPIRED' as const }));
    store.ask('question');
    expect(handleExpiry).toHaveBeenCalledOnce();
    expect(recordQuestionAsked).not.toHaveBeenCalled();
    // Only the user's own question remains; no assistant bubble for a session we're leaving.
    expect(store.messages()).toEqual([expect.objectContaining({ role: 'user' })]);
  });

  it('routes to landing on a 401 (session row gone entirely)', () => {
    const { store, askFn, handleExpiry } = setup();
    const err: AppError = {
      kind: 'session_expired',
      status: 401,
      message: 'Votre session a expiré. Veuillez démarrer une nouvelle session.',
    };
    askFn.mockReturnValue(throwError(() => err));
    store.ask('question');
    expect(handleExpiry).toHaveBeenCalledOnce();
    expect(store.lastError()).toBeNull();
  });

  it('retryLast() re-sends the last user question', () => {
    const { store, askFn } = setup();
    askFn.mockReturnValue(of(successDto));
    store.ask('première question');
    store.retryLast();
    expect(askFn).toHaveBeenNthCalledWith(2, 'première question');
  });
});
