import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SourceCitationDto } from '../../../core/models/chat.model';
import { SourceListComponent } from './source-list.component';

describe('SourceListComponent', () => {
  const sources: SourceCitationDto[] = [
    { referenceNumber: 1, documentTitle: 'Code du travail', filename: 'code.pdf', pageNumber: 42, sectionLabel: null, similarityScore: 0.89 },
    { referenceNumber: 2, documentTitle: 'Guide conformité', filename: 'guide.pdf', pageNumber: 18, sectionLabel: null, similarityScore: 0.84 },
  ];

  function setup(input: readonly SourceCitationDto[]) {
    const fixture: ComponentFixture<SourceListComponent> = TestBed.createComponent(SourceListComponent);
    fixture.componentRef.setInput('sources', input);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('renders nothing when there are no sources', () => {
    const { element } = setup([]);
    expect(element.querySelector('.source-list')).toBeNull();
  });

  it('shows a collapsed toggle with the source count, singular vs plural', () => {
    const { element } = setup([sources[0]]);
    expect(element.textContent).toContain('1 source utilisée');
    expect(element.querySelector('app-source-card')).toBeNull();
  });

  it('pluralizes and expands to show every source card on click', () => {
    const { fixture, element } = setup(sources);
    expect(element.textContent).toContain('2 sources utilisées');

    (element.querySelector('.source-list__toggle') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(element.querySelectorAll('app-source-card').length).toBe(2);
  });
});
