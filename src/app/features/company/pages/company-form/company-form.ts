import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, map, of, switchMap } from 'rxjs';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiCheckboxComponent } from '../../../../shared/ui/ui-checkbox/ui-checkbox.component';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { CompanyFormModel, CompanyRequest, CompanyResponse } from '../../models/company.model';
import { CompanyService } from '../../services/company.service';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiButtonComponent,
    UiCheckboxComponent,
    UiInputComponent,
  ],
  templateUrl: './company-form.html',
  styleUrl: './company-form.scss',
})
export class CompanyForm implements OnInit, OnDestroy {
  private readonly maxLogoSize = 1024 * 1024;

  companyId: number | null = null;
  isLoading = false;
  isSaving = false;
  isDeletingLogo = false;
  error: string | null = null;
  rutEmpresaError: string | null = null;
  rutRepresentanteError: string | null = null;
  logoError: string | null = null;
  logoFile: File | null = null;
  logoPreviewUrl: string | null = null;
  hasLogo = false;

  empresa: CompanyFormModel = this.emptyCompany();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private companyService: CompanyService,
  ) {}

  get isEditMode(): boolean {
    return this.companyId !== null;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isInteger(id) && id > 0) {
      this.companyId = id;
      this.loadCompany(id);
    }
  }

  ngOnDestroy(): void {
    this.revokeLogoPreview();
  }

  cancelar(): void {
    this.router.navigate(['/empresas']);
  }

  downloadTemplate(): void {
    const headers = [
      'rutEmpresa', 'razonSocial', 'nombreFantasia', 'giro', 'direccion', 'ciudad', 'comuna',
      'pais', 'telefono', 'sitioWeb', 'emailPrincipal', 'emailContabilidad', 'rutRepresentante',
      'nombreRepresentante', 'telefonoRepresentante',
    ];
    const csv = `\uFEFF${headers.join(';')}\r\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-nueva-empresa.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  async uploadTemplate(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.error = null;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.error = 'La planilla debe ser un archivo CSV.';
      return;
    }
    try {
      this.empresa = { ...this.empresa, ...this.parseCompanyCsv(await file.text()) };
      this.validateRuts();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No fue posible leer la planilla.';
    }
  }

  parseCompanyCsv(content: string): CompanyRequest {
    const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) throw new Error('La planilla no contiene datos de una empresa.');
    if (lines.length > 2) throw new Error('La planilla debe contener una sola empresa.');
    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = this.parseCsvLine(lines[0], delimiter).map((value) => value.trim());
    const values = this.parseCsvLine(lines[1], delimiter).map((value) => value.trim());
    const required = [
      'rutEmpresa', 'razonSocial', 'nombreFantasia', 'giro', 'direccion', 'ciudad', 'comuna',
      'pais', 'telefono', 'sitioWeb', 'emailPrincipal', 'emailContabilidad', 'rutRepresentante',
      'nombreRepresentante', 'telefonoRepresentante',
    ];
    const missing = required.filter((header) => !headers.includes(header));
    if (missing.length) throw new Error(`Faltan columnas en la planilla: ${missing.join(', ')}.`);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    if (!row['rutEmpresa'] || !row['razonSocial']) throw new Error('Los campos rutEmpresa y razonSocial son obligatorios.');
    if (row['emailPrincipal'] && !this.isValidEmail(row['emailPrincipal'])) throw new Error('El email principal no es válido.');
    if (row['emailContabilidad'] && !this.isValidEmail(row['emailContabilidad'])) throw new Error('El email de contabilidad no es válido.');
    return Object.fromEntries(required.map((header) => [header, row[header]])) as unknown as CompanyRequest;
  }

  validateRuts(): void {
    this.rutEmpresaError = !this.empresa.rutEmpresa.trim()
      ? 'El RUT de la empresa es obligatorio.'
      : this.isValidRut(this.empresa.rutEmpresa) ? null : 'El RUT de la empresa no es válido.';
    this.rutRepresentanteError = this.empresa.rutRepresentante.trim() && !this.isValidRut(this.empresa.rutRepresentante)
      ? 'El RUT del representante no es válido.' : null;
  }

  guardar(form?: NgForm): void {
    if (this.isSaving) return;

    this.validateRuts();

    if (form?.invalid || this.rutEmpresaError || this.rutRepresentanteError) {
      form?.control.markAllAsTouched();
      this.error = 'Completa el RUT y la razón social antes de guardar.';
      return;
    }

    this.isSaving = true;
    this.error = null;

    const request = this.toRequest(this.empresa);
    const saveRequest = this.companyId
      ? this.companyService.update(this.companyId, request)
      : this.companyService.create(request);

    saveRequest.pipe(
      switchMap((savedCompany) =>
        savedCompany.activo !== this.empresa.activo
          ? this.companyService.changeStatus(savedCompany.id, this.empresa.activo)
          : of(savedCompany)
      ),
      switchMap((savedCompany) =>
        this.logoFile
          ? this.companyService.uploadLogo(savedCompany.id, this.logoFile).pipe(map(() => savedCompany))
          : of(savedCompany)
      ),
      finalize(() => this.isSaving = false),
    ).subscribe({
      next: () => this.router.navigate(['/empresas']),
      error: (error: HttpErrorResponse) => {
        this.error = error.status === 401 && this.logoFile
          ? 'La empresa se guardó, pero el backend rechazó la subida del logo por autenticación.'
          : this.getErrorMessage(error);
      },
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.logoError = null;

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      this.logoError = 'El logo debe ser PNG o JPG.';
      input.value = '';
      return;
    }

    if (file.size > this.maxLogoSize) {
      this.logoError = 'El logo no puede superar 1 MB.';
      input.value = '';
      return;
    }

    this.logoFile = file;
    this.setLogoPreview(URL.createObjectURL(file));
  }

  eliminarLogo(): void {
    if (this.logoFile) {
      this.clearSelectedLogo();
      if (this.companyId && this.hasLogo) {
        this.loadLogo(this.companyId);
      }
      return;
    }

    if (!this.companyId || this.isDeletingLogo) {
      this.clearSelectedLogo();
      return;
    }

    this.isDeletingLogo = true;
    this.logoError = null;

    this.companyService.deleteLogo(this.companyId)
      .pipe(finalize(() => this.isDeletingLogo = false))
      .subscribe({
        next: () => {
          this.hasLogo = false;
          this.clearSelectedLogo();
        },
        error: (error: HttpErrorResponse) => {
          this.logoError = error.status === 401
            ? 'El backend rechazó eliminar el logo por autenticación.'
            : 'No fue posible eliminar el logo.';
        },
      });
  }

  private loadCompany(id: number): void {
    this.isLoading = true;
    this.error = null;

    this.companyService.findById(id)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (company) => {
          this.empresa = this.toFormModel(company);
          this.loadLogo(id);
        },
        error: () => this.error = 'No fue posible cargar la empresa solicitada.',
      });
  }

  private loadLogo(id: number): void {
    this.companyService.getLogo(id).subscribe({
      next: (logo) => {
        this.hasLogo = true;
        this.setLogoPreview(URL.createObjectURL(logo));
      },
      error: () => {
        this.hasLogo = false;
        this.revokeLogoPreview();
      },
    });
  }

  private clearSelectedLogo(): void {
    this.logoFile = null;
    this.setLogoPreview(null);
  }

  private setLogoPreview(url: string | null): void {
    this.revokeLogoPreview();
    this.logoPreviewUrl = url;
  }

  private revokeLogoPreview(): void {
    if (this.logoPreviewUrl) {
      URL.revokeObjectURL(this.logoPreviewUrl);
      this.logoPreviewUrl = null;
    }
  }

  private emptyCompany(): CompanyFormModel {
    return {
      rutEmpresa: '',
      razonSocial: '',
      nombreFantasia: '',
      giro: '',
      direccion: '',
      ciudad: '',
      comuna: '',
      pais: 'Chile',
      telefono: '',
      sitioWeb: '',
      emailPrincipal: '',
      emailContabilidad: '',
      activo: true,
      rutRepresentante: '',
      nombreRepresentante: '',
      telefonoRepresentante: '',
    };
  }

  private toFormModel(company: CompanyResponse): CompanyFormModel {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...formModel } = company;
    return formModel;
  }

  private toRequest(company: CompanyFormModel): CompanyRequest {
    const { activo: _activo, ...request } = company;
    return request;
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    const body = error.error;
    if (typeof body === 'string' && body.trim()) return body;
    if (body?.message) return body.message;
    if (Array.isArray(body?.errors)) {
      return body.errors
        .map((item: { defaultMessage?: string; message?: string }) =>
          item.defaultMessage ?? item.message
        )
        .filter(Boolean)
        .join('. ');
    }
    if (error.status === 0) {
      return 'No hay conexión con el backend. Verifica que esté ejecutándose en http://localhost:8080.';
    }
    return `No fue posible guardar la empresa (${error.status}). Revisa los datos e intenta nuevamente.`;
  }

  private isValidRut(rut: string): boolean {
    const cleanRut = rut.replace(/[.\-\s]/g, '').toUpperCase();
    if (!/^\d{1,8}[0-9K]$/.test(cleanRut)) return false;
    const body = cleanRut.slice(0, -1);
    let sum = 0;
    let multiplier = 2;
    for (let index = body.length - 1; index >= 0; index--) {
      sum += Number(body[index]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const result = 11 - (sum % 11);
    const verifier = result === 11 ? '0' : result === 10 ? 'K' : String(result);
    return cleanRut.slice(-1) === verifier;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private parseCsvLine(line: string, delimiter: string): string[] {
    const values: string[] = [];
    let value = '';
    let quoted = false;
    for (let index = 0; index < line.length; index++) {
      const character = line[index];
      if (character === '"') {
        if (quoted && line[index + 1] === '"') { value += '"'; index++; }
        else quoted = !quoted;
      } else if (character === delimiter && !quoted) { values.push(value); value = ''; }
      else value += character;
    }
    if (quoted) throw new Error('La planilla contiene comillas sin cerrar.');
    values.push(value);
    return values;
  }
}
