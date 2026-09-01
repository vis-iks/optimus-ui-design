import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { MarketplaceService } from './marketplace.service';
import { environment } from '../../environments/environment';

const API = environment.apiUrl.replace(/\/$/, '');

describe('MarketplaceService', () => {
  let service: MarketplaceService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MarketplaceService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MarketplaceService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('builds the list query string from the filter object', () => {
    service
      .listThemes({ sort: 'popular', base: 'Aura', search: '  ocean ', limit: 24, offset: 48 })
      .subscribe();
    const req = http.expectOne(
      (r) => r.method === 'GET' && r.url === `${API}/api/themes`,
    );
    expect(req.request.params.get('sort')).toBe('popular');
    expect(req.request.params.get('base')).toBe('Aura');
    expect(req.request.params.get('search')).toBe('ocean');
    expect(req.request.params.get('limit')).toBe('24');
    expect(req.request.params.get('offset')).toBe('48');
    req.flush({ items: [], total: 0, limit: 24, offset: 48 });
  });

  it('omits the base param when set to "all"', () => {
    service.listThemes({ base: 'all' }).subscribe();
    const req = http.expectOne((r) => r.url === `${API}/api/themes`);
    expect(req.request.params.has('base')).toBe(false);
    req.flush({ items: [], total: 0, limit: 24, offset: 0 });
  });

  it('POSTs the payload to publish a theme', () => {
    const payload = {
      name: 'Ocean',
      base_preset: 'Aura' as const,
      preset: { primitive: {} },
      config: { fontSize: '14px', fontFamily: 'Inter var' },
    };
    let result: unknown;
    service.publishTheme(payload).subscribe((r) => (result = r));

    const req = http.expectOne(`${API}/api/themes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 'abc', slug: 'ocean', ...payload });
    expect((result as { id: string }).id).toBe('abc');
  });

  it('fetches a theme family for the lineage view', () => {
    let result: unknown;
    service.getFamily('abc').subscribe((r) => (result = r));
    const req = http.expectOne(`${API}/api/themes/abc/family`);
    expect(req.request.method).toBe('GET');
    req.flush({ root_id: 'r', focus_id: 'abc', nodes: [] });
    expect((result as { root_id: string }).root_id).toBe('r');
  });

  it('reports a theme with a reason and details', () => {
    service.reportTheme('abc', 'spam', 'looks like junk').subscribe();
    const req = http.expectOne(`${API}/api/themes/abc/report`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason: 'spam', details: 'looks like junk' });
    req.flush(null);
  });

  it('resolves a report via the admin endpoint', () => {
    service.resolveReport(7, 'hide').subscribe();
    const req = http.expectOne(`${API}/api/admin/reports/7/resolve`);
    expect(req.request.body).toEqual({ action: 'hide' });
    req.flush(null);
  });
});
