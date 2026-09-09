import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ChatStore } from '../../../core/state/chat.store';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { ChatInputComponent } from './chat-input.component';
import { ChatMessageComponent } from './chat-message.component';

@Component({
  selector: 'app-chat-panel',
  imports: [ChatMessageComponent, ChatInputComponent, ButtonComponent, SkeletonComponent],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chat-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPanelComponent {
  protected readonly chatStore = inject(ChatStore);

  onSend(question: string): void {
    this.chatStore.ask(question);
  }

  onRetry(): void {
    this.chatStore.retryLast();
  }
}
