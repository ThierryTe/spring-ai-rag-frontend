import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { PortalChatStore } from '../../../core/state/portal-chat.store';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { ChatInputComponent } from '../../workspace/chat/chat-input.component';
import { ChatMessageComponent } from '../../workspace/chat/chat-message.component';

@Component({
  selector: 'app-portal-chat-panel',
  imports: [ChatMessageComponent, ChatInputComponent, ButtonComponent, SkeletonComponent],
  templateUrl: './portal-chat-panel.component.html',
  styleUrl: './portal-chat-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalChatPanelComponent {
  protected readonly chatStore = inject(PortalChatStore);

  onSend(question: string): void {
    this.chatStore.ask(question);
  }

  onRetry(): void {
    this.chatStore.retryLast();
  }
}
