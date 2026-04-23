import { Component, input } from '@angular/core';
import { StatsCardComponent, StatTrend } from '../stats-card/stats-card.component';

export interface StatItem {
    label: string;
    value: string | number;
    description?: string;
    icon?: string;
    trend?: StatTrend;
}

@Component({
    selector: 'app-stats-grid',
    standalone: true,
    imports: [StatsCardComponent],
    templateUrl: './stats-grid.component.html'
})
export class StatsGridComponent {

    stats = input<StatItem[]>([]);
}