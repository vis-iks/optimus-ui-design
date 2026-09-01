import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideOptimus } from '@openng/optimus-ui/config';
import Aura from '@openng/optimus-ui-themes/aura';
import { of } from 'rxjs';

import { ThemeDetail } from './theme-detail';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl.replace(/\/$/, '');

function summary(id: string, name: string, parent_id: string | null, fork_count = 0) {
  return {
    id,
    slug: name.toLowerCase(),
    name,
    base_preset: 'custom',
    author: { github_login: 'octocat', avatar_url: 'a.png' },
    parent_id,
    fork_count,
    created_at: `2026-0${id.length}-01T00:00:00Z`,
  };
}

describe('ThemeDetail', () => {
  let fixture: ComponentFixture<ThemeDetail>;
  let http: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ThemeDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideOptimus({ theme: { preset: Aura } }),
        { provide: ActivatedRoute, useValue: { paramMap: of({ get: () => 'child' }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeDetail);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => http.verify());

  function respond() {
    http.expectOne(`${API}/api/themes/child`).flush({
      id: 'child',
      slug: 'child',
      name: 'Child',
      description: 'a fork',
      base_preset: 'Aura',
      preset: { primitive: { blue: { 500: '#3b82f6' } } },
      config: { fontSize: '14px', fontFamily: 'Inter var' },
      author: { github_login: 'octocat', avatar_url: 'a.png' },
      parent_id: 'root',
      parent: summary('root', 'Root', null, 1),
      report_count: 0,
      view_count: 9,
      fork_count: 0,
      created_at: '2026-05-01T00:00:00Z',
      updated_at: '2026-05-01T00:00:00Z',
    });
    http.expectOne(`${API}/api/themes/child/family`).flush({
      root_id: 'root',
      focus_id: 'child',
      nodes: [summary('root', 'Root', null, 1), summary('child', 'Child', 'root')],
    });
    fixture.detectChanges();
  }

  it('renders the theme header once loaded', () => {
    respond();
    expect(el.querySelector('h1')?.textContent).toContain('Child');
    expect(el.textContent).toContain('forked from Root');
    const forkBtn = el.querySelector('a.btn--primary') as HTMLAnchorElement;
    expect(forkBtn.getAttribute('href')).toBe('/designer?themeId=child');
  });

  it('renders the lineage tree from root to focus, marking the current theme', () => {
    respond();
    const rows = el.querySelectorAll('.tree li');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Root');
    expect(rows[1].textContent).toContain('Child');
    expect(rows[1].classList.contains('is-focus')).toBe(true);
    expect(rows[1].textContent).toContain('this theme');
    // child is indented one level deeper than root
    expect((rows[1] as HTMLElement).style.getPropertyValue('--depth')).toBe('1');
  });
});
