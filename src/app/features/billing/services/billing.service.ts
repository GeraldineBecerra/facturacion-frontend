import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BillingDocument,
  BillingDocumentDetail,
  BillingImportPreview,
} from '../models/billing.model';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly apiUrl = '/api/api/documentos';

  constructor(private http: HttpClient) {}

  findAll(filters?: { estado?: string }): Observable<BillingDocument[]> {
    let params = new HttpParams();
    if (filters?.estado) params = params.set('estado', filters.estado);
    return this.http.get<BillingDocument[]>(this.apiUrl, { params });
  }

  previewTxt(file: File): Observable<BillingImportPreview> {
    const formData = new FormData();
    formData.append('archivo', file);
    return this.http.post<BillingImportPreview>(`${this.apiUrl}/importar-txt/preview`, formData);
  }

  importTxt(file: File): Observable<BillingDocumentDetail> {
    const formData = new FormData();
    formData.append('archivo', file);
    return this.http.post<BillingDocumentDetail>(`${this.apiUrl}/importar-txt`, formData);
  }

  downloadPdf(documentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${documentId}/pdf`, { responseType: 'blob' });
  }
}
