import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { TenantContextService } from '../../../core/tenant/tenant-context.service';
import { CustomerResponse } from '../models/customer.model';
import { CustomerService } from '../services/customer.service';
import { CustomersForm } from './customers-form/customers-form';
import { CustomersList } from './customers-list/customers-list';

describe('Customers module', () => {
  const customer: CustomerResponse = {
    id: 4,
    rut: '11111111-1',
    razonSocial: 'Cliente Uno',
    nombreFantasia: 'Uno',
    giro: 'Servicios',
    direccion: 'Calle',
    ciudad: 'Santiago',
    comuna: 'Santiago',
    region: '',
    pais: 'Chile',
    telefono: '123',
    email: 'cliente@test.cl',
    activo: true,
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  };

  it('loads customers and filters by search and status', () => {
    const service = jasmine.createSpyObj<CustomerService>('CustomerService', ['findAll']);
    service.findAll.and.returnValue(of([customer, { ...customer, id: 5, razonSocial: 'Otro', activo: false }]));
    const component = new CustomersList({} as Router, service);

    component.ngOnInit();
    component.filters = { search: 'cliente', status: 'true' };
    component.search();

    expect(component.filteredCustomers.map((item) => item.id)).toEqual([4]);
    expect(component.activeCustomers).toBe(1);
  });

  it('calculates customer metrics from creation and update dates', () => {
    const service = jasmine.createSpyObj<CustomerService>('CustomerService', ['findAll']);
    const component = new CustomersList({} as Router, service);
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 12).toISOString();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 12).toISOString();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

    component.customers = [
      { ...customer, id: 1, createdAt: thisMonth, updatedAt: oneHourAgo, activo: true },
      { ...customer, id: 2, createdAt: previousMonth, updatedAt: twoDaysAgo, activo: false },
    ];

    expect(component.newCustomersThisMonth).toBe(1);
    expect(component.activeCustomers).toBe(1);
    expect(component.recentCustomerActivity).toBe(1);
  });

  it('reloads customers when the selected company changes', () => {
    const service = jasmine.createSpyObj<CustomerService>('CustomerService', ['findAll']);
    const companyChanged = new Subject<any>();
    const companyACustomers = new Subject<CustomerResponse[]>();
    const companyBCustomers = new Subject<CustomerResponse[]>();
    const tenantContext = {
      companyChanged$: companyChanged.asObservable(),
    } as TenantContextService;
    service.findAll.and.returnValues(companyACustomers, companyBCustomers);
    const component = new CustomersList({} as Router, service, tenantContext);

    component.ngOnInit();
    companyChanged.next({ id: 2 });
    companyBCustomers.next([{ ...customer, id: 2, razonSocial: 'Empresa B' }]);
    companyACustomers.next([{ ...customer, id: 1, razonSocial: 'Empresa A' }]);

    expect(service.findAll).toHaveBeenCalledTimes(2);
    expect(component.customers.map((item) => item.razonSocial)).toEqual(['Empresa B']);
    component.ngOnDestroy();
  });

  it('deletes customers after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const service = jasmine.createSpyObj<CustomerService>('CustomerService', ['delete']);
    service.delete.and.returnValue(of(void 0));
    const component = new CustomersList({} as Router, service);
    component.customers = [customer];
    component.filteredCustomers = [customer];

    component.deleteCustomer(customer);

    expect(service.delete).toHaveBeenCalledWith(4);
    expect(component.customers).toEqual([]);
  });

  it('saves a new customer and maps form fields to the backend request', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const service = jasmine.createSpyObj<CustomerService>('CustomerService', ['create']);
    service.create.and.returnValue(of(customer));
    const component = new CustomersForm({ snapshot: { paramMap: { get: () => null } } } as any, router, service);
    component.customer = {
      ...component.customer,
      rut: customer.rut,
      businessName: customer.razonSocial,
      shortName: customer.nombreFantasia,
      email: customer.email,
      contacts: { ...component.customer.contacts, receiver: { phone: '123', email: '', position: '' } },
    };
    const form = { invalid: false, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;

    component.saveCustomer(form);

    expect(service.create).toHaveBeenCalledWith(jasmine.objectContaining({
      rut: customer.rut,
      razonSocial: customer.razonSocial,
      telefono: '123',
    }));
    expect(router.navigate).toHaveBeenCalledWith(['/clientes']);
  });

  it('loads and updates customers in edit mode', () => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const service = jasmine.createSpyObj<CustomerService>('CustomerService', ['findById', 'update']);
    service.findById.and.returnValue(of(customer));
    service.update.and.returnValue(of(customer));
    const component = new CustomersForm({ snapshot: { paramMap: { get: () => '4' } } } as any, router, service);
    const form = { invalid: false, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;

    component.ngOnInit();
    component.saveCustomer(form);

    expect(component.isEditMode).toBeTrue();
    expect(component.customer.businessName).toBe(customer.razonSocial);
    expect(service.update).toHaveBeenCalledWith(4, jasmine.objectContaining({ rut: customer.rut }));
  });

  it('does not save invalid customer forms', () => {
    const service = jasmine.createSpyObj<CustomerService>('CustomerService', ['create']);
    const component = new CustomersForm({ snapshot: { paramMap: { get: () => null } } } as any, {} as Router, service);
    const form = { invalid: true, control: { markAllAsTouched: jasmine.createSpy('touch') } } as unknown as NgForm;

    component.saveCustomer(form);

    expect(form.control.markAllAsTouched).toHaveBeenCalled();
    expect(service.create).not.toHaveBeenCalled();
  });

  it('shows customer loading errors', () => {
    const service = jasmine.createSpyObj<CustomerService>('CustomerService', ['findAll']);
    service.findAll.and.returnValue(throwError(() => new Error('boom')));
    const component = new CustomersList({} as Router, service);

    component.loadCustomers();

    expect(component.error).toContain('clientes');
  });
});
