import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { SessionStore } from '../../core/state/session.store';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { CardComponent } from '../../shared/ui/card/card.component';

@Component({
  selector: 'app-landing-page',
  imports: [ButtonComponent, CardComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent {
  private readonly router = inject(Router);
  protected readonly sessionStore = inject(SessionStore);

  startSession(): void {
    this.sessionStore.createSession().subscribe({
      next: () => this.router.navigate(['/workspace']),
      error: () => {},
    });
  }
}
