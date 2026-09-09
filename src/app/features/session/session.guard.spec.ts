import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { SessionStore } from '../../core/state/session.store';
import { sessionGuard } from './session.guard';

describe('sessionGuard', () => {
  function setup(hasSession: boolean, isExpired: boolean) {
    const sessionStoreStub = { hasSession: () => hasSession, isExpiredNow: () => isExpired };
    const createUrlTree = vi.fn(() => 'redirect-tree' as unknown as ReturnType<Router['createUrlTree']>);
    TestBed.configureTestingModule({
      providers: [
        { provide: SessionStore, useValue: sessionStoreStub },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });
    return { createUrlTree };
  }

  it('allows navigation when a valid session exists', () => {
    setup(true, false);
    const result = TestBed.runInInjectionContext(() =>
      sessionGuard({} as never, {} as never),
    );
    expect(result).toBe(true);
  });

  it('redirects to "/" when there is no session', () => {
    const { createUrlTree } = setup(false, false);
    const result = TestBed.runInInjectionContext(() => sessionGuard({} as never, {} as never));
    expect(result).toBe('redirect-tree');
    expect(createUrlTree).toHaveBeenCalledWith(['/']);
  });

  it('redirects to "/" when the session is expired', () => {
    const { createUrlTree } = setup(true, true);
    const result = TestBed.runInInjectionContext(() => sessionGuard({} as never, {} as never));
    expect(result).toBe('redirect-tree');
    expect(createUrlTree).toHaveBeenCalledWith(['/']);
  });
});
