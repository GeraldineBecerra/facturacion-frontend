import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TokenStorageService } from '../../../core/auth/token-storage.service';
import { CompanyRequest, CompanyResponse } from '../models/company.model';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly apiUrl = '/api/empresas';

  constructor(
    private http: HttpClient,
    private tokenStorage: TokenStorageService,
  ) {}

  findAll(): Observable<CompanyResponse[]> {
    return this.http.get<CompanyResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<CompanyResponse> {
    return this.http.get<CompanyResponse>(`${this.apiUrl}/${id}`);
  }

  create(request: CompanyRequest): Observable<CompanyResponse> {
    return this.http.post<CompanyResponse>(this.apiUrl, request);
  }

  update(id: number, request: CompanyRequest): Observable<CompanyResponse> {
    return this.http.put<CompanyResponse>(`${this.apiUrl}/${id}`, request);
  }

  changeStatus(id: number, active: boolean): Observable<CompanyResponse> {
    const params = new HttpParams().set('activo', active);
    return this.http.patch<CompanyResponse>(`${this.apiUrl}/${id}/estado`, null, { params });
  }

  uploadLogo(id: number, file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('archivo', file);
    return this.http.post<void>(`${this.apiUrl}/${id}/logo`, formData, {
      headers: this.tenantHeaders(id),
    });
  }

  getLogo(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/logo`, {
      headers: this.tenantHeaders(id),
      responseType: 'blob',
    });
  }

  deleteLogo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/logo`, {
      headers: this.tenantHeaders(id),
    });
  }

  private tenantHeaders(id: number): HttpHeaders {
    let headers = new HttpHeaders().set('X-Tenant-ID', String(id));
    const token = this.tokenStorage.getToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
}
