import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TokenStorageService } from '../../../core/auth/token-storage.service';
import { TenantContextService } from '../../../core/tenant/tenant-context.service';
import {
  BillingDocument,
  BillingDocumentDetail,
  BillingImportPreview,
} from '../models/billing.model';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly apiUrl = '/api/api/documentos';

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService,
    private tenantContext: TenantContextService,
  ) {}

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

  emitDocument(documentId: number): Observable<BillingDocumentDetail> {
    return this.http.post<BillingDocumentDetail>(`${this.apiUrl}/${documentId}/emitir`, {});
  }

  downloadPdf(documentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${documentId}/pdf`, {
      headers: this.downloadHeaders(),
      responseType: 'blob',
    });
  }

  downloadTxt(documentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${documentId}/txt`, {
      headers: this.downloadHeaders(),
      responseType: 'blob',
    });
  }

  private downloadHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this.tokenStorage.getToken();
    const companyId = this.tenantContext.companyId;

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    if (companyId) {
      headers = headers.set('X-Tenant-ID', String(companyId));
    }

    return headers;
  }
}
