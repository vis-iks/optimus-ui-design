import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { ThemeModeService } from './theme-mode.service';

/**
 * Shared top bar for every page (marketplace, designer, admin).
 * Project page-specific actions into the default slot — they render just left
 * of the theme toggle.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="app-header">
      <a routerLink="/" class="ah-brand" aria-label="Optimus UI Design home">
        <img src="/favicon.svg" width="24" height="24" alt="" />
        <strong>OPTIMUS UI DESIGN</strong>
      </a>

      <nav class="ah-nav" aria-label="Primary">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
          >Marketplace</a
        >
        <a routerLink="/designer" routerLinkActive="active">Designer</a>
        @if (auth.isAdmin()) {
          <a routerLink="/admin" routerLinkActive="active">Reports</a>
        }
      </nav>

      <div class="ah-actions">
        <ng-content />

        <button
          type="button"
          class="ah-icon-btn"
          [attr.aria-label]="mode.isDark() ? 'Use light theme' : 'Use dark theme'"
          (click)="mode.toggle()"
        >
          <i class="pi" [class.pi-moon]="!mode.isDark()" [class.pi-sun]="mode.isDark()"></i>
        </button>

        @if (auth.isLoggedIn()) {
          <span class="ah-user">
            <img [src]="auth.currentUser()!.avatar_url" width="24" height="24" alt="" />
            <span class="ah-user-name">{{ auth.currentUser()!.github_login }}</span>
            <button type="button" class="ah-link" (click)="auth.logout()">Sign out</button>
          </span>
        } @else {
          <button type="button" class="ah-signin" (click)="auth.login()">
            <i class="pi" [class.pi-user]="localAuth" [class.pi-github]="!localAuth"></i>
            {{ localAuth ? 'Sign in locally' : 'Sign in with GitHub' }}
          </button>
        }
      </div>
    </header>
  `,
  styles: [
    `
      .app-header {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 0.6rem 1.5rem;
        border-bottom: 1px solid var(--p-content-border-color, #e5e7eb);
        background: var(--p-content-background, #fff);
        color: var(--p-text-color, #111827);
      }
      .ah-brand {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
        color: inherit;
        font-size: 0.8rem;
        letter-spacing: 0.05em;
        white-space: nowrap;
      }
      .ah-nav {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        font-size: 0.85rem;
      }
      .ah-nav a {
        color: var(--p-text-muted-color, #6b7280);
        text-decoration: none;
        padding: 0.25rem 0;
        border-bottom: 2px solid transparent;
      }
      .ah-nav a:hover {
        color: var(--p-text-color, #111827);
      }
      .ah-nav a.active {
        color: var(--p-text-color, #111827);
        border-bottom-color: var(--p-primary-color, #6366f1);
      }
      .ah-actions {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-left: auto;
      }
      .ah-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border: 1px solid var(--p-content-border-color, #e5e7eb);
        border-radius: 7px;
        background: transparent;
        color: var(--p-text-muted-color, #6b7280);
        cursor: pointer;
      }
      .ah-icon-btn:hover {
        color: var(--p-primary-color, #6366f1);
        border-color: var(--p-primary-color, #6366f1);
      }
      .ah-user {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.85rem;
      }
      .ah-user img {
        border-radius: 50%;
      }
      .ah-link {
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        font: inherit;
        color: var(--p-primary-color, #6366f1);
      }
      .ah-signin {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.4rem 0.8rem;
        border: 1px solid var(--p-content-border-color, #e5e7eb);
        border-radius: 7px;
        background: transparent;
        color: inherit;
        font: inherit;
        font-size: 0.85rem;
        cursor: pointer;
      }
      .ah-signin:hover {
        border-color: var(--p-primary-color, #6366f1);
        color: var(--p-primary-color, #6366f1);
      }
      @media (max-width: 640px) {
        .app-header {
          gap: 0.9rem;
          padding-inline: 1rem;
        }
        .ah-user-name {
          display: none;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  protected readonly localAuth = environment.localAuth;
  protected readonly auth = inject(AuthService);
  protected readonly mode = inject(ThemeModeService);
}
