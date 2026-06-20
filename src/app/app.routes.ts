import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { UserForm } from './features/user/pages/user-form/user-form';
import { UserList } from './features/user/pages/user-list/user-list';
import { CompanyForm } from './features/company/pages/company-form/company-form';
import { CompaniesList } from './features/company/pages/company-list/company-list';
import { BillingForm } from './features/billing/pages/billing-form/billing-form';
import { BillingList } from './features/billing/pages/billing-list/billing-list';
import { CustomersForm } from './features/customers/pages/customers-form/customers-form';
import { CustomersList } from './features/customers/pages/customers-list/customers-list';

export const routes: Routes = [

    {
        path: '',
        component: MainLayoutComponent,
        children: [

            {
                path: 'usuarios',
                component: UserList
            },
            {
                path: 'usuarios/nuevo',
                component: UserForm
            },

            {
                path: 'empresas',
                component: CompaniesList
            },
            {
                path: 'empresas/nueva',
                component: CompanyForm
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
