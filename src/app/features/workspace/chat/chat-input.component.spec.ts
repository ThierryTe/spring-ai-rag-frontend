import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatInputComponent } from './chat-input.component';

describe('ChatInputComponent', () => {
  function setup(disabled = false) {
    const fixture: ComponentFixture<ChatInputComponent> = TestBed.createComponent(ChatInputComponent);
    fixture.componentRef.setInput('disabled', disabled);
    fixture.detectChanges();
    const sent: string[] = [];
    fixture.componentInstance.send.subscribe((v: string) => sent.push(v));
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    return { fixture, textarea, button, sent };
  }

  it('emits the trimmed value and clears the field on send', () => {
    const { textarea, button, sent } = setup();
    textarea.value = '  Ma question  ';
    button.click();
    expect(sent).toEqual(['  Ma question  ']);
    expect(textarea.value).toBe('');
  });

  it('does not emit a blank question', () => {
    const { textarea, button, sent } = setup();
    textarea.value = '   ';
    button.click();
    expect(sent).toEqual([]);
  });

  it('sends on Enter but not on Shift+Enter', () => {
    const { textarea, sent } = setup();

    textarea.value = 'multi\nligne';
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }));
    expect(sent).toEqual([]);

    textarea.value = 'question';
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false, cancelable: true }));
    expect(sent).toEqual(['question']);
  });

  it('does not emit while disabled', () => {
    const { textarea, button, sent } = setup(true);
    expect(textarea.disabled).toBe(true);
    expect(button.disabled).toBe(true);
    textarea.value = 'question';
    button.click();
    expect(sent).toEqual([]);
  });
});
