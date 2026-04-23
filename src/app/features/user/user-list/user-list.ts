import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../core/shared/components/header/page-header.component';
import { DynamicTableComponent } from '../../../core/shared/components/table/table.component';
import { StatItem } from "../../../core/shared/components/stats-grid/stats-grid.component";
import { StatsCardComponent } from "../../../core/shared/components/stats-card/stats-card.component";
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
    columns = [
        { key: 'name', label: 'Nombre' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Rol' },
        { key: 'status', label: 'Estado' }
    ];
    stats: StatItem[] = [
        {
            label: 'Total Users',
            value: 1284,
            description: '+12% vs last month',
            icon: 'group',
            trend: 'up'
        },
        {
            label: 'Active Roles',
            value: 14,
            description: 'System architectures',
            icon: 'security',
            trend: 'neutral'
        },
        {
            label: 'Security Flags',
            value: 0,
            description: 'System stable',
            icon: 'check_circle',
            trend: 'up'
        },
        {
            label: 'Avg Response',
            value: '1.2s',
            description: 'Server latency',
            icon: 'speed',
            trend: 'neutral'
        }
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
        this.router.navigate(['/users/new']);
    }


    editUser(user: any) {
        console.log('Editar usuario', user);
    }

    deleteUser(user: any) {
        console.log('Eliminar usuario', user);
    }

}