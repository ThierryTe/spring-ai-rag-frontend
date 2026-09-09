import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStore } from '../../core/state/auth.store';


export const adminGuard: CanActivateFn = () => {
  if (inject(AuthStore).isAdmin()) {
    return true;
  }
  return inject(Router).createUrlTree(['/app']);
};
