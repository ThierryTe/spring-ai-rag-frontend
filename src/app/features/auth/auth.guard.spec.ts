import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthStore } from '../../core/state/auth.store';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  function setup(isAuthenticated: boolean) {
    const authStoreStub = { isAuthenticated: () => isAuthenticated };
    const createUrlTree = vi.fn(() => 'redirect-tree' as unknown as ReturnType<Router['createUrlTree']>);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: authStoreStub },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });
    return { createUrlTree };
  }

  it('allows navigation when a token is present', () => {
    setup(true);
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('redirects to /login when there is no token', () => {
    const { createUrlTree } = setup(false);
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe('redirect-tree');
    expect(createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
