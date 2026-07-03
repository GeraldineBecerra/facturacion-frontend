import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CustomerResponse } from '../../../customers/models/customer.model';
import { CustomerService } from '../../../customers/services/customer.service';
import { BillingImportPreview } from '../../models/billing.model';
import { BillingService } from '../../services/billing.service';
import { BillingForm } from './billing-form';

describe('Billing form module', () => {
  let router: jasmine.SpyObj<Router>;
  let billingService: jasmine.SpyObj<BillingService>;
  let customerService: jasmine.SpyObj<CustomerService>;
  let component: BillingForm;

  const customer = {
    id: 1,
    rut: '11111111-1',
    razonSocial: 'Cliente Uno',
    giro: 'Servicios',
    direccion: 'Calle',
    ciudad: 'Santiago',
    comuna: 'Santiago',
    pais: 'Chile',
    email: 'cliente@test.cl',
  } as CustomerResponse;

  const preview: BillingImportPreview = {
    codigoTipoDocumento: 33,
    clienteId: 1,
    clienteRazonSocial: 'Cliente Uno',
    clienteEncontrado: true,
    fechaEmision: '2026-06-01',
    fechaVencimiento: '2026-07-01',
    condicionPago: 'Credito 30 dias',
    moneda: 'CLP',
    tipoCambio: 1,
    observaciones: 'Obs',
    detalles: [
      { numero: 1, codigoProducto: null, descripcion: 'Servicio', cantidad: 2, precioUnitario: 1000, subtotal: 2000 },
    ],
    montoNeto: 2000,
    montoIva: 380,
    montoTotal: 2380,
    advertencias: ['Advertencia'],
  };

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    billingService = jasmine.createSpyObj<BillingService>('BillingService', [
      'previewTxt',
      'importTxt',
      'emitDocument',
      'downloadPdf',
    ]);
    customerService = jasmine.createSpyObj<CustomerService>('CustomerService', ['findById']);
    component = new BillingForm(router, billingService, customerService);
  });

  it('calculates line totals, subtotal, IVA and total', () => {
    component.details = [
      { descripcion: 'Servicio', cantidad: 2, unidadMedida: 'UN', precioUnitario: 1000, descuento: 10 },
    ];

    expect(component.getLineTotal(component.details[0])).toBe(1800);
    expect(component.subtotal).toBe(1800);
    expect(component.ivaAmount).toBe(342);
    expect(component.total).toBe(2142);
  });

  it('previews imported TXT files and loads customer data without downloading the PDF', () => {
    billingService.previewTxt.and.returnValue(of(preview));
    customerService.findById.and.returnValue(of(customer));
    const input = document.createElement('input');
    const file = new File(['txt'], 'factura.txt', { type: 'text/plain' });
    Object.defineProperty(input, 'files', { value: [file] });

    component.onFileSelected({ target: input } as unknown as Event);

    expect(component.selectedImportFile).toBe(file);
    expect(component.importSuccess).toContain('Emitir factura');
    expect(component.billing.rutReceptor).toBe(customer.rut);
    expect(billingService.importTxt).not.toHaveBeenCalled();
    expect(billingService.downloadPdf).not.toHaveBeenCalled();
  });

  it('does not keep the import file when preview cannot match a customer', () => {
    billingService.previewTxt.and.returnValue(of({ ...preview, clienteId: null, clienteEncontrado: false }));
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [new File(['txt'], 'factura.txt') ] });

    component.onFileSelected({ target: input } as unknown as Event);

    expect(component.selectedImportFile).toBeNull();
    expect(component.importError).toContain('cliente no existe');
  });

  it('imports, emits and downloads PDF only when saving an imported invoice', () => {
    spyOn(URL, 'createObjectURL').and.returnValue('blob:pdf');
    spyOn(URL, 'revokeObjectURL');
    spyOn(document, 'createElement').and.returnValue({ click: jasmine.createSpy('click') } as any);
    const file = new File(['txt'], 'factura.txt');
    component.selectedImportFile = file;
    billingService.importTxt.and.returnValue(of({
      documento: {
        id: 9,
        folio: null,
        numeroDocumento: null,
        numeroFactura: null,
      } as any,
      detalles: [],
      referencias: [],
      guiaDespacho: null,
    }));
    billingService.emitDocument.and.returnValue(of({
      documento: {
        id: 9,
        folio: 123,
        numeroDocumento: null,
        numeroFactura: null,
      } as any,
      detalles: [],
      referencias: [],
      guiaDespacho: null,
    }));
    billingService.downloadPdf.and.returnValue(of(new Blob(['pdf'], { type: 'application/pdf' })));

    component.saveBilling();

    expect(billingService.importTxt).toHaveBeenCalledWith(file);
    expect(billingService.emitDocument).toHaveBeenCalledWith(9);
    expect(billingService.downloadPdf).toHaveBeenCalledWith(9);
    expect(component.importSuccess).toContain('123');
  });

  it('navigates back when saving a manual billing payload', () => {
    spyOn(console, 'log');
    component.selectedImportFile = null;

    component.saveBilling();

    expect(router.navigate).toHaveBeenCalledWith(['/facturacion']);
  });

  it('shows import errors from the backend', () => {
    billingService.previewTxt.and.returnValue(throwError(() => ({ error: { message: 'Archivo invalido' } })));
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [new File(['bad'], 'bad.txt')] });

    component.onFileSelected({ target: input } as unknown as Event);

    expect(component.importError).toBe('Archivo invalido');
    expect(component.selectedImportFile).toBeNull();
  });
});
