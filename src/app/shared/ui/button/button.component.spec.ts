import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonComponent } from './button.component';

@Component({
  imports: [ButtonComponent],
  template: `<app-button>Envoyer</app-button>`,
})
class HostComponent {}

describe('ButtonComponent', () => {
  function setup() {
    const fixture: ComponentFixture<ButtonComponent> = TestBed.createComponent(ButtonComponent);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('projects its content inside the native button', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').textContent.trim()).toBe('Envoyer');
  });

  it('applies the requested variant and size classes', () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    fixture.componentRef.setInput('variant', 'danger');
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.className).toContain('btn--danger');
    expect(button.className).toContain('btn--sm');
  });

  it('disables the inner native button, which also suppresses the click from bubbling', () => {
    const fixture = TestBed.createComponent(ButtonComponent);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    let clicked = false;
    fixture.nativeElement.addEventListener('click', () => (clicked = true));
    button.click();
    expect(clicked).toBe(false);
  });

  it('bubbles a click on the inner button up to the host element', () => {
    const { fixture, element } = setup();
    let clicked = false;
    element.addEventListener('click', () => (clicked = true));
    (element.querySelector('button') as HTMLButtonElement).click();
    expect(clicked).toBe(true);
  });

  it('defaults to type="button" so it never submits a form by accident', () => {
    const { element } = setup();
    expect((element.querySelector('button') as HTMLButtonElement).type).toBe('button');
  });
});
