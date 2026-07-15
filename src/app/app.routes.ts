import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { UserForm } from './features/user/pages/user-form/user-form';
import { UserList } from './features/user/pages/user-list/user-list';
import { CompanyForm } from './features/company/pages/company-form/company-form';
import { CompanySelector } from './features/company/pages/company-selector/company-selector';
import { CompaniesList } from './features/company/pages/company-list/company-list';
import { BillingForm } from './features/billing/pages/billing-form/billing-form';
import { BillingList } from './features/billing/pages/billing-list/billing-list';
import { CustomersForm } from './features/customers/pages/customers-form/customers-form';
import { CustomersList } from './features/customers/pages/customers-list/customers-list';
import { ProductList } from './features/product/pages/product-list/product-list';
import { ProductForm } from './features/product/pages/product-form/product-form';
import { RoleList } from './features/role/pages/role-list/role-list';
import { DocumentTypeList } from './features/document-type/pages/document-type-list/document-type-list';
import { AuditList } from './features/audit/pages/audit-list/audit-list';
import { Profile } from './features/profile/pages/profile/profile';
import { Login } from './features/login/login';
import { DashboardAdmin } from './features/dashboard/dashboard-admin';
import { DashboardSuperAdmin } from './features/dashboard/dashboard-super-admin';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    {
        path: 'login',
        component: Login
    },
    {
        path: 'seleccionar-empresa',
        component: CompanySelector,
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ROLE_SUPER_ADMIN'] }
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'dashboard/admin'
            },
            {
                path: 'dashboard/admin',
                component: DashboardAdmin,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_USER'] }
            },
            {
                path: 'dashboard/super-admin',
                component: DashboardSuperAdmin,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN'] }
            },
            {
                path: 'usuarios',
                component: UserList,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'] }
            },
            {
                path: 'usuarios/nuevo',
                component: UserForm,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'] }
            },
            {
                path: 'empresas',
                component: CompaniesList,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN'] }
            },
            {
                path: 'empresas/nueva',
                component: CompanyForm,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN'] }
            },
            {
                path: 'empresas/:id/editar',
                component: CompanyForm,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN'] }
            },
            {
                path: 'facturacion',
                component: BillingList,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_USER'] }
            },
            {
                path: 'facturacion/nueva',
                component: BillingForm,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_USER'] }
            },
            {
                path: 'clientes',
                component: CustomersList,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'] }
            },
            {
                path: 'clientes/nuevo',
                component: CustomersForm,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'] }
            },
            {
                path: 'clientes/:id/editar',
                component: CustomersForm,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'] }
            },
            {
                path: 'productos',
                component: ProductList,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN'] }
            },
            {
                path: 'productos/nuevo',
                component: ProductForm,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN'] }
            },
            {
                path: 'productos/:id/editar',
                component: ProductForm,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN'] }
            },
            {
                path: 'folios',
                loadComponent: () => import('./features/folio/pages/folio-admin/folio-admin')
                    .then((m) => m.FolioAdmin),
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'] }
            },
            {
                path: 'roles',
                component: RoleList,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN'] }
            },
            {
                path: 'tipos-documento',
                component: DocumentTypeList,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN'] }
            },
            {
                path: 'auditoria',
                component: AuditList,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN'] }
            },
            {
                path: 'perfil',
                component: Profile,
                canActivate: [roleGuard],
                data: { roles: ['ROLE_SUPER_ADMIN', 'ROLE_ADMIN'] }
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }

];
