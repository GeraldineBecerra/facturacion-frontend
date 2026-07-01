import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
    LucideAngularModule,
    LayoutGrid,
    Users,
    Building2,
    FileBarChart2,
    Package,
    LibraryBig,
    ShieldCheck,
    Files,
    ScrollText,
    Settings
} from 'lucide-angular';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    imports: [RouterModule, LucideAngularModule],
})
export class SidebarComponent {
    constructor(public auth: AuthService) {}

    @Input() collapsed = false;
    readonly LayoutGrid = LayoutGrid;
    readonly Users = Users;
    readonly Building2 = Building2;
    readonly FileBarChart2 = FileBarChart2;
    readonly Package = Package;
    readonly LibraryBig = LibraryBig;
    readonly ShieldCheck = ShieldCheck;
    readonly Files = Files;
    readonly ScrollText = ScrollText;
    readonly Settings = Settings;

    logout(): void {
        this.auth.logout();
    }
}
