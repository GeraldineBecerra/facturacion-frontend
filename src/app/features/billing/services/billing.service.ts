import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TokenStorageService } from '../../../core/auth/token-storage.service';
import { TenantContextService } from '../../../core/tenant/tenant-context.service';
import {
  BillingDocument,
  BillingDocumentDetail,
  BillingCreateRequest,
  BillingDetailCreateRequest,
  BillingImportPreview,
  BillingUpdateRequest,
  SiiEstado,
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

  create(request: BillingCreateRequest): Observable<BillingDocument> {
    return this.http.post<BillingDocument>(this.apiUrl, request);
  }

  updateDraft(documentId: number, request: BillingUpdateRequest): Observable<BillingDocumentDetail> {
    return this.http.put<BillingDocumentDetail>(`${this.apiUrl}/${documentId}`, request);
  }

  addDetail(documentId: number, request: BillingDetailCreateRequest): Observable<BillingDocumentDetail> {
    return this.http.post<BillingDocumentDetail>(`${this.apiUrl}/${documentId}/detalles`, request);
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

  /** Paso 1: envía el DTE al SII (simulado). Genera track id y deja el documento en ENVIADO. */
  enviarSii(documentId: number): Observable<SiiEstado> {
    return this.http.post<SiiEstado>(`${this.apiUrl}/${documentId}/enviar-sii`, {});
  }

  /** Paso 2: consulta el estado del envío en el SII (acepta o rechaza). */
  consultarSii(documentId: number): Observable<SiiEstado> {
    return this.http.post<SiiEstado>(`${this.apiUrl}/${documentId}/consultar-sii`, {});
  }

  /** Estado SII actual del documento + historial (solo lectura). */
  getSiiStatus(documentId: number): Observable<SiiEstado> {
    return this.http.get<SiiEstado>(`${this.apiUrl}/${documentId}/estado-sii`);
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
