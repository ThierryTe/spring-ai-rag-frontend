import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { Router } from '@angular/router';

import { AuthStore } from '../../core/state/auth.store';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { CardComponent } from '../../shared/ui/card/card.component';

@Component({
  selector: 'app-login-page',
  imports: [ButtonComponent, CardComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly router = inject(Router);
  protected readonly authStore = inject(AuthStore);

  private readonly emailInput = viewChild.required<ElementRef<HTMLInputElement>>('email');
  private readonly passwordInput = viewChild.required<ElementRef<HTMLInputElement>>('password');

  submit(): void {
    const email = this.emailInput().nativeElement.value.trim();
    const password = this.passwordInput().nativeElement.value;
    if (!email || !password || this.authStore.isAuthenticating()) return;

    this.authStore.login(email, password).subscribe({
      next: () => this.router.navigate(['/app']),
      error: () => {},
    });
  }
}
