import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE } from '../config/api.config';
import { DocumentSummaryDto, DocumentUploadDto } from '../models/document.model';


@Injectable({ providedIn: 'root' })
export class PortalDocumentApi {
  private readonly http = inject(HttpClient);

  list() {
    return this.http.get<DocumentSummaryDto[]>(`${API_BASE}/documents`);
  }

  upload(file: File, departmentId: number): Observable<HttpEvent<DocumentUploadDto>> {
    const form = new FormData();
    form.append('file', file);
    form.append('departmentId', String(departmentId));
    return this.http.post<DocumentUploadDto>(`${API_BASE}/documents`, form, {
      reportProgress: true,
      observe: 'events',
    });
  }
}
