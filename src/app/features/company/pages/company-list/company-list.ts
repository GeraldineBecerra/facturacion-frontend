import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
    DynamicTableComponent,
    TableColumn,
} from '../../../../shared/components/table/table';
import { PageHeaderComponent } from '../../../../shared/components/header/page-header.component';

@Component({
    selector: 'app-companies',
    standalone: true,
    imports: [DynamicTableComponent, PageHeaderComponent],
    templateUrl: './company-list.html'
})
export class CompaniesList {

    constructor(private router: Router) {}

    columns: TableColumn[] = [
        { key: 'id', label: 'ID' },
        { key: 'rut', label: 'RUT' },
        { key: 'name', label: 'Razón Social' },
        { key: 'giro', label: 'Giro' },
        {
            key: 'status',
            label: 'Estado',
            type: 'badge',
            badgeColors: {
                Active: 'bg-emerald-100 text-emerald-800',
                Verified: 'bg-blue-100 text-blue-800',
            },
        },
    ];

    data = [
        {
            id: 'VL-7821',
            rut: '76.334.890-K',
            name: 'Global Logistics',
            giro: 'Transporte',
            status: 'Active'
        },
        {
            id: 'VL-9012',
            rut: '77.102.445-5',
            name: 'Innovatech',
            giro: 'Ingeniería',
            status: 'Verified'
        }
    ];
    
    createCompany() {
        this.router.navigate(['/empresas/nueva']);
    }
}
