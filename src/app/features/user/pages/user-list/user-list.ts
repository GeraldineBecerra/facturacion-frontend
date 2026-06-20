import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../../shared/components/header/page-header.component';
import {
    DynamicTableComponent,
    TableAction,
    TableColumn,
} from '../../../../shared/components/table/table';
import { Router } from '@angular/router';

@Component({
    selector: 'app-user-management',
    standalone: true,
    imports: [
    PageHeaderComponent,
    DynamicTableComponent
],
    templateUrl: './user-list.html'
})
export class UserList {
    constructor(private router: Router) { }
    columns: TableColumn[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Rol' },
        {
            key: 'status',
            label: 'Estado',
            type: 'badge',
            badgeColors: {
                Active: 'bg-emerald-100 text-emerald-800',
                Suspended: 'bg-amber-100 text-amber-800',
            },
        },
    ];

    actions: TableAction[] = [
        {
            type: 'custom',
            label: 'Editar',
            icon: 'edit',
            clickFn: (user) => this.editUser(user),
            colorClass: 'text-blue-600 hover:bg-blue-50',
        },
        {
            type: 'delete',
            label: 'Eliminar',
            clickFn: (user) => this.deleteUser(user),
        },
    ];
    users = [
        {
            name: 'Adrian Holovaty',
            email: 'adrian.h@cobalt.enterprise',
            role: 'Administrator',
            status: 'Active'
        },
        {
            name: 'Beatriz Soler',
            email: 'beatriz.s@cobalt.enterprise',
            role: 'Developer',
            status: 'Active'
        },
        {
            name: "Carlos D'Alessio",
            email: 'carlos.d@cobalt.enterprise',
            role: 'Security Auditor',
            status: 'Suspended'
        },
        {
            name: 'Elena Llopis',
            email: 'elena.l@cobalt.enterprise',
            role: 'Analyst',
            status: 'Active'
        },
        {
            name: 'Adrian Holovaty',
            email: 'adrian.h@cobalt.enterprise',
            role: 'Administrator',
            status: 'Active'
        },
        {
            name: 'Beatriz Soler',
            email: 'beatriz.s@cobalt.enterprise',
            role: 'Developer',
            status: 'Active'
        },
        {
            name: "Carlos D'Alessio",
            email: 'carlos.d@cobalt.enterprise',
            role: 'Security Auditor',
            status: 'Suspended'
        },
        {
            name: 'Elena Llopis',
            email: 'elena.l@cobalt.enterprise',
            role: 'Analyst',
            status: 'Active'
        },
        {
            name: 'Adrian Holovaty',
            email: 'adrian.h@cobalt.enterprise',
            role: 'Administrator',
            status: 'Active'
        },
        {
            name: 'Beatriz Soler',
            email: 'beatriz.s@cobalt.enterprise',
            role: 'Developer',
            status: 'Active'
        },
        {
            name: "Carlos D'Alessio",
            email: 'carlos.d@cobalt.enterprise',
            role: 'Security Auditor',
            status: 'Suspended'
        },
        {
            name: 'Elena Llopis',
            email: 'elena.l@cobalt.enterprise',
            role: 'Analyst',
            status: 'Active'
        }
    ];

    createUser() {
        this.router.navigate(['/usuarios/nuevo']);
    }


    editUser(user: any) {
        console.log('Editar usuario', user);
    }

    deleteUser(user: any) {
        console.log('Eliminar usuario', user);
    }

}
