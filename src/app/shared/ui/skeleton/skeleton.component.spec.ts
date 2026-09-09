import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  it('is decorative (aria-hidden) and defaults to a full-width, line-height block', () => {
    const fixture: ComponentFixture<SkeletonComponent> = TestBed.createComponent(SkeletonComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.skeleton') as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.style.width).toBe('100%');
    expect(el.style.height).toBe('1em');
  });

  it('applies the requested width and height', () => {
    const fixture: ComponentFixture<SkeletonComponent> = TestBed.createComponent(SkeletonComponent);
    fixture.componentRef.setInput('width', '24px');
    fixture.componentRef.setInput('height', '24px');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.skeleton') as HTMLElement;
    expect(el.style.width).toBe('24px');
    expect(el.style.height).toBe('24px');
  });
});
