import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone?: 'alert' | string | null;
}

export interface DashboardDocument {
  id: string;
  client: string;
  date: string;
  amount: string;
  status: string;
}

export interface DashboardAlert {
  title: string;
  description: string;
  icon: string;
  tone?: 'danger' | 'info' | string | null;
}

export interface DashboardFolio {
  name: string;
  available: number;
  total: number;
  percent: number;
}

export interface DashboardQuickAction {
  label: string;
  icon: string;
  route: string;
}

export interface DashboardCompanyRanking {
  name: string;
  documents: number;
  total: string;
  percent: number;
}

export interface DashboardRole {
  name: string;
  count: number;
}

export interface AdminDashboardResponse {
  metrics: DashboardMetric[];
  recentDocuments: DashboardDocument[];
  alerts: DashboardAlert[];
  folios: DashboardFolio[];
  quickActions: DashboardQuickAction[];
}

export interface SuperAdminDashboardResponse {
  metrics: DashboardMetric[];
  topCompanies: DashboardCompanyRanking[];
  alerts: DashboardAlert[];
  roles: DashboardRole[];
  quickActions: DashboardQuickAction[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly apiUrl = '/api/dashboard';

  constructor(private http: HttpClient) {}

  admin(): Observable<AdminDashboardResponse> {
    return this.http.get<AdminDashboardResponse>(`${this.apiUrl}/admin`);
  }

  superAdmin(): Observable<SuperAdminDashboardResponse> {
    return this.http.get<SuperAdminDashboardResponse>(`${this.apiUrl}/super-admin`);
  }
}
