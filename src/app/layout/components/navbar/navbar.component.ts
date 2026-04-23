import { Component, EventEmitter, Output } from '@angular/core';
import { LucideAngularModule, Bell, Menu, Search } from 'lucide-angular';

@Component({
    selector: 'app-navbar',
    standalone: true,
    templateUrl: './navbar.component.html',
    imports: [LucideAngularModule]
})
export class NavbarComponent {

    @Output() toggleSidebar = new EventEmitter<void>();
    readonly Menu = Menu;
    readonly Bell = Bell;
    readonly Search = Search;

}
