import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/header/page-header.component';
import { DynamicTableComponent, TableColumn } from '../../../../shared/components/table/table';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { Role, RoleRequest } from '../../models/role.model';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, DynamicTableComponent, UiButtonComponent, UiInputComponent],
  templateUrl: './role-list.html',
  styleUrl: './role-list.scss',
})
export class RoleList implements OnInit {
  roles: Role[] = [];
  role: RoleRequest = this.emptyRole();
  isLoading = false;
  isSaving = false;
  error: string | null = null;
  success: string | null = null;

  readonly columns: TableColumn[] = [
    { key: 'nombre', label: 'Nombre técnico', type: 'badge' },
    { key: 'nombreMostrar', label: 'Nombre visible', type: 'avatar', avatarKey: 'descripcion' },
    { key: 'activo', label: 'Estado', type: 'boolean', trueLabel: 'Activo', falseLabel: 'Inactivo' },
  ];

  constructor(private roleService: RoleService) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading = true;
    this.error = null;
    this.roleService.findAll().pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (roles) => this.roles = roles,
      error: () => this.error = 'No fue posible cargar los roles.',
    });
  }

  save(form: NgForm): void {
    if (form.invalid || this.isSaving) {
      form.control.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    this.error = null;
    this.success = null;
    this.roleService.create(this.role).pipe(finalize(() => this.isSaving = false)).subscribe({
      next: (role) => {
        this.roles = [...this.roles, role];
        this.role = this.emptyRole();
        form.resetForm(this.role);
        this.success = 'Rol creado correctamente.';
      },
      error: (error) => this.error = error.error?.message ?? 'No fue posible crear el rol.',
    });
  }

  private emptyRole(): RoleRequest {
    return { nombre: '', nombreMostrar: '', descripcion: '' };
  }
}
