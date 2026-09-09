import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeComponent } from './badge.component';

@Component({
  imports: [BadgeComponent],
  template: `<app-badge tone="danger">Échec</app-badge>`,
})
class HostComponent {}

describe('BadgeComponent', () => {
  it('projects its content and applies the tone class', () => {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.badge') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('Échec');
    expect(badge.className).toContain('badge--danger');
  });

  it('defaults to the neutral tone', () => {
    const fixture: ComponentFixture<BadgeComponent> = TestBed.createComponent(BadgeComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('.badge') as HTMLElement).className).toContain(
      'badge--neutral',
    );
  });
});
