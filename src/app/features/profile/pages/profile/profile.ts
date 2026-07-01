import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { PageHeaderComponent } from '../../../../shared/components/header/page-header.component';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { CompanyResponse } from '../../../company/models/company.model';
import { CompanyService } from '../../../company/services/company.service';
import { TenantContextService } from '../../../../core/tenant/tenant-context.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, UiButtonComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit, OnDestroy {
  private readonly maxLogoSize = 1024 * 1024;

  company: CompanyResponse | null = null;
  isLoading = false;
  isUploadingLogo = false;
  isDeletingLogo = false;
  error: string | null = null;
  logoError: string | null = null;
  logoSuccess: string | null = null;
  logoPreviewUrl: string | null = null;

  constructor(
    public auth: AuthService,
    private companyService: CompanyService,
    private tenantContext: TenantContextService,
  ) {}

  ngOnInit(): void {
    this.loadCompany();
  }

  ngOnDestroy(): void {
    this.revokeLogoPreview();
  }

  get roleLabel(): string {
    switch (this.auth.role()) {
      case 'ROLE_SUPER_ADMIN':
        return 'Superadministrador';
      case 'ROLE_ADMIN':
        return 'Administrador';
      case 'ROLE_USER':
        return 'Usuario';
      default:
        return 'Sin rol';
    }
  }

  get companyInitials(): string {
    const name = this.company?.nombreFantasia || this.company?.razonSocial || '';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'EM';
  }

  get isGlobalSession(): boolean {
    return this.auth.role() === 'ROLE_SUPER_ADMIN' && !this.tenantContext.companyId;
  }

  loadCompany(): void {
    const companyId = this.auth.companyId() ?? this.tenantContext.companyId;
    if (!companyId) {
      if (this.auth.role() === 'ROLE_SUPER_ADMIN') {
        this.company = null;
        this.error = null;
        return;
      }
      this.error = 'El token de sesión no contiene una empresa asociada.';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.companyService.findById(companyId)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (company) => {
          this.company = company;
          this.loadLogo(company.id);
        },
        error: () => {
          this.error = 'No fue posible cargar los datos de la empresa asociada a tu sesión.';
        },
      });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.company || this.isUploadingLogo) return;

    this.logoError = null;
    this.logoSuccess = null;

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

    this.isUploadingLogo = true;
    this.companyService.uploadLogo(this.company.id, file)
      .pipe(finalize(() => {
        this.isUploadingLogo = false;
        input.value = '';
      }))
      .subscribe({
        next: () => {
          this.logoSuccess = 'Logo actualizado correctamente.';
          this.loadLogo(this.company!.id);
        },
        error: (error) => {
          this.logoError = error.status === 401
            ? 'El backend rechazó la subida del logo por autenticación. Revisa permisos del endpoint POST /empresas/{id}/logo.'
            : 'No fue posible subir el logo.';
        },
      });
  }

  deleteLogo(): void {
    if (!this.company || this.isDeletingLogo) return;

    this.isDeletingLogo = true;
    this.logoError = null;
    this.logoSuccess = null;

    this.companyService.deleteLogo(this.company.id)
      .pipe(finalize(() => this.isDeletingLogo = false))
      .subscribe({
        next: () => {
          this.logoSuccess = 'Logo eliminado correctamente.';
          this.revokeLogoPreview();
        },
        error: (error) => {
          this.logoError = error.status === 401
            ? 'El backend rechazó eliminar el logo por autenticación.'
            : 'No fue posible eliminar el logo.';
        },
      });
  }

  private loadLogo(companyId: number): void {
    this.companyService.getLogo(companyId).subscribe({
      next: (logo) => this.setLogoPreview(URL.createObjectURL(logo)),
      error: () => this.revokeLogoPreview(),
    });
  }

  private setLogoPreview(url: string): void {
    this.revokeLogoPreview();
    this.logoPreviewUrl = url;
  }

  private revokeLogoPreview(): void {
    if (this.logoPreviewUrl) {
      URL.revokeObjectURL(this.logoPreviewUrl);
      this.logoPreviewUrl = null;
    }
  }
}
