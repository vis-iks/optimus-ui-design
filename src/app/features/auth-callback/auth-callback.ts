import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="callback">
      @if (error()) {
        <p class="msg">Sign-in failed. <a routerLink="/">Back to the marketplace</a></p>
      } @else {
        <p class="msg">Signing you in…</p>
      }
    </div>
  `,
  styles: [
    `
      .callback {
        min-height: 60vh;
        display: grid;
        place-items: center;
      }
      .msg {
        font: 500 0.95rem var(--font-body, system-ui);
        color: var(--p-text-muted-color, #666);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCallback implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly error = signal(false);

  async ngOnInit(): Promise<void> {
    const params = new URLSearchParams(location.hash.replace(/^#/, ''));
    const token = params.get('token');
    const next = params.get('next');

    if (params.get('error') || !token) {
      this.error.set(true);
      return;
    }

    await this.auth.completeLogin(token);

    let target = '/';
    if (next) {
      try {
        const url = new URL(next);
        if (url.origin === location.origin) {
          target = url.pathname + url.search;
        }
      } catch {
        if (next.startsWith('/')) target = next;
      }
    }
    void this.router.navigateByUrl(target);
  }
}
