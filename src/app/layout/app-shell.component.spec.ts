import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { CurrentUser } from '../core/models/auth.model';
import { SessionQuota } from '../core/models/session.model';
import { AuthStore } from '../core/state/auth.store';
import { SessionStore } from '../core/state/session.store';
import { AppShellComponent } from './app-shell.component';

function activatedRouteStub(shellMode: 'workspace' | 'portal') {
  return { snapshot: { data: { shellMode } } };
}

describe('AppShellComponent', () => {
  const quota: SessionQuota = { maxQuestions: 5, maxDocuments: 2, questionsUsed: 1, documentsUsed: 0 };

  function setupWorkspace(session: { expiresAt: Date; quota: SessionQuota } | null) {
    const sessionStoreStub = { session: () => session, quota: () => session?.quota ?? null };
    const authStoreStub = { currentUser: () => null, isAdmin: () => false, logout: () => {} };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteStub('workspace') },
        { provide: SessionStore, useValue: sessionStoreStub },
        { provide: AuthStore, useValue: authStoreStub },
      ],
    });

    const fixture: ComponentFixture<AppShellComponent> = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  function setupPortal(user: CurrentUser | null, isAdmin: boolean) {
    const sessionStoreStub = { session: () => null, quota: () => null };
    const authStoreStub = { currentUser: () => user, isAdmin: () => isAdmin, logout: () => {} };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteStub('portal') },
        { provide: SessionStore, useValue: sessionStoreStub },
        { provide: AuthStore, useValue: authStoreStub },
      ],
    });

    const fixture: ComponentFixture<AppShellComponent> = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('workspace mode: renders the quota badges from the session and the Fichiers/Chat menu', () => {
    const { element } = setupWorkspace({ expiresAt: new Date(), quota });
    const text = element.textContent ?? '';
    expect(text).toContain('1/5 questions');
    expect(text).toContain('0/2 documents');
    expect(text).toContain('Fichiers');
    expect(text).toContain('Chat');
    expect(text).not.toContain('Dashboard');
  });

  it('workspace mode: renders no quota badges when there is no session', () => {
    const { element } = setupWorkspace(null);
    expect(element.querySelector('.app-shell__quota')).toBeNull();
  });

  it('portal mode: omits the Dashboard menu item for a non-admin user', () => {
    const user: CurrentUser = {
      id: '1',
      email: 'a@b.com',
      fullName: 'Alice',
      roleCode: 'EMPLOYEE',
      allowedDepartments: [],
    };
    const { element } = setupPortal(user, false);
    expect(element.textContent ?? '').not.toContain('Dashboard');
  });

  it('portal mode: includes the Dashboard menu item for an admin user', () => {
    const user: CurrentUser = {
      id: '1',
      email: 'a@b.com',
      fullName: 'Alice',
      roleCode: 'ADMIN',
      allowedDepartments: [],
    };
    const { element } = setupPortal(user, true);
    expect(element.textContent ?? '').toContain('Dashboard');
  });
});
