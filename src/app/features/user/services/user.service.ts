import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserCreateRequest, UserResponse, UserUpdateRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = '/api/usuarios';

  constructor(private http: HttpClient) {}

  findAll(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/${id}`);
  }

  create(request: UserCreateRequest, companyId: number): Observable<UserResponse> {
    const headers = new HttpHeaders().set('X-Tenant-ID', String(companyId));
    return this.http.post<UserResponse>(this.apiUrl, request, { headers });
  }

  update(id: number, request: UserUpdateRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/${id}`, request);
  }

  changeRole(id: number, role: string): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.apiUrl}/${id}/rol`, { rol: role });
  }

  changeStatus(id: number, active: boolean, companyId?: number): Observable<UserResponse> {
    const headers = companyId
      ? new HttpHeaders().set('X-Tenant-ID', String(companyId))
      : undefined;
    return this.http.patch<UserResponse>(
      `${this.apiUrl}/${id}/estado`,
      { activo: active },
      { headers },
    );
  }
}
