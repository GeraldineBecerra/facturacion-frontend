import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/header/page-header.component';
import { DynamicTableComponent, TableColumn } from '../../../../shared/components/table/table';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { AuditRecord } from '../../models/audit.model';
import { AuditService } from '../../services/audit.service';

@Component({
  selector: 'app-audit-list',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, DynamicTableComponent, UiButtonComponent, UiInputComponent],
  templateUrl: './audit-list.html',
  styleUrl: './audit-list.scss',
})
export class AuditList implements OnInit {
  records: AuditRecord[] = [];
  filteredRecords: AuditRecord[] = [];
  filters = { search: '', action: '' };
  isLoading = false;
  error: string | null = null;

  readonly columns: TableColumn[] = [
    { key: 'fecha', label: 'Fecha', type: 'date', sortable: true },
    { key: 'tabla', label: 'Módulo', type: 'avatar', avatarKey: 'usuarioId' },
    {
      key: 'accion',
      label: 'Acción',
      type: 'badge',
      badgeColors: {
        CREATE: 'bg-green-100 text-green-800',
        UPDATE: 'bg-blue-100 text-blue-800',
        DELETE: 'bg-red-100 text-red-800',
        SAVE: 'bg-violet-100 text-violet-800',
      },
    },
    { key: 'usuarioId', label: 'Usuario ID' },
    {
      key: 'detalle',
      label: 'Detalle',
      formatter: (value: string | null) =>
        value && value.length > 90 ? `${value.slice(0, 90)}…` : value ?? '—',
    },
  ];

  constructor(private auditService: AuditService) {}

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    this.isLoading = true;
    this.error = null;
    this.auditService.findAll().pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (records) => {
        this.records = records;
        this.filter();
      },
      error: () => this.error = 'No fue posible cargar la auditoría.',
    });
  }

  filter(): void {
    const term = this.filters.search.trim().toLowerCase();
    const action = this.filters.action;
    this.filteredRecords = this.records.filter((record) => {
      const matchesTerm = !term ||
        [record.tabla, record.accion, record.detalle, String(record.usuarioId ?? '')]
          .some((value) => value?.toLowerCase().includes(term));
      return matchesTerm && (!action || record.accion === action);
    });
  }

  clearFilters(): void {
    this.filters = { search: '', action: '' };
    this.filter();
  }

  get actions(): string[] {
    return [...new Set(this.records.map((record) => record.accion))].sort();
  }
}
