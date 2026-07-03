import { NgForm } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { CafResponse, DocumentType, FolioControl } from '../../models/folio.model';
import { FolioService } from '../../services/folio.service';
import { FolioAdmin } from './folio-admin';

describe('Folio module', () => {
  const documentType: DocumentType = { id: 1, codigoSii: 33, descripcion: 'Factura electronica' };
  const caf: CafResponse = {
    id: 2,
    codigoTipoDocumento: 33,
    tipoDocumento: 'Factura',
    rangoDesde: 1,
    rangoHasta: 100,
    fechaAutorizacion: '2026-06-01',
    fechaVencimiento: null,
    estado: 'DISPONIBLE',
    foliosGenerados: 100,
    foliosDisponibles: 99,
  };
  const control: FolioControl = {
    id: 3,
    cafActivoId: 2,
    codigoTipoDocumento: 33,
    tipoDocumento: 'Factura',
    rangoDesde: 1,
    rangoHasta: 100,
    ultimoFolioUtilizado: 1,
    estadoCaf: 'DISPONIBLE',
  };

  it('loads document types, CAFs and folio controls', () => {
    const service = jasmine.createSpyObj<FolioService>('FolioService', [
      'findDocumentTypes',
      'findCafs',
      'findControls',
    ]);
    service.findDocumentTypes.and.returnValue(of([documentType]));
    service.findCafs.and.returnValue(of([caf]));
    service.findControls.and.returnValue(of([control]));
    const component = new FolioAdmin(service);

    component.ngOnInit();

    expect(component.documentTypes).toEqual([documentType]);
    expect(component.cafs).toEqual([caf]);
    expect(component.controls).toEqual([control]);
    expect(component.metricCards[0].available).toBe(99);
    expect(component.metricCards[0].status).toBe('ok');
  });

  it('uploads a CAF and reloads data', () => {
    const service = jasmine.createSpyObj<FolioService>('FolioService', [
      'findDocumentTypes',
      'findCafs',
      'findControls',
      'uploadCaf',
    ]);
    service.findDocumentTypes.and.returnValue(of([documentType]));
    service.findCafs.and.returnValue(of([caf]));
    service.findControls.and.returnValue(of([control]));
    service.uploadCaf.and.returnValue(of(caf));
    const component = new FolioAdmin(service);
    component.caf = {
      codigoTipoDocumento: 33,
      rangoDesde: 1,
      rangoHasta: 100,
      fechaAutorizacion: '2026-06-01',
      fechaVencimiento: null,
      cafXml: '<CAF></CAF>',
    };
    const form = {
      invalid: false,
      control: { markAllAsTouched: jasmine.createSpy('touch') },
      resetForm: jasmine.createSpy('resetForm'),
    } as unknown as NgForm;

    component.uploadCaf(form);

    expect(service.uploadCaf).toHaveBeenCalled();
    expect(component.success).toBe('CAF cargado correctamente.');
    expect(service.findControls).toHaveBeenCalled();
  });

  it('shows folio administration load errors', () => {
    const service = jasmine.createSpyObj<FolioService>('FolioService', [
      'findDocumentTypes',
      'findCafs',
      'findControls',
    ]);
    service.findDocumentTypes.and.returnValue(throwError(() => new Error('boom')));
    service.findCafs.and.returnValue(of([]));
    service.findControls.and.returnValue(of([]));
    const component = new FolioAdmin(service);

    component.loadData();

    expect(component.error).toContain('folios');
  });
});
