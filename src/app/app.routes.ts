import { Routes } from '@angular/router';

import { adminGuard } from './features/auth/admin.guard';
import { authGuard } from './features/auth/auth.guard';
import { sessionGuard } from './features/session/session.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing-page.component').then((m) => m.LandingPageComponent),
  },
  {
    path: 'workspace',
    canActivate: [sessionGuard],
    data: { shellMode: 'workspace' },
    loadComponent: () => import('./layout/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'chat' },
      {
        path: 'chat',
        loadComponent: () =>
          import('./features/workspace/chat/chat-panel.component').then((m) => m.ChatPanelComponent),
      },
      {
        path: 'files',
        loadComponent: () =>
          import('./features/workspace/documents/document-list.component').then(
            (m) => m.DocumentListComponent,
          ),
      },
    ],
  },
  {
    // Separate from the anonymous demo above (/, /workspace): this is the real JWT+RBAC area,
    // added alongside the demo rather than replacing it.
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    data: { shellMode: 'portal' },
    loadComponent: () => import('./layout/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'chat' },
      {
        path: 'chat',
        loadComponent: () =>
          import('./features/portal/chat/portal-chat-panel.component').then(
            (m) => m.PortalChatPanelComponent,
          ),
      },
      {
        path: 'files',
        loadComponent: () =>
          import('./features/portal/documents/portal-document-list.component').then(
            (m) => m.PortalDocumentListComponent,
          ),
      },
      {
        // authGuard is already enforced by the parent 'app' route for every child, adminGuard
        // alone is enough here; a non-admin is redirected to '/app', which empty-path-redirects
        // to '/app/chat'.
        path: 'dashboard',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/dashboard/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
