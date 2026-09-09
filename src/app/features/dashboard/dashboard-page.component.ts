import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { DashboardStore } from '../../core/state/dashboard.store';
import { formatDayLabel, refusalReasonLabel } from '../../core/models/observability.model';
import { BarChartComponent, BarChartDatum } from '../../shared/ui/bar-chart/bar-chart.component';
import { CardComponent } from '../../shared/ui/card/card.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/ui/loading-state/loading-state.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [CardComponent, BarChartComponent, LoadingStateComponent, ErrorStateComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  protected readonly dashboardStore = inject(DashboardStore);

  protected readonly refusalRateLabel = computed(() => {
    const summary = this.dashboardStore.summaryResource.value();
    if (!summary || summary.totalQueries === 0) return '—';
    return `${Math.round((summary.refusedQueries / summary.totalQueries) * 100)}%`;
  });

  protected readonly avgLatencyLabel = computed(() => {
    const avg = this.dashboardStore.summaryResource.value()?.avgLatencyMs;
    return avg != null ? `${Math.round(avg)} ms` : '—';
  });

  protected readonly costLabel = computed(() => {
    const summary = this.dashboardStore.summaryResource.value();
    if (!summary) return '—';
    return `$${summary.totalEstimatedCostUsd.toFixed(4)}`;
  });

  protected readonly refusalChartData = computed<readonly BarChartDatum[]>(() => {
    const breakdown = this.dashboardStore.summaryResource.value()?.refusalBreakdown ?? [];
    return breakdown.map((r) => ({ label: refusalReasonLabel(r.reason), value: r.count }));
  });

  protected readonly volumeChartData = computed<readonly BarChartDatum[]>(() => {
    const daily = this.dashboardStore.summaryResource.value()?.dailyVolume ?? [];
    return daily.map((d) => ({ label: formatDayLabel(d.day), value: d.count }));
  });

  retryLoad(): void {
    this.dashboardStore.reload();
  }
}
