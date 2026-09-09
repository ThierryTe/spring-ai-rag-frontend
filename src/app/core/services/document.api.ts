import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE } from '../config/api.config';
import { DocumentUploadDto } from '../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentApi {
  private readonly http = inject(HttpClient);


  upload(file: File): Observable<HttpEvent<DocumentUploadDto>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<DocumentUploadDto>(`${API_BASE}/demo/documents`, form, {
      reportProgress: true,
      observe: 'events',
    });
  }
}
