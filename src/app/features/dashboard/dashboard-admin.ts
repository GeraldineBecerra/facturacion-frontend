import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  DashboardAlert,
  DashboardDocument,
  DashboardFolio,
  DashboardMetric,
  DashboardQuickAction,
  DashboardService,
} from './dashboard.service';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.scss',
})
export class DashboardAdmin implements OnInit {
  isLoading = true;
  errorMessage = '';

  metrics: DashboardMetric[] = [
    { label: 'Facturado este mes', value: '$0', detail: 'Cargando datos', icon: 'payments' },
    { label: 'Borradores', value: '0', detail: 'Pendientes de emision', icon: 'edit_note' },
    { label: 'Documentos emitidos', value: '0', detail: 'Historico de la empresa', icon: 'task_alt' },
    { label: 'Errores', value: '0', detail: 'Requieren revision', icon: 'warning', tone: 'alert' },
  ];

  recentDocuments: DashboardDocument[] = [];
  alerts: DashboardAlert[] = [];
  folios: DashboardFolio[] = [];

  quickActions: DashboardQuickAction[] = [
    { label: 'Nueva factura', icon: 'receipt_long', route: '/facturacion/nueva' },
    { label: 'Nuevo cliente', icon: 'person_add', route: '/clientes/nuevo' },
    { label: 'Productos', icon: 'inventory_2', route: '/productos' },
    { label: 'Perfil empresa', icon: 'account_circle', route: '/perfil' },
  ];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.admin().subscribe({
      next: (dashboard) => {
        this.metrics = dashboard.metrics;
        this.recentDocuments = dashboard.recentDocuments;
        this.alerts = dashboard.alerts;
        this.folios = dashboard.folios;
        this.quickActions = dashboard.quickActions;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar los indicadores reales del dashboard.';
        this.isLoading = false;
      },
    });
  }
}
