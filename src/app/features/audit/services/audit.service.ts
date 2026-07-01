import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditRecord } from '../models/audit.model';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly apiUrl = '/api/auditoria';

  constructor(private http: HttpClient) {}

  findAll(): Observable<AuditRecord[]> {
    return this.http.get<AuditRecord[]>(this.apiUrl);
  }
}
