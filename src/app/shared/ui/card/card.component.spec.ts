import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardComponent } from './card.component';

@Component({
  imports: [CardComponent],
  template: `<app-card [padded]="padded">Contenu</app-card>`,
})
class HostComponent {
  padded = true;
}

describe('CardComponent', () => {
  it('projects its content and is padded by default', () => {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.card') as HTMLElement;
    expect(card.textContent?.trim()).toBe('Contenu');
    expect(card.className).toContain('card--padded');
  });

  it('omits padding when padded is false', () => {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    fixture.componentInstance.padded = false;
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('.card') as HTMLElement).className).not.toContain(
      'card--padded',
    );
  });
});
