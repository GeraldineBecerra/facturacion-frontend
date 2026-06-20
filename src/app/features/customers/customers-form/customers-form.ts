import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/components/header/page-header.component';
import { UiButtonComponent } from '../../../shared/ui/ui-button/ui-button.component';
import { UiCheckboxComponent } from '../../../shared/ui/ui-checkbox/ui-checkbox.component';
import { UiInputComponent } from '../../../shared/ui/ui-input/ui-input.component';

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
export class CustomersForm {
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

  constructor(private router: Router) {}

  cancel(): void {
    this.router.navigate(['/clientes']);
  }

  saveCustomer(): void {
    console.log('Cliente a guardar', structuredClone(this.customer));
    this.router.navigate(['/clientes']);
  }
}
