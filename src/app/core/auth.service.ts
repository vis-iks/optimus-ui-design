import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, firstValueFrom, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { MarketplaceUser } from './marketplace.models';

const TOKEN_KEY = 'ts_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl.replace(/\/$/, '');

  private readonly _user = signal<MarketplaceUser | null>(null);
  private readonly _ready = signal(false);

  readonly currentUser = this._user.asReadonly();
  readonly ready = this._ready.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.is_admin === true);

  get token(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable — session lasts for this page load only */
    }
  }

  /** Start GitHub OAuth in production, or obtain a development-only local session. */
  async login(returnUrl: string = location.pathname + location.search): Promise<void> {
    if (environment.localAuth) {
      const session = await firstValueFrom(
        this.http.post<{ token: string }>(`${this.api}/api/auth/dev-login`, {}),
      );
      await this.completeLogin(session.token);
      return;
    }
    const redirect = encodeURIComponent(location.origin + returnUrl);
    location.href = `${this.api}/api/auth/github/login?redirect=${redirect}`;
  }

  logout(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    this.setUser(null);
    void firstValueFrom(this.http.post(`${this.api}/api/auth/logout`, {}).pipe(catchError(() => of(null))));
  }

  /** Set the known user and mark auth resolved. */
  setUser(user: MarketplaceUser | null): void {
    this._user.set(user);
    this._ready.set(true);
  }

  /** Load the current user from a stored token. Safe to call when signed out. */
  async loadMe(): Promise<void> {
    const token = this.token;
    if (!token) {
      this.setUser(null);
      return;
    }
    const user = await firstValueFrom(
      this.http.get<MarketplaceUser>(`${this.api}/api/auth/me`, { headers: this.authHeader() }).pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 401) {
            this.logout();
          }
          return of(null);
        }),
      ),
    );
    this.setUser(user);
  }

  /** Store a token returned by the OAuth callback and refresh the user. */
  async completeLogin(token: string): Promise<void> {
    this.setToken(token);
    await this.loadMe();
  }

  /** Used by the interceptor. */
  authHeader(): Record<string, string> {
    const token = this.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
