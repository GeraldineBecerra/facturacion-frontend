import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  DashboardAlert,
  DashboardCompanyRanking,
  DashboardMetric,
  DashboardQuickAction,
  DashboardRole,
  DashboardService,
} from './dashboard.service';

@Component({
  selector: 'app-dashboard-super-admin',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './dashboard-super-admin.html',
  styleUrl: './dashboard-super-admin.scss',
})
export class DashboardSuperAdmin implements OnInit {
  isLoading = true;
  errorMessage = '';

  metrics: DashboardMetric[] = [
    { label: 'Empresas totales', value: '0', detail: 'Cargando datos', icon: 'domain' },
    { label: 'Empresas activas', value: '0', detail: 'Operativas', icon: 'verified' },
    { label: 'Usuarios globales', value: '0', detail: 'Distribuidos por rol', icon: 'groups' },
    { label: 'Sin logo', value: '0', detail: 'Pendientes de completar perfil', icon: 'image_not_supported', tone: 'alert' },
  ];

  topCompanies: DashboardCompanyRanking[] = [];
  alerts: DashboardAlert[] = [];
  roles: DashboardRole[] = [];

  quickActions: DashboardQuickAction[] = [
    { label: 'Trabajar con empresa', icon: 'change_circle', route: '/seleccionar-empresa' },
    { label: 'Crear empresa', icon: 'add_business', route: '/empresas/nueva' },
    { label: 'Crear usuario', icon: 'person_add', route: '/usuarios/nuevo' },
    { label: 'Auditoria', icon: 'history_edu', route: '/auditoria' },
  ];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.superAdmin().subscribe({
      next: (dashboard) => {
        this.metrics = dashboard.metrics;
        this.topCompanies = dashboard.topCompanies;
        this.alerts = dashboard.alerts;
        this.roles = dashboard.roles;
        this.quickActions = dashboard.quickActions;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar los indicadores globales del dashboard.';
        this.isLoading = false;
      },
    });
  }
}
