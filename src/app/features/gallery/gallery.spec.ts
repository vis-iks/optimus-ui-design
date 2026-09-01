import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideOptimus } from '@openng/optimus-ui/config';
import Aura from '@openng/optimus-ui-themes/aura';

import { Gallery } from './gallery';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';
import { MarketplaceTheme } from '../../core/marketplace.models';

const API = environment.apiUrl.replace(/\/$/, '');

function theme(id: string, name: string): MarketplaceTheme {
  return {
    id,
    slug: name.toLowerCase(),
    name,
    description: null,
    base_preset: 'custom',
    preset: { primitive: { grey: { 500: '#6b7280' } } },
    config: { fontSize: '14px', fontFamily: 'Inter var' },
    author: { github_login: 'octocat', avatar_url: 'a.png' },
    parent_id: null,
    parent: null,
    fork_count: 0,
    report_count: 0,
    view_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe('Gallery', () => {
  let fixture: ComponentFixture<Gallery>;
  let el: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Gallery],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideOptimus({ theme: { preset: Aura } }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Gallery);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges(); // triggers ngOnInit -> load()
    el = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => http.verify());

  function flushList(items: MarketplaceTheme[], total = items.length) {
    http.expectOne((r) => r.url === `${API}/api/themes`).flush({
      items,
      total,
      limit: 24,
      offset: 0,
    });
    fixture.detectChanges();
  }

  it('loads and renders theme cards on init', () => {
    flushList([theme('a', 'Ocean'), theme('b', 'Sunset')]);
    expect(el.querySelectorAll('app-theme-card').length).toBe(2);
  });

  it('shows an empty state when there are no themes', () => {
    flushList([]);
    expect(el.querySelector('.state')?.textContent).toContain('No themes match');
  });

  it('shows a sign-in control when signed out', () => {
    flushList([]);
    const btn = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Sign in'),
    );
    expect(btn).toBeTruthy();
  });

  it('re-queries with the search term after debounce', async () => {
    flushList([theme('a', 'Ocean')]);

    const input = el.querySelector('input[type="text"]') as HTMLInputElement;
    input.value = 'sun';
    input.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 350));

    const req = http.expectOne((r) => r.url === `${API}/api/themes`);
    expect(req.request.params.get('search')).toBe('sun');
    req.flush({ items: [], total: 0, limit: 24, offset: 0 });
  });

  it('renders a retry affordance when the request fails', () => {
    http
      .expectOne((r) => r.url === `${API}/api/themes`)
      .flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(el.querySelector('.state')?.textContent).toContain('Could not reach the marketplace');
  });

  it('exposes the admin link only to admins', () => {
    flushList([]);
    expect(el.textContent).not.toContain('Reports');

    TestBed.inject(AuthService).setUser({
      id: 1,
      github_login: 'boss',
      avatar_url: 'a.png',
      is_admin: true,
    });
    fixture.detectChanges();
    expect(el.querySelector('a[href="/admin"]')).toBeTruthy();
  });
});
