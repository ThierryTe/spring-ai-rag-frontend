import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface BarChartDatum {
  readonly label: string;
  readonly value: number;
}


@Component({
  selector: 'app-bar-chart',
  imports: [],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent {
  readonly data = input.required<readonly BarChartDatum[]>();
  readonly emptyMessage = input('Aucune donnée pour cette période.');

  protected readonly maxValue = computed(() => Math.max(1, ...this.data().map((d) => d.value)));

  protected widthPercent(value: number): number {
    return Math.round((value / this.maxValue()) * 100);
  }
}
