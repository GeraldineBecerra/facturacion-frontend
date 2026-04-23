import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { UserForm } from './features/user/user-form/user-form';

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
                path: 'users',
                loadComponent: () =>
                    import('./features/user/user-list/user-list')
                        .then(m => m.UserList)
            },
            {
                path: 'users/new',
                component: UserForm
            },

            {
                path: 'companies',
                loadComponent: () =>
                    import('./features/company/company-list/company-list')
                        .then(m => m.CompaniesList)
            },
            {
                path: 'companies/new',
                loadComponent: () =>
                    import('./features/company/company-form/company-form')
                        .then(m => m.CompanyForm)
            }

        ]
    }

];