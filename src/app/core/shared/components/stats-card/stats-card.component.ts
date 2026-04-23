import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

export type StatTrend = 'up' | 'down' | 'neutral';

@Component({
    selector: 'app-stats-card',
    standalone: true,
    templateUrl: './stats-card.component.html',
    imports: [CommonModule]
})
export class StatsCardComponent {

    label = input<string>();
    value = input<string | number>();
    description = input<string>();

    icon = input<string | null | undefined>(null);
    trend = input<StatTrend | undefined>('neutral');
}