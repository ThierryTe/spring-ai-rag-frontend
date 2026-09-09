import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentStatus } from '../../../core/models/document.model';
import { DocumentStatusBadgeComponent } from './document-status-badge.component';

describe('DocumentStatusBadgeComponent', () => {
  function setup(status: DocumentStatus) {
    const fixture: ComponentFixture<DocumentStatusBadgeComponent> = TestBed.createComponent(
      DocumentStatusBadgeComponent,
    );
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it.each([
    ['UPLOADED', 'En attente'],
    ['PROCESSING', 'Traitement…'],
    ['INDEXED', 'Indexé'],
    ['FAILED', 'Échec'],
  ] as const)('renders the French label for %s', (status, label) => {
    expect(setup(status).textContent?.trim()).toBe(label);
  });
});
