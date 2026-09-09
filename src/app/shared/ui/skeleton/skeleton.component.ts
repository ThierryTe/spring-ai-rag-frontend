import { ChangeDetectionStrategy, Component, input } from '@angular/core';


@Component({
  selector: 'app-skeleton',
  imports: [],
  template: `
    <span class="skeleton" aria-hidden="true" [style.width]="width()" [style.height]="height()"></span>
  `,
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly width = input('100%');
  readonly height = input('1em');
}
