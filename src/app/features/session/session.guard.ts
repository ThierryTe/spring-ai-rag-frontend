import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionStore } from '../../core/state/session.store';


export const sessionGuard: CanActivateFn = () => {
  const sessionStore = inject(SessionStore);
  if (sessionStore.hasSession() && !sessionStore.isExpiredNow()) {
    return true;
  }
  return inject(Router).createUrlTree(['/']);
};
