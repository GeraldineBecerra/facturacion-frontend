import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { TokenStorageService } from '../core/auth/token-storage.service';
import { AuditService } from './audit/services/audit.service';
import { BillingService } from './billing/services/billing.service';
import { CompanyService } from './company/services/company.service';
import { CustomerService } from './customers/services/customer.service';
import { DocumentTypeService } from './document-type/services/document-type.service';
import { FolioService } from './folio/services/folio.service';
import { ProductService } from './product/services/product.service';
import { RoleService } from './role/services/role.service';
import { UserService } from './user/services/user.service';

describe('HTTP service contracts', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    const tokenStorage = jasmine.createSpyObj<TokenStorageService>('TokenStorageService', ['getToken']);
    tokenStorage.getToken.and.returnValue('token-123');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TokenStorageService, useValue: tokenStorage },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('CompanyService sends logo multipart with auth and tenant headers', () => {
    const service = TestBed.inject(CompanyService);
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });

    service.uploadLogo(6, file).subscribe();

    const request = httpMock.expectOne('/api/empresas/6/logo');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-Tenant-ID')).toBe('6');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-123');
    expect(request.request.body instanceof FormData).toBeTrue();
    expect(request.request.body.get('file')).toBe(file);
    expect(request.request.body.get('archivo')).toBe(file);
    request.flush({});
  });

  it('CompanyService updates company status with query params', () => {
    const service = TestBed.inject(CompanyService);

    service.changeStatus(4, false).subscribe();

    const request = httpMock.expectOne((req) =>
      req.method === 'PATCH' &&
      req.url === '/api/empresas/4/estado' &&
      req.params.get('activo') === 'false'
    );
    expect(request.request.method).toBe('PATCH');
    request.flush({ id: 4 });
  });

  it('CompanyService covers read, create, update and logo deletion requests', () => {
    const service = TestBed.inject(CompanyService);
    const company = { rutEmpresa: '76011711-0', razonSocial: 'Empresa' } as any;

    service.findById(6).subscribe();
    const find = httpMock.expectOne('/api/empresas/6');
    expect(find.request.method).toBe('GET');
    find.flush({ id: 6 });

    service.create(company).subscribe();
    const create = httpMock.expectOne('/api/empresas');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toBe(company);
    create.flush({ id: 6 });

    service.update(6, company).subscribe();
    const update = httpMock.expectOne('/api/empresas/6');
    expect(update.request.method).toBe('PUT');
    update.flush({ id: 6 });

    service.deleteLogo(6).subscribe();
    const deleteLogo = httpMock.expectOne('/api/empresas/6/logo');
    expect(deleteLogo.request.method).toBe('DELETE');
    expect(deleteLogo.request.headers.get('X-Tenant-ID')).toBe('6');
    deleteLogo.flush({});
  });

  it('UserService creates users with an explicit tenant header', () => {
    const service = TestBed.inject(UserService);

    service.create({ username: 'ana', password: 'secret', rol: 'ROLE_ADMIN', activo: true } as any, 9).subscribe();

    const request = httpMock.expectOne('/api/usuarios');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-Tenant-ID')).toBe('9');
    request.flush({ id: 1 });
  });

  it('UserService changes user status with the expected payload', () => {
    const service = TestBed.inject(UserService);

    service.changeStatus(10, true, 3).subscribe();

    const request = httpMock.expectOne('/api/usuarios/10/estado');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ activo: true });
    expect(request.request.headers.get('X-Tenant-ID')).toBe('3');
    request.flush({ id: 10 });
  });

  it('UserService covers read, update, role changes and status without tenant header', () => {
    const service = TestBed.inject(UserService);

    service.findById(10).subscribe();
    const find = httpMock.expectOne('/api/usuarios/10');
    expect(find.request.method).toBe('GET');
    find.flush({ id: 10 });

    service.update(10, { username: 'ana' }).subscribe();
    const update = httpMock.expectOne('/api/usuarios/10');
    expect(update.request.method).toBe('PUT');
    update.flush({ id: 10 });

    service.changeRole(10, 'ROLE_ADMIN').subscribe();
    const role = httpMock.expectOne('/api/usuarios/10/rol');
    expect(role.request.method).toBe('PATCH');
    expect(role.request.body).toEqual({ rol: 'ROLE_ADMIN' });
    role.flush({ id: 10 });

    service.changeStatus(10, false).subscribe();
    const status = httpMock.expectOne('/api/usuarios/10/estado');
    expect(status.request.headers.has('X-Tenant-ID')).toBeFalse();
    status.flush({ id: 10 });
  });

  it('CustomerService covers read, create and update endpoints', () => {
    const service = TestBed.inject(CustomerService);
    const customer = { rut: '11111111-1', razonSocial: 'Cliente' } as any;

    service.findById(4).subscribe();
    const find = httpMock.expectOne('/api/clientes/4');
    expect(find.request.method).toBe('GET');
    find.flush({ id: 4 });

    service.create(customer).subscribe();
    const create = httpMock.expectOne('/api/clientes');
    expect(create.request.method).toBe('POST');
    create.flush({ id: 4 });

    service.update(4, customer).subscribe();
    const update = httpMock.expectOne('/api/clientes/4');
    expect(update.request.method).toBe('PUT');
    update.flush({ id: 4 });
  });

  it('ProductService covers read, create and update endpoints', () => {
    const service = TestBed.inject(ProductService);
    const product = { codigo: 'SKU', nombre: 'Producto' } as any;

    service.findById(2).subscribe();
    const find = httpMock.expectOne('/api/productos/2');
    expect(find.request.method).toBe('GET');
    find.flush({ id: 2 });

    service.create(product).subscribe();
    const create = httpMock.expectOne('/api/productos');
    expect(create.request.method).toBe('POST');
    create.flush({ id: 2 });

    service.update(2, product).subscribe();
    const update = httpMock.expectOne('/api/productos/2');
    expect(update.request.method).toBe('PUT');
    update.flush({ id: 2 });
  });

  it('BillingService imports TXT files as multipart form data', () => {
    const service = TestBed.inject(BillingService);
    const file = new File(['txt'], 'factura.txt', { type: 'text/plain' });

    service.previewTxt(file).subscribe();

    const preview = httpMock.expectOne('/api/api/documentos/importar-txt/preview');
    expect(preview.request.method).toBe('POST');
    expect(preview.request.body.get('archivo')).toBe(file);
    preview.flush({});

    service.importTxt(file).subscribe();
    const importRequest = httpMock.expectOne('/api/api/documentos/importar-txt');
    expect(importRequest.request.method).toBe('POST');
    expect(importRequest.request.body.get('archivo')).toBe(file);
    importRequest.flush({ documento: { id: 1 }, detalles: [], referencias: [], guiaDespacho: null });
  });

  it('BillingService lists documents with optional status filters', () => {
    const service = TestBed.inject(BillingService);

    service.findAll({ estado: 'EMITIDO' }).subscribe();

    const request = httpMock.expectOne((req) =>
      req.url === '/api/api/documentos' && req.params.get('estado') === 'EMITIDO'
    );
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('BillingService downloads PDFs as blobs', () => {
    const service = TestBed.inject(BillingService);

    service.downloadPdf(15).subscribe();

    const request = httpMock.expectOne('/api/api/documentos/15/pdf');
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob(['pdf'], { type: 'application/pdf' }));
  });

  it('simple catalog services use their expected endpoints', () => {
    TestBed.inject(CustomerService).findAll().subscribe();
    const customers = httpMock.expectOne('/api/clientes');
    expect(customers.request.method).toBe('GET');
    customers.flush([]);

    TestBed.inject(ProductService).delete(2).subscribe();
    const productDelete = httpMock.expectOne('/api/productos/2');
    expect(productDelete.request.method).toBe('DELETE');
    productDelete.flush({});

    TestBed.inject(RoleService).create({ nombre: 'ROLE_TEST', nombreMostrar: 'Test' } as any).subscribe();
    const roleCreate = httpMock.expectOne('/api/roles');
    expect(roleCreate.request.method).toBe('POST');
    roleCreate.flush({ id: 1 });

    TestBed.inject(RoleService).findAll().subscribe();
    const roleFindAll = httpMock.expectOne('/api/roles');
    expect(roleFindAll.request.method).toBe('GET');
    roleFindAll.flush([]);

    TestBed.inject(AuditService).findAll().subscribe();
    const audit = httpMock.expectOne('/api/auditoria');
    expect(audit.request.method).toBe('GET');
    audit.flush([]);

    TestBed.inject(DocumentTypeService).findAll().subscribe();
    const documentTypes = httpMock.expectOne('/api/api/tipos-documento');
    expect(documentTypes.request.method).toBe('GET');
    documentTypes.flush([]);

    TestBed.inject(FolioService).findControls().subscribe();
    const folioControls = httpMock.expectOne('/api/api/folios/control');
    expect(folioControls.request.method).toBe('GET');
    folioControls.flush([]);

    TestBed.inject(FolioService).findCafs().subscribe();
    const cafs = httpMock.expectOne('/api/api/folios/caf');
    expect(cafs.request.method).toBe('GET');
    cafs.flush([]);

    TestBed.inject(FolioService).uploadCaf({ codigoTipoDocumento: 33 } as any).subscribe();
    const cafUpload = httpMock.expectOne('/api/api/folios/caf');
    expect(cafUpload.request.method).toBe('POST');
    cafUpload.flush({ id: 1 });
  });
});
