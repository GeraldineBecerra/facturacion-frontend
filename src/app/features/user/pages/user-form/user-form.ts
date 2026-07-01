import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiCheckboxComponent } from '../../../../shared/ui/ui-checkbox/ui-checkbox.component';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { CompanyResponse } from '../../../company/models/company.model';
import { CompanyService } from '../../../company/services/company.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiButtonComponent,
    UiCheckboxComponent,
    UiInputComponent,
  ],
  templateUrl: './user-form.html',
  styleUrl: './user-form.scss',
})
export class UserForm implements OnInit {
  companies: CompanyResponse[] = [];
  showPassword = false;
  isLoadingCompanies = false;
  isSaving = false;
  error: string | null = null;

  user = {
    username: '',
    password: '',
    rol: 'ROLE_USER',
    companyId: null as number | null,
    activo: true,
  };

  constructor(
    private router: Router,
    public auth: AuthService,
    private companyService: CompanyService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    if (this.isSuperAdmin) {
      this.loadAllCompanies();
      return;
    }

    this.user.rol = 'ROLE_USER';
    this.loadCurrentCompany();
  }

  get isSuperAdmin(): boolean {
    return this.auth.role() === 'ROLE_SUPER_ADMIN';
  }

  get currentCompanyName(): string {
    return this.companies.length > 0
      ? this.companies[0].razonSocial
      : (this.isLoadingCompanies ? 'Cargando empresa...' : '');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  cancel(): void {
    this.router.navigate(['/usuarios']);
  }

  saveUser(form: NgForm): void {
    const companyId = this.resolveCompanyId();

    if (form.invalid || companyId === null) {
      form.control.markAllAsTouched();
      this.error = 'Completa usuario, contraseña, rol y empresa.';
      return;
    }

    this.isSaving = true;
    this.error = null;

    this.userService.create({
      username: this.user.username,
      password: this.user.password,
      rol: this.isSuperAdmin ? this.user.rol : 'ROLE_USER',
    }, companyId).pipe(
      finalize(() => this.isSaving = false),
    ).subscribe({
      next: (createdUser) => {
        if (createdUser.activo === this.user.activo) {
          this.router.navigate(['/usuarios']);
          return;
        }

        this.userService.changeStatus(
          createdUser.id,
          this.user.activo,
          companyId,
        ).subscribe({
          next: () => this.router.navigate(['/usuarios']),
          error: () => {
            this.error = 'El usuario fue creado, pero no se pudo actualizar su estado.';
          },
        });
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.status === 401 || error.status === 403
          ? 'Necesitas una sesión válida para crear usuarios.'
          : error.error?.message || 'No fue posible crear el usuario.';
      },
    });
  }

  private loadAllCompanies(): void {
    this.isLoadingCompanies = true;

    this.companyService.findAll()
      .pipe(finalize(() => this.isLoadingCompanies = false))
      .subscribe({
        next: (companies) => {
          this.companies = companies.filter((company) => company.activo);
          if (this.companies.length === 1) {
            this.user.companyId = this.companies[0].id;
          }
        },
        error: () => {
          this.error = 'No fue posible cargar las empresas disponibles.';
        },
      });
  }

  private loadCurrentCompany(): void {
    const companyId = this.auth.companyId();
    if (companyId === null) {
      this.error = 'La sesión no contiene una empresa asociada.';
      return;
    }

    this.user.companyId = companyId;
    this.isLoadingCompanies = true;

    this.companyService.findById(companyId)
      .pipe(finalize(() => this.isLoadingCompanies = false))
      .subscribe({
        next: (company) => this.companies = [company],
        error: () => {
          this.error = 'No fue posible cargar la empresa asociada a tu sesión.';
        },
      });
  }

  private resolveCompanyId(): number | null {
    if (this.isSuperAdmin) {
      return this.user.companyId;
    }

    const companyId = this.auth.companyId();
    this.user.companyId = companyId;
    return companyId;
  }
}
