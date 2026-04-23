import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-page-header',
    standalone: true,
    templateUrl: './page-header.component.html'
})
export class PageHeaderComponent {

    @Input() headerTitle = '';
    @Input() subtitle = '';
    @Input() buttonLabel = '';

    @Output() buttonClick = new EventEmitter<void>();

}