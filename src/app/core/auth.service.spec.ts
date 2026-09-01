import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

const API = environment.apiUrl.replace(/\/$/, '');

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reports signed-out state when there is no token', async () => {
    await service.loadMe();
    expect(service.isLoggedIn()).toBe(false);
    expect(service.ready()).toBe(true);
  });

  it('loads the current user when a token is present', async () => {
    service.setToken('jwt-123');
    const promise = service.loadMe();

    const req = http.expectOne(`${API}/api/auth/me`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-123');
    req.flush({ id: 1, github_login: 'octocat', avatar_url: 'a.png', is_admin: false });

    await promise;
    expect(service.currentUser()?.github_login).toBe('octocat');
    expect(service.isAdmin()).toBe(false);
  });

  it('clears the token when /me returns 401', async () => {
    service.setToken('expired');
    const promise = service.loadMe();
    http.expectOne(`${API}/api/auth/me`).flush('nope', { status: 401, statusText: 'Unauthorized' });
    // logout() also fires a best-effort POST
    http.expectOne(`${API}/api/auth/logout`).flush(null);

    await promise;
    expect(service.token).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('completeLogin stores the token and fetches the user', async () => {
    const promise = service.completeLogin('fresh-token');
    http
      .expectOne(`${API}/api/auth/me`)
      .flush({ id: 2, github_login: 'admin', avatar_url: 'b.png', is_admin: true });
    await promise;

    expect(service.token).toBe('fresh-token');
    expect(service.isAdmin()).toBe(true);
  });
});
