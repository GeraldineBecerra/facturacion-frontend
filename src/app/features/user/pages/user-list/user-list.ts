import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/header/page-header.component';
import {
  DynamicTableComponent,
  TableAction,
  TableColumn,
} from '../../../../shared/components/table/table';
import { UserResponse } from '../../models/user.model';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [PageHeaderComponent, DynamicTableComponent],
  templateUrl: './user-list.html',
})
export class UserList implements OnInit {
  users: UserResponse[] = [];
  isLoading = false;
  error: string | null = null;

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'username', label: 'Usuario', type: 'avatar' },
    {
      key: 'rolMostrar',
      label: 'Rol',
      formatter: (value, user: UserResponse) => value || user.rol || 'Sin rol',
    },
    {
      key: 'activo',
      label: 'Estado',
      type: 'boolean',
      trueLabel: 'Activo',
      falseLabel: 'Inactivo',
    },
    { key: 'createdAt', label: 'Creación', type: 'date' },
    { key: 'updatedAt', label: 'Actualización', type: 'date' },
  ];

  actions: TableAction[] = [
    {
      type: 'custom',
      label: 'Cambiar estado',
      clickFn: (user) => this.toggleStatus(user),
      colorClass: 'text-amber-600 hover:bg-amber-50',
    },
  ];

  constructor(
    private router: Router,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.error = null;

    this.userService.findAll()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (users) => this.users = users,
        error: (error: HttpErrorResponse) => {
          this.users = [];
          this.error = error.status === 401 || error.status === 403
            ? 'Debes iniciar sesión con un JWT válido para consultar los usuarios.'
            : 'No fue posible cargar los usuarios desde el backend.';
        },
      });
  }

  createUser(): void {
    this.router.navigate(['/usuarios/nuevo']);
  }

  toggleStatus(user: UserResponse): void {
    this.userService.changeStatus(user.id, !user.activo).subscribe({
      next: (updatedUser) => {
        this.users = this.users.map((item) =>
          item.id === updatedUser.id ? updatedUser : item
        );
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.status === 401 || error.status === 403
          ? 'Tu sesión no permite cambiar el estado del usuario.'
          : 'No fue posible cambiar el estado del usuario.';
      },
    });
  }
}
