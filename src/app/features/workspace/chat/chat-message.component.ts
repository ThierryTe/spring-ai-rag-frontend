import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ChatMessage } from '../../../core/models/chat.model';
import { SourceListComponent } from '../sources/source-list.component';

@Component({
  selector: 'app-chat-message',
  imports: [SourceListComponent],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatMessageComponent {
  readonly message = input.required<ChatMessage>();
}
