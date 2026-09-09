import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppError } from '../../../core/models/api-error.model';
import { ChatMessage } from '../../../core/models/chat.model';
import { ChatStore } from '../../../core/state/chat.store';
import { ChatPanelComponent } from './chat-panel.component';

describe('ChatPanelComponent', () => {
  function setup(overrides: {
    messages?: readonly ChatMessage[];
    isAnswering?: boolean;
    lastError?: AppError | null;
    canAsk?: boolean;
    quotaExhausted?: boolean;
  }) {
    const ask = vi.fn();
    const retryLast = vi.fn();
    const chatStoreStub = {
      messages: () => overrides.messages ?? [],
      isAnswering: () => overrides.isAnswering ?? false,
      lastError: () => overrides.lastError ?? null,
      canAsk: () => overrides.canAsk ?? true,
      quotaExhausted: () => overrides.quotaExhausted ?? false,
      ask,
      retryLast,
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ChatStore, useValue: chatStoreStub }],
    });

    const fixture: ComponentFixture<ChatPanelComponent> = TestBed.createComponent(ChatPanelComponent);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement, ask, retryLast };
  }

  it('shows the welcome message when there are no messages yet', () => {
    const { element } = setup({});
    expect(element.textContent).toContain('Posez une question sur vos documents.');
  });

  it('renders each message and hides the welcome message once there is one', () => {
    const messages: ChatMessage[] = [
      { role: 'user', id: 'm1', text: 'Quelles obligations ?' },
      { role: 'assistant', id: 'm2', text: 'Selon les documents…', refused: false, sources: [] },
    ];
    const { element } = setup({ messages });
    expect(element.textContent).not.toContain('Posez une question sur vos documents.');
    expect(element.textContent).toContain('Quelles obligations ?');
    expect(element.textContent).toContain('Selon les documents…');
  });

  it('shows a skeleton typing indicator (with an sr-only status for screen readers) while answering', () => {
    const { element } = setup({ isAnswering: true });
    expect(element.querySelector('.chat-panel__typing-bubble')).not.toBeNull();
    expect(element.querySelector('[role="status"]')?.textContent).toContain('L\'IA réfléchit');
  });

  it('shows a retry button for a retryable error', () => {
    const err: AppError = { kind: 'llm_unavailable', status: 500, message: 'Le service IA est temporairement indisponible.' };
    const { element, retryLast } = setup({ lastError: err });
    const banner = element.querySelector('.chat-panel__error')!;
    expect(banner.textContent).toContain(err.message);
    const retryButton = banner.querySelector('button') as HTMLButtonElement;
    expect(retryButton).not.toBeNull();
    retryButton.click();
    expect(retryLast).toHaveBeenCalledOnce();
  });

  it('hides the retry button for a quota-exceeded error (retrying cannot help)', () => {
    const err: AppError = { kind: 'quota_exceeded', status: 429, message: 'Quota atteint' };
    const { element } = setup({ lastError: err });
    expect(element.querySelector('.chat-panel__error button')).toBeNull();
  });

  it('disables the input once the question quota is exhausted', () => {
    const { fixture } = setup({ canAsk: false, quotaExhausted: true });
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(textarea.disabled).toBe(true);
    expect(textarea.placeholder).toBe('Quota de questions atteint');
  });

  it('forwards a sent question to the store', () => {
    const { fixture, ask } = setup({});
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'Ma question';
    (fixture.nativeElement.querySelector('button[aria-label="Envoyer la question"]') as HTMLButtonElement).click();
    expect(ask).toHaveBeenCalledWith('Ma question');
  });
});
