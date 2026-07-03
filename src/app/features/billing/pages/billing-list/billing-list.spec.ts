import { ComponentFixture, TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localeEsCL from '@angular/common/locales/es-CL';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BillingDocument } from '../../models/billing.model';
import { BillingService } from '../../services/billing.service';
import { BillingList } from './billing-list';

registerLocaleData(localeEsCL);

describe('BillingList integration', () => {
  let fixture: ComponentFixture<BillingList>;
  let component: BillingList;
  let billingService: jasmine.SpyObj<BillingService>;
  let router: jasmine.SpyObj<Router>;

  const documents: BillingDocument[] = [
    {
      id: 1,
      codigoTipoDocumento: 33,
      tipoDocumento: 'Factura',
      clienteId: 1,
      clienteRut: '11.111.111-1',
      clienteRazonSocial: 'Cliente Uno',
      folio: 123,
      fechaEmision: '2026-06-30',
      fechaVencimiento: null,
      observaciones: null,
      moneda: 'CLP',
      tipoCambio: 1,
      estado: 'EMITIDO',
      estadoSii: null,
      montoNeto: 1000,
      montoIva: 190,
      montoTotal: 1190,
      rutEmisor: '76.011.711-0',
      razonSocialEmisor: 'Empresa',
      createdAt: '2026-06-30',
      updatedAt: '2026-06-30',
    },
    {
      id: 2,
      codigoTipoDocumento: 33,
      tipoDocumento: 'Factura',
      clienteId: 2,
      clienteRut: '22.222.222-2',
      clienteRazonSocial: 'Cliente Dos',
      folio: null,
      numeroDocumento: 'F-456',
      fechaEmision: '2026-06-30',
      fechaVencimiento: null,
      observaciones: null,
      moneda: 'CLP',
      tipoCambio: 1,
      estado: 'BORRADOR',
      estadoSii: null,
      montoNeto: 2000,
      montoIva: 380,
      montoTotal: 2380,
      rutEmisor: '76.011.711-0',
      razonSocialEmisor: 'Empresa',
      createdAt: '2026-06-30',
      updatedAt: '2026-06-30',
    },
  ];

  beforeEach(async () => {
    billingService = jasmine.createSpyObj<BillingService>('BillingService', ['findAll']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [BillingList],
      providers: [
        { provide: BillingService, useValue: billingService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(BillingList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads documents and calculates totals', () => {
    billingService.findAll.and.returnValue(of(documents));

    createComponent();

    expect(component.documents.length).toBe(2);
    expect(component.filteredDocuments.length).toBe(2);
    expect(component.receivedTotal).toBe(3570);
    expect(component.acceptedDocuments).toBe(1);
    expect(component.pendingDocuments).toBe(1);
  });

  it('filters by alternate invoice number and state', () => {
    billingService.findAll.and.returnValue(of(documents));
    createComponent();

    component.filters.folio = 'F-456';
    component.filters.estado = 'BORRADOR';
    component.search();

    expect(component.filteredDocuments.map((document) => document.id)).toEqual([2]);
  });

  it('surfaces service errors', () => {
    billingService.findAll.and.returnValue(throwError(() => new Error('boom')));

    createComponent();

    expect(component.error).toBe('No fue posible cargar los documentos tributarios.');
    expect(component.isLoading).toBeFalse();
  });

  it('navigates to create and detail routes', () => {
    billingService.findAll.and.returnValue(of(documents));
    createComponent();

    component.createBilling();
    component.viewDocument(documents[0]);

    expect(router.navigate).toHaveBeenCalledWith(['/facturacion/nueva']);
    expect(router.navigate).toHaveBeenCalledWith(['/facturacion', 1]);
  });
});
