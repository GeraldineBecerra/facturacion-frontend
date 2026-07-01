import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Role, RoleRequest } from '../models/role.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly apiUrl = '/api/roles';

  constructor(private http: HttpClient) {}

  findAll(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  create(request: RoleRequest): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, request);
  }
}
