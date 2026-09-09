import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { API_BASE } from '../config/api.config';
import { ChatAnswerDto, ChatRequestDto } from '../models/chat.model';


@Injectable({ providedIn: 'root' })
export class PortalChatApi {
  private readonly http = inject(HttpClient);

  ask(question: string) {
    const body: ChatRequestDto = { question, departmentId: null };
    return this.http.post<ChatAnswerDto>(`${API_BASE}/chat`, body);
  }
}
