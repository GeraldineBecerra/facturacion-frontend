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
  region: string;
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
  rutError: string | null = null;
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
    region: '',
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

  downloadTemplate(): void {
    const headers = ['rut', 'razonSocial', 'nombreFantasia', 'giro', 'direccion', 'ciudad', 'comuna', 'region', 'pais', 'telefono', 'email'];
    const example = ['12.345.678-5', 'Empresa Ejemplo SpA', 'Empresa Ejemplo', 'Servicios informáticos', 'Av. Providencia 1234', 'Santiago', 'Providencia', 'Metropolitana', 'Chile', '+56 9 1234 5678', 'contacto@empresa.cl'];
    const csv = `\uFEFF${headers.join(';')}\r\n${example.map((value) => this.escapeCsv(value)).join(';')}\r\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-nuevo-cliente.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  async uploadTemplate(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.error = null;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.error = 'La planilla debe ser un archivo CSV.';
      return;
    }
    try {
      this.applyRequest(this.parseCustomerCsv(await file.text()));
      this.validateRut();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No fue posible leer la planilla.';
    }
  }

  parseCustomerCsv(content: string): CustomerRequest {
    const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) throw new Error('La planilla no contiene datos de un cliente.');
    if (lines.length > 2) throw new Error('La planilla debe contener un solo cliente.');
    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = this.parseCsvLine(lines[0], delimiter).map((value) => value.trim());
    const values = this.parseCsvLine(lines[1], delimiter).map((value) => value.trim());
    const required = ['rut', 'razonSocial', 'nombreFantasia', 'giro', 'direccion', 'ciudad', 'comuna', 'region', 'pais', 'telefono', 'email'];
    const missing = required.filter((header) => !headers.includes(header));
    if (missing.length) throw new Error(`Faltan columnas en la planilla: ${missing.join(', ')}.`);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    if (!row['rut'] || !row['razonSocial']) throw new Error('Los campos rut y razonSocial son obligatorios.');
    if (row['email'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['email'])) throw new Error('El correo electrónico de la planilla no es válido.');
    return {
      rut: row['rut'], razonSocial: row['razonSocial'], nombreFantasia: row['nombreFantasia'], giro: row['giro'],
      direccion: row['direccion'], ciudad: row['ciudad'], comuna: row['comuna'], region: row['region'],
      pais: row['pais'], telefono: row['telefono'], email: row['email'],
    };
  }

  validateRut(): void {
    const rut = this.customer.rut.trim();
    if (!rut) {
      this.rutError = 'El RUT es obligatorio.';
      return;
    }
    this.rutError = this.isValidRut(rut)
      ? null
      : 'El RUT no es válido. Revisa el formato y el dígito verificador.';
  }

  isValidRut(rut: string): boolean {
    const cleanRut = rut.replace(/[.\-\s]/g, '').toUpperCase();
    if (!/^\d{1,8}[0-9K]$/.test(cleanRut)) return false;
    const body = cleanRut.slice(0, -1);
    const suppliedVerifier = cleanRut.slice(-1);
    let sum = 0;
    let multiplier = 2;
    for (let index = body.length - 1; index >= 0; index--) {
      sum += Number(body[index]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const result = 11 - (sum % 11);
    const expectedVerifier = result === 11 ? '0' : result === 10 ? 'K' : String(result);
    return suppliedVerifier === expectedVerifier;
  }

  saveCustomer(form: NgForm): void {
    this.validateRut();
    if (form.invalid || this.rutError || this.isSaving) {
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
      region: this.customer.region,
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
      region: customer.region ?? '',
      email: customer.email,
      businessActivity: customer.giro ?? '',
      contacts: {
        ...this.customer.contacts,
        receiver: { ...this.customer.contacts.receiver, phone: customer.telefono ?? '' },
      },
    };
  }

  private applyRequest(customer: CustomerRequest): void {
    this.customer = {
      ...this.customer,
      rut: customer.rut, businessName: customer.razonSocial, shortName: customer.nombreFantasia ?? '',
      businessActivity: customer.giro ?? '', address: customer.direccion ?? '', city: customer.ciudad ?? '',
      district: customer.comuna ?? '', region: customer.region ?? '', country: customer.pais || 'Chile', email: customer.email ?? '',
      contacts: { ...this.customer.contacts, receiver: { ...this.customer.contacts.receiver, phone: customer.telefono ?? '' } },
    };
  }

  private parseCsvLine(line: string, delimiter: string): string[] {
    const values: string[] = [];
    let value = '';
    let quoted = false;
    for (let index = 0; index < line.length; index++) {
      const character = line[index];
      if (character === '"') {
        if (quoted && line[index + 1] === '"') { value += '"'; index++; }
        else quoted = !quoted;
      } else if (character === delimiter && !quoted) { values.push(value); value = ''; }
      else value += character;
    }
    if (quoted) throw new Error('La planilla contiene comillas sin cerrar.');
    values.push(value);
    return values;
  }

  private escapeCsv(value: string): string {
    return /[;"\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }
}
