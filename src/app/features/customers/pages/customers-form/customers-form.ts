import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PageHeaderComponent } from '../../../../shared/components/header/page-header.component';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button.component';
import { UiCheckboxComponent } from '../../../../shared/ui/ui-checkbox/ui-checkbox.component';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input.component';
import { CustomerRequest, CustomerResponse } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';

type ContactKey = 'comex' | 'accounting' | 'receiver';

interface CustomerContact {
  phone: string;
  email: string;
  position: string;
}

interface CustomerFormModel {
  agent: boolean;
  blocked: boolean;
  foreign: boolean;
  rut: string;
  businessName: string;
  shortName: string;
  type: string;
  country: string;
  address: string;
  district: string;
  city: string;
  email: string;
  businessActivity: string;
  internalNote: string;
  internalCode: string;
  contacts: Record<ContactKey, CustomerContact>;
  collections: {
    main: string;
    optionalOne: string;
    optionalTwo: string;
  };
}

@Component({
  selector: 'app-customers-form',
  standalone: true,
  imports: [
    FormsModule,
    PageHeaderComponent,
    UiButtonComponent,
    UiCheckboxComponent,
    UiInputComponent,
  ],
  templateUrl: './customers-form.html',
  styleUrl: './customers-form.scss',
})
export class CustomersForm implements OnInit {
  customerId: number | null = null;
  isLoading = false;
  isSaving = false;
  error: string | null = null;
  readonly contactSections: { key: ContactKey; title: string }[] = [
    { key: 'comex', title: 'Comex en cliente' },
    { key: 'accounting', title: 'Contable en cliente' },
    { key: 'receiver', title: 'Receptor' },
  ];

  customer: CustomerFormModel = {
    agent: false,
    blocked: false,
    foreign: false,
    rut: '',
    businessName: '',
    shortName: '',
    type: 'Corporativo',
    country: 'Chile',
    address: '',
    district: '',
    city: '',
    email: '',
    businessActivity: '',
    internalNote: '',
    internalCode: '',
    contacts: {
      comex: { phone: '', email: '', position: '' },
      accounting: { phone: '', email: '', position: '' },
      receiver: { phone: '', email: '', position: '' },
    },
    collections: {
      main: '',
      optionalOne: '',
      optionalTwo: '',
    },
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
  ) {}

  get isEditMode(): boolean {
    return this.customerId !== null;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isInteger(id) && id > 0) {
      this.customerId = id;
      this.loadCustomer(id);
    }
  }

  cancel(): void {
    this.router.navigate(['/clientes']);
  }

  saveCustomer(form: NgForm): void {
    if (form.invalid || this.isSaving) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.error = null;
    const request = this.toRequest();
    const operation = this.customerId
      ? this.customerService.update(this.customerId, request)
      : this.customerService.create(request);

    operation.pipe(finalize(() => this.isSaving = false)).subscribe({
      next: () => this.router.navigate(['/clientes']),
      error: (error: HttpErrorResponse) => {
        this.error = error.error?.message ?? 'No fue posible guardar el cliente.';
      },
    });
  }

  private loadCustomer(id: number): void {
    this.isLoading = true;
    this.error = null;
    this.customerService.findById(id).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (customer) => this.applyCustomer(customer),
      error: () => this.error = 'No fue posible cargar el cliente.',
    });
  }

  private toRequest(): CustomerRequest {
    return {
      rut: this.customer.rut,
      razonSocial: this.customer.businessName,
      nombreFantasia: this.customer.shortName,
      giro: this.customer.businessActivity,
      direccion: this.customer.address,
      ciudad: this.customer.city,
      comuna: this.customer.district,
      region: '',
      pais: this.customer.country,
      telefono: this.customer.contacts.receiver.phone || this.customer.contacts.accounting.phone,
      email: this.customer.email,
    };
  }

  private applyCustomer(customer: CustomerResponse): void {
    this.customer = {
      ...this.customer,
      rut: customer.rut,
      businessName: customer.razonSocial,
      shortName: customer.nombreFantasia ?? '',
      country: customer.pais ?? 'Chile',
      address: customer.direccion ?? '',
      district: customer.comuna ?? '',
      city: customer.ciudad ?? '',
      email: customer.email,
      businessActivity: customer.giro ?? '',
      contacts: {
        ...this.customer.contacts,
        receiver: { ...this.customer.contacts.receiver, phone: customer.telefono ?? '' },
      },
    };
  }
}
