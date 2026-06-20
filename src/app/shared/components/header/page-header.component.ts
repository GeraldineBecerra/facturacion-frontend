import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UiButtonComponent } from '../../ui/ui-button/ui-button.component';

@Component({
    selector: 'app-page-header',
    standalone: true,
    imports: [UiButtonComponent],
    templateUrl: './page-header.component.html'
})
export class PageHeaderComponent {

    @Input() headerTitle = '';
    @Input() subtitle = '';
    @Input() buttonLabel = '';

    @Output() buttonClick = new EventEmitter<void>();

}
