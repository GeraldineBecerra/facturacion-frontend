import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/header/page-header.component';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { CafRequest, CafResponse, DocumentType, FolioControl } from '../../models/folio.model';
import { FolioService } from '../../services/folio.service';

interface FolioMetricCard {
  code: number;
  title: string;
  icon: string;
  available: number;
  status: 'ok' | 'warning' | 'critical';
  label: string;
}

@Component({
  selector: 'app-folio-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
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
  showCafModal = false;
  showManualModal = false;

  caf: CafRequest = this.emptyCaf();

  readonly primaryCodes = [33, 34, 61, 56];
  readonly iconByCode: Record<number, string> = {
    33: 'description',
    34: 'history_edu',
    56: 'request_quote',
    61: 'assignment_return',
    52: 'receipt_long',
    110: 'public',
  };

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

  get metricCards(): FolioMetricCard[] {
    return this.primaryCodes.map((code) => {
      const title = this.getDocumentTypeName(code);
      const available = this.availableFolios(code);
      const status = this.resolveAvailabilityStatus(available);
      return {
        code,
        title,
        icon: this.iconByCode[code] ?? 'article',
        available,
        status,
        label: status === 'critical' ? 'Crítico' : 'restantes',
      };
    });
  }

  get secondaryControls(): FolioControl[] {
    return this.controls.filter((control) => !this.primaryCodes.includes(control.codigoTipoDocumento));
  }

  get visibleSecondaryControls(): FolioControl[] {
    if (this.secondaryControls.length) {
      return this.secondaryControls;
    }

    return this.documentTypes
      .filter((type) => !this.primaryCodes.includes(type.codigoSii))
      .map((type) => ({
        id: type.id,
        cafActivoId: null,
        codigoTipoDocumento: type.codigoSii,
        tipoDocumento: type.descripcion,
        rangoDesde: null,
        rangoHasta: null,
        ultimoFolioUtilizado: null,
        estadoCaf: null,
      }));
  }

  get totalAvailable(): number {
    return this.cafs.reduce((total, caf) => total + Number(caf.foliosDisponibles ?? 0), 0);
  }

  get activeCafs(): number {
    return this.cafs.filter((caf) => this.isUsableCafStatus(caf.estado)).length;
  }

  get criticalTypes(): number {
    return this.metricCards.filter((card) => card.status === 'critical').length;
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
          this.showCafModal = false;
          this.showManualModal = false;
          this.loadData();
        },
        error: (error) => {
          this.error = error.error?.message ?? 'No fue posible cargar el CAF.';
        },
      });
  }

  openCafModal(): void {
    this.error = null;
    this.success = null;
    this.showCafModal = true;
  }

  closeCafModal(): void {
    if (this.isSaving) return;
    this.showCafModal = false;
  }

  openManualModal(code?: number): void {
    this.error = null;
    this.success = null;
    this.caf = {
      ...this.emptyCaf(),
      codigoTipoDocumento: code ?? null,
    };
    this.showManualModal = true;
  }

  closeManualModal(): void {
    if (this.isSaving) return;
    this.showManualModal = false;
  }

  availableFolios(code: number): number {
    return this.cafs
      .filter((caf) => caf.codigoTipoDocumento === code && this.isUsableCafStatus(caf.estado))
      .reduce((total, caf) => total + Number(caf.foliosDisponibles ?? 0), 0);
  }

  getDocumentTypeName(code: number): string {
    return this.documentTypes.find((type) => type.codigoSii === code)?.descripcion
      ?? this.controls.find((control) => control.codigoTipoDocumento === code)?.tipoDocumento
      ?? this.cafs.find((caf) => caf.codigoTipoDocumento === code)?.tipoDocumento
      ?? `DTE Tipo ${code}`;
  }

  getLatestCaf(code: number): CafResponse | null {
    return this.cafs
      .filter((caf) => caf.codigoTipoDocumento === code)
      .sort((a, b) => b.id - a.id)[0] ?? null;
  }

  getStatusLabel(status: string | null | undefined): string {
    return status ?? 'Sin CAF';
  }

  getStatusClass(status: string | null | undefined): string {
    return (status ?? 'SIN_CAF').toLowerCase();
  }

  trackMetric(_index: number, card: FolioMetricCard): number {
    return card.code;
  }

  trackControl(_index: number, control: FolioControl): number {
    return control.id || control.codigoTipoDocumento;
  }

  trackCaf(_index: number, caf: CafResponse): number {
    return caf.id;
  }

  private resolveAvailabilityStatus(available: number): FolioMetricCard['status'] {
    if (available <= 0) return 'critical';
    if (available <= 20) return 'warning';
    return 'ok';
  }

  private isUsableCafStatus(status: string | null | undefined): boolean {
    const normalized = (status ?? '').trim().toUpperCase();
    return ['ACTIVO', 'ACTIVA', 'DISPONIBLE', 'VIGENTE'].includes(normalized);
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
