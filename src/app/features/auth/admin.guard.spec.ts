import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthStore } from '../../core/state/auth.store';
import { adminGuard } from './admin.guard';

describe('adminGuard', () => {
  function setup(isAdmin: boolean) {
    const authStoreStub = { isAdmin: () => isAdmin };
    const createUrlTree = vi.fn(() => 'redirect-tree' as unknown as ReturnType<Router['createUrlTree']>);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: authStoreStub },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });
    return { createUrlTree };
  }

  it('allows navigation for an ADMIN user', () => {
    setup(true);
    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('redirects to /app for a non-ADMIN user', () => {
    const { createUrlTree } = setup(false);
    const result = TestBed.runInInjectionContext(() => adminGuard({} as never, {} as never));
    expect(result).toBe('redirect-tree');
    expect(createUrlTree).toHaveBeenCalledWith(['/app']);
  });
});
