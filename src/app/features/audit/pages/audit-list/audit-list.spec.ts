import { of, throwError } from 'rxjs';
import { AuditRecord } from '../../models/audit.model';
import { AuditService } from '../../services/audit.service';
import { AuditList } from './audit-list';

describe('Audit module', () => {
  const createRecord: AuditRecord = {
    id: 1,
    tabla: 'clientes',
    accion: 'CREATE',
    usuarioId: 6,
    fecha: '2026-06-01',
    detalle: 'Cliente creado',
  };
  const deleteRecord: AuditRecord = {
    id: 2,
    tabla: 'productos',
    accion: 'DELETE',
    usuarioId: 7,
    fecha: '2026-06-02',
    detalle: 'Producto eliminado',
  };

  it('loads and filters audit records', () => {
    const service = jasmine.createSpyObj<AuditService>('AuditService', ['findAll']);
    service.findAll.and.returnValue(of([createRecord, deleteRecord]));
    const component = new AuditList(service);

    component.ngOnInit();
    component.filters = { search: 'cliente', action: 'CREATE' };
    component.filter();

    expect(component.filteredRecords).toEqual([createRecord]);
    expect(component.actions).toEqual(['CREATE', 'DELETE']);
  });

  it('clears audit filters', () => {
    const component = new AuditList({} as AuditService);
    component.records = [createRecord];
    component.filters = { search: 'cliente', action: 'CREATE' };

    component.clearFilters();

    expect(component.filters).toEqual({ search: '', action: '' });
    expect(component.filteredRecords).toEqual([createRecord]);
  });

  it('shows audit load errors', () => {
    const service = jasmine.createSpyObj<AuditService>('AuditService', ['findAll']);
    service.findAll.and.returnValue(throwError(() => new Error('boom')));
    const component = new AuditList(service);

    component.loadRecords();

    expect(component.error).toContain('auditor');
  });
});
