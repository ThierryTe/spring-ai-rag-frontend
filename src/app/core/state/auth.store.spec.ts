import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';

import { AppError } from '../models/api-error.model';
import { AuthMeDto, CurrentUser } from '../models/auth.model';
import { AuthApi } from '../services/auth.api';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  const meDto: AuthMeDto = {
    id: 'user-1',
    email: 'admin.demo@aicompliancecopilot.dev',
    fullName: 'Admin Demo',
    roleCode: 'ADMIN',
    allowedDepartments: [{ id: 1, code: 'RH', label: 'Ressources humaines' }],
  };

  /** Clears storage and configures the module, but does not instantiate AuthStore yet — lets a
   *  test seed localStorage in between, since AuthStore reads it synchronously at construction. */
  function configureModule(apiStub: Partial<AuthApi>) {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: AuthApi, useValue: apiStub }, provideRouter([])],
    });
  }

  function setup(apiStub: Partial<AuthApi>) {
    configureModule(apiStub);
    return TestBed.inject(AuthStore);
  }

  it('is not authenticated initially', () => {
    const store = setup({ me: () => NEVER });
    expect(store.isAuthenticated()).toBe(false);
    expect(store.currentUser()).toBeNull();
  });

  it('populates token and current user on successful login', () => {
    const store = setup({ login: () => of({ token: 'jwt-token' }), me: () => of(meDto) });

    store.login('admin.demo@aicompliancecopilot.dev', 'Demo1234!').subscribe();

    expect(store.isAuthenticated()).toBe(true);
    expect(store.token()).toBe('jwt-token');
    expect(store.currentUser()?.roleCode).toBe('ADMIN');
    expect(store.isAdmin()).toBe(true);
    expect(store.isAuthenticating()).toBe(false);
  });

  it('exposes the error and clears state on invalid credentials', () => {
    const appError: AppError = { kind: 'invalid_credentials', status: 401, message: 'Email ou mot de passe incorrect.' };
    const store = setup({
      login: () => throwError(() => appError),
      me: () => NEVER,
    });

    store.login('bad@example.com', 'wrong').subscribe({ error: () => {} });

    expect(store.isAuthenticated()).toBe(false);
    expect(store.isAuthenticating()).toBe(false);
    expect(store.error()).toEqual(appError);
  });

  it('restores token and current user synchronously from localStorage before /me resolves', () => {
    const cachedUser: CurrentUser = {
      id: 'user-1',
      email: 'admin.demo@aicompliancecopilot.dev',
      fullName: 'Admin Demo',
      roleCode: 'ADMIN',
      allowedDepartments: [],
    };
    // me() never emits: proves isAuthenticated/isAdmin come from the synchronous restore, not
    // from the background refresh — a hard refresh on a guarded route must not wait on the network.
    configureModule({ me: () => NEVER });
    localStorage.setItem(
      'ai-compliance-copilot.auth',
      JSON.stringify({ token: 'jwt-token', currentUser: cachedUser }),
    );

    const store = TestBed.inject(AuthStore);

    expect(store.isAuthenticated()).toBe(true);
    expect(store.isAdmin()).toBe(true);
    expect(store.currentUser()).toEqual(cachedUser);
  });

  it('logs out (clears state and redirects to /login) when the background refresh finds an invalid token', async () => {
    const appError: AppError = { kind: 'auth_expired', status: 401, message: 'expired' };
    configureModule({ me: () => throwError(() => appError) });
    localStorage.setItem(
      'ai-compliance-copilot.auth',
      JSON.stringify({
        token: 'stale-token',
        currentUser: { id: 'u', email: 'e', fullName: 'f', roleCode: 'EMPLOYEE', allowedDepartments: [] },
      }),
    );
    // The background refresh below calls logout() -> navigate(['/login']) as a side effect;
    // provideRouter([]) has no 'login' route to resolve it against.
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const store = TestBed.inject(AuthStore);
    // The refresh is deferred to a microtask (see AuthStore's constructor comment on why:
    // avoiding a circular-DI re-entrancy with authInterceptor's own inject(AuthStore)).
    await Promise.resolve();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.currentUser()).toBeNull();
  });

  it('logout clears state and navigates to /login', () => {
    const store = setup({ login: () => of({ token: 'jwt-token' }), me: () => of(meDto) });
    store.login('admin.demo@aicompliancecopilot.dev', 'Demo1234!').subscribe();
    // Mocked rather than a plain spy: provideRouter([]) has no 'login' route to resolve, so
    // letting the real navigate() run would reject with NG04002 (unhandled) after the test ends.
    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    store.logout();

    expect(store.isAuthenticated()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
