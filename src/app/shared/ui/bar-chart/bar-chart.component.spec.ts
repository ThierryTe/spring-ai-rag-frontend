import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarChartComponent, BarChartDatum } from './bar-chart.component';

@Component({
  imports: [BarChartComponent],
  template: `<app-bar-chart [data]="data" />`,
})
class HostComponent {
  data: readonly BarChartDatum[] = [
    { label: 'Sujet sensible', value: 3 },
    { label: 'Hors périmètre', value: 9 },
  ];
}

describe('BarChartComponent', () => {
  it('renders one row per datum with a proportional bar width', () => {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.bar-chart__row');
    expect(rows.length).toBe(2);
    const fills = fixture.nativeElement.querySelectorAll('.bar-chart__fill') as NodeListOf<HTMLElement>;
    // Largest value (9) fills 100%; the other is scaled relative to it (3/9 ≈ 33%).
    expect(fills[1].style.width).toBe('100%');
    expect(fills[0].style.width).toBe('33%');
  });

  it('shows the empty message when there is no data', () => {
    const fixture: ComponentFixture<BarChartComponent> = TestBed.createComponent(BarChartComponent);
    fixture.componentRef.setInput('data', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.bar-chart__empty')).toBeTruthy();
  });
});
