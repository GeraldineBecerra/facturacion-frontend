import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/header/page-header.component';
import { DynamicTableComponent, TableColumn } from '../../../../shared/components/table/table';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { CafRequest, CafResponse, DocumentType, FolioControl } from '../../models/folio.model';
import { FolioService } from '../../services/folio.service';

@Component({
  selector: 'app-folio-admin',
  standalone: true,
  imports: [
    FormsModule,
    PageHeaderComponent,
    DynamicTableComponent,
    UiButtonComponent,
    UiInputComponent,
  ],
  templateUrl: './folio-admin.html',
  styleUrl: './folio-admin.scss',
})
export class FolioAdmin implements OnInit {
  documentTypes: DocumentType[] = [];
  cafs: CafResponse[] = [];
  controls: FolioControl[] = [];
  isLoading = false;
  isSaving = false;
  error: string | null = null;
  success: string | null = null;

  caf: CafRequest = this.emptyCaf();

  readonly cafColumns: TableColumn[] = [
    { key: 'tipoDocumento', label: 'Tipo de documento', type: 'avatar', avatarKey: 'codigoTipoDocumento' },
    { key: 'rangoDesde', label: 'Desde' },
    { key: 'rangoHasta', label: 'Hasta' },
    { key: 'foliosDisponibles', label: 'Disponibles' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeColors: {
        ACTIVO: 'bg-green-100 text-green-800',
        AGOTADO: 'bg-amber-100 text-amber-800',
        VENCIDO: 'bg-red-100 text-red-800',
      },
    },
    { key: 'fechaVencimiento', label: 'Vencimiento', type: 'date' },
  ];

  readonly controlColumns: TableColumn[] = [
    { key: 'tipoDocumento', label: 'Tipo de documento', type: 'avatar', avatarKey: 'codigoTipoDocumento' },
    { key: 'cafActivoId', label: 'CAF activo' },
    { key: 'rangoDesde', label: 'Desde' },
    { key: 'rangoHasta', label: 'Hasta' },
    { key: 'ultimoFolioUtilizado', label: 'Último utilizado' },
    {
      key: 'estadoCaf',
      label: 'Estado',
      type: 'badge',
      badgeColors: {
        ACTIVO: 'bg-green-100 text-green-800',
        AGOTADO: 'bg-amber-100 text-amber-800',
        VENCIDO: 'bg-red-100 text-red-800',
      },
    },
  ];

  constructor(private folioService: FolioService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      documentTypes: this.folioService.findDocumentTypes(),
      cafs: this.folioService.findCafs(),
      controls: this.folioService.findControls(),
    }).pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: ({ documentTypes, cafs, controls }) => {
          this.documentTypes = documentTypes;
          this.cafs = cafs;
          this.controls = controls;
        },
        error: () => this.error = 'No fue posible cargar la administración de folios.',
      });
  }

  uploadCaf(form: NgForm): void {
    if (form.invalid || this.caf.codigoTipoDocumento === null || this.isSaving) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.error = null;
    this.success = null;

    this.folioService.uploadCaf(this.caf)
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: () => {
          this.success = 'CAF cargado correctamente.';
          this.caf = this.emptyCaf();
          form.resetForm(this.caf);
          this.loadData();
        },
        error: (error) => {
          this.error = error.error?.message ?? 'No fue posible cargar el CAF.';
        },
      });
  }

  private emptyCaf(): CafRequest {
    return {
      codigoTipoDocumento: null,
      rangoDesde: null,
      rangoHasta: null,
      fechaAutorizacion: '',
      fechaVencimiento: null,
      cafXml: '',
    };
  }
}
