import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { UserForm } from './features/user/user-form/user-form';
import { BillingForm } from './features/billing/billing-form/billing-form';
import { BillingList } from './features/billing/billing-list/billing-list';
import { CustomersForm } from './features/customers/customers-form/customers-form';
import { CustomersList } from './features/customers/customers-list/customers-list';

export const routes: Routes = [

    {
        path: '',
        component: MainLayoutComponent,
        children: [

            // {
            //     path: 'dashboard',
            //     loadComponent: () =>
            //         import('./pages/dashboard/dashboard.component')
            //             .then(m => m.DashboardComponent)
            // },

            {
                path: 'usuarios',
                loadComponent: () =>
                    import('./features/user/user-list/user-list')
                        .then(m => m.UserList)
            },
            {
                path: 'usuarios/nuevo',
                component: UserForm
            },

            {
                path: 'empresas',
                loadComponent: () =>
                    import('./features/company/company-list/company-list')
                        .then(m => m.CompaniesList)
            },
            {
                path: 'empresas/nueva',
                loadComponent: () =>
                    import('./features/company/company-form/company-form')
                        .then(m => m.CompanyForm)
            },
            {
                path: 'facturacion',
                component: BillingList
            },
            {
                path: 'facturacion/nueva',
                component: BillingForm
            },
            {
                path: 'clientes',
                component: CustomersList
            },
            {
                path: 'clientes/nuevo',
                component: CustomersForm
            }

        ]
    }

];
