import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
    LucideAngularModule,
    LayoutGrid,
    Users,
    Building2,
    FileBarChart2,
    Settings
} from 'lucide-angular';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    imports: [RouterModule, LucideAngularModule],
})
export class SidebarComponent {

    @Input() collapsed = false;
    readonly LayoutGrid = LayoutGrid;
    readonly Users = Users;
    readonly Building2 = Building2;
    readonly FileBarChart2 = FileBarChart2;
    readonly Settings = Settings;

}