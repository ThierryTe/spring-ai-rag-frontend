import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatMessage } from '../../../core/models/chat.model';
import { ChatMessageComponent } from './chat-message.component';

describe('ChatMessageComponent', () => {
  function setup(message: ChatMessage) {
    const fixture: ComponentFixture<ChatMessageComponent> = TestBed.createComponent(ChatMessageComponent);
    fixture.componentRef.setInput('message', message);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('renders a user message without sources', () => {
    const element = setup({ role: 'user', id: 'm1', text: 'Ma question' });
    expect(element.querySelector('.chat-message--user')).not.toBeNull();
    expect(element.textContent).toContain('Ma question');
    expect(element.querySelector('app-source-list')).toBeNull();
  });

  it('renders an assistant message with its sources', () => {
    const element = setup({
      role: 'assistant',
      id: 'm2',
      text: 'Selon les documents…',
      refused: false,
      sources: [
        { referenceNumber: 1, documentTitle: 'Doc', filename: 'doc.pdf', pageNumber: 3, sectionLabel: null, similarityScore: 0.8 },
      ],
    });
    expect(element.querySelector('.chat-message--assistant')).not.toBeNull();
    expect(element.querySelector('.chat-message--refused')).toBeNull();
    expect(element.textContent).toContain('1 source utilisée');
  });

  it('marks a refused assistant message distinctly', () => {
    const element = setup({
      role: 'assistant',
      id: 'm3',
      text: "Je ne dispose pas d'information sur ce sujet.",
      refused: true,
      sources: [],
    });
    expect(element.querySelector('.chat-message--refused')).not.toBeNull();
    expect(element.textContent).toContain('Réponse non sourcée');
  });
});
