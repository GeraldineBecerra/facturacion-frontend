import { NgForm } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Role } from '../../models/role.model';
import { RoleService } from '../../services/role.service';
import { RoleList } from './role-list';

describe('Role module', () => {
  const role: Role = {
    id: 1,
    nombre: 'ROLE_ADMIN',
    nombreMostrar: 'Administrador',
    descripcion: 'Administra la empresa',
    activo: true,
  };

  it('loads roles', () => {
    const service = jasmine.createSpyObj<RoleService>('RoleService', ['findAll']);
    service.findAll.and.returnValue(of([role]));
    const component = new RoleList(service);

    component.ngOnInit();

    expect(component.roles).toEqual([role]);
    expect(component.isLoading).toBeFalse();
  });

  it('creates roles and resets the form', () => {
    const service = jasmine.createSpyObj<RoleService>('RoleService', ['create']);
    service.create.and.returnValue(of(role));
    const component = new RoleList(service);
    component.role = { nombre: 'ROLE_ADMIN', nombreMostrar: 'Administrador', descripcion: 'Administra' };
    const form = {
      invalid: false,
      control: { markAllAsTouched: jasmine.createSpy('touch') },
      resetForm: jasmine.createSpy('resetForm'),
    } as unknown as NgForm;

    component.save(form);

    expect(component.roles).toEqual([role]);
    expect(component.success).toBe('Rol creado correctamente.');
    expect(form.resetForm).toHaveBeenCalled();
  });

  it('shows role loading errors', () => {
    const service = jasmine.createSpyObj<RoleService>('RoleService', ['findAll']);
    service.findAll.and.returnValue(throwError(() => new Error('boom')));
    const component = new RoleList(service);

    component.loadRoles();

    expect(component.error).toContain('roles');
  });
});
