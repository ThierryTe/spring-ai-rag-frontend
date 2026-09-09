import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SidebarMenuItem, SidebarNavComponent } from './sidebar-nav.component';

@Component({
  template: '<app-sidebar-nav [items]="items" />',
  imports: [SidebarNavComponent],
})
class HostComponent {
  items: readonly SidebarMenuItem[] = [
    { label: 'Fichiers', path: '/workspace/files' },
    { label: 'Chat', path: '/workspace/chat' },
  ];
}

describe('SidebarNavComponent', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('renders one link per item with the correct href', () => {
    const { element } = setup();
    const links = Array.from(element.querySelectorAll('a.sidebar-nav__item'));
    expect(links.map((l) => l.textContent?.trim())).toEqual(['Fichiers', 'Chat']);
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/workspace/files', '/workspace/chat']);
  });
});
