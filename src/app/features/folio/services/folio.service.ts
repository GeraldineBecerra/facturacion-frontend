import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CafRequest, CafResponse, DocumentType, FolioControl } from '../models/folio.model';

@Injectable({ providedIn: 'root' })
export class FolioService {
  private readonly folioUrl = '/api/api/folios';
  private readonly documentTypeUrl = '/api/api/tipos-documento';

  constructor(private http: HttpClient) {}

  findDocumentTypes(): Observable<DocumentType[]> {
    return this.http.get<DocumentType[]>(this.documentTypeUrl);
  }

  findCafs(): Observable<CafResponse[]> {
    return this.http.get<CafResponse[]>(`${this.folioUrl}/caf`);
  }

  findControls(): Observable<FolioControl[]> {
    return this.http.get<FolioControl[]>(`${this.folioUrl}/control`);
  }

  uploadCaf(request: CafRequest): Observable<CafResponse> {
    return this.http.post<CafResponse>(`${this.folioUrl}/caf`, request);
  }
}
