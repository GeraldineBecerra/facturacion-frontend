import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DocumentType } from '../../folio/models/folio.model';

@Injectable({ providedIn: 'root' })
export class DocumentTypeService {
  private readonly apiUrl = '/api/api/tipos-documento';

  constructor(private http: HttpClient) {}

  findAll(): Observable<DocumentType[]> {
    return this.http.get<DocumentType[]>(this.apiUrl);
  }
}
