import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

import { AuthStore } from '../core/state/auth.store';
import { SessionStore } from '../core/state/session.store';
import { BadgeComponent } from '../shared/ui/badge/badge.component';
import { ButtonComponent } from '../shared/ui/button/button.component';
import { SidebarMenuItem, SidebarNavComponent } from './sidebar-nav/sidebar-nav.component';

type ShellMode = 'workspace' | 'portal';

/** Shared layout for both the anonymous demo area (/workspace) and the authenticated portal
 *  (/app): sidebar menu + routed content. `shellMode` (route data) picks the header content and
 *  which store backs it — SessionStore/quota for workspace, AuthStore/identity for portal — the
 *  child routes themselves decide which document/chat components render, not this shell. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarNavComponent, BadgeComponent, ButtonComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly sessionStore = inject(SessionStore);
  protected readonly authStore = inject(AuthStore);

  protected readonly mode: ShellMode =
    (inject(ActivatedRoute).snapshot.data['shellMode'] as ShellMode | undefined) ?? 'workspace';

  protected readonly expiresAtLabel = computed(() => {
    const session = this.sessionStore.session();
    if (!session) return null;
    return session.expiresAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  });

  protected readonly menuItems = computed<readonly SidebarMenuItem[]>(() => {
    const basePath = this.mode === 'workspace' ? '/workspace' : '/app';
    const items: SidebarMenuItem[] = [
      { label: 'Fichiers', path: `${basePath}/files` },
      { label: 'Chat', path: `${basePath}/chat` },
    ];
    if (this.mode === 'portal' && this.authStore.isAdmin()) {
      items.push({ label: 'Dashboard', path: `${basePath}/dashboard` });
    }
    return items;
  });

  logout(): void {
    this.authStore.logout();
  }
}
