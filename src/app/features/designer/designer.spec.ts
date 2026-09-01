import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideOptimus } from '@openng/optimus-ui/config';
import Aura from '@openng/optimus-ui-themes/aura';

import { Designer } from './designer';
import { ThemeDesignerService } from './services/theme-designer.service';

describe('Designer', () => {
  let fixture: ComponentFixture<Designer>;
  let component: Designer;
  let el: HTMLElement;
  let service: ThemeDesignerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Designer],
      providers: [provideRouter([]), provideOptimus({ theme: { preset: Aura } })],
    }).compileComponents();

    service = TestBed.inject(ThemeDesignerService);

    fixture = TestBed.createComponent(Designer);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the shared app header with the Optimus UI Design brand', () => {
    const header = el.querySelector('app-header');
    expect(header).toBeTruthy();
    expect(header?.querySelector('.ah-brand')?.textContent).toContain('OPTIMUS UI DESIGN');
    expect(header?.querySelector<HTMLImageElement>('.ah-brand img')?.getAttribute('src')).toBe(
      '/favicon.svg',
    );
    expect(el.querySelector('.pi-prime')).toBeNull();
  });

  it('renders the theme mode toggle in the header', () => {
    const toggle = el.querySelector(
      'app-header button[aria-label="Use dark theme"], app-header button[aria-label="Use light theme"]',
    );
    expect(toggle).toBeTruthy();
  });

  it('shows no contextual theme-name bar in create view', () => {
    expect(el.querySelector('.designer-context')).toBeNull();
  });

  it('should show create-theme component in create view', () => {
    const createTheme = el.querySelector('design-create-theme');
    expect(createTheme).toBeTruthy();
  });

  it('should not show back button in create view', () => {
    const backBtn = el.querySelector('button .pi-chevron-left');
    expect(backBtn).toBeNull();
  });

  it('should show a labeled live component preview during create view', () => {
    const context = el.querySelector('.designer-preview-context');
    expect(context?.textContent).toContain('Live starter preview');
    expect(context?.textContent).toContain('Custom components');
    expect(el.querySelector('app-grid')).toBeTruthy();
  });

  it('should import theme from query param on init', async () => {
    // Use a full Aura preset clone so the editor can render without errors
    const clonedPreset = structuredClone(Aura);
    const payload = {
      name: 'URL Theme',
      preset: clonedPreset,
      config: { fontSize: '14px', fontFamily: 'Inter var' },
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));

    const { ActivatedRoute } = await import('@angular/router');
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Designer],
      providers: [
        provideRouter([]),
        provideOptimus({ theme: { preset: Aura } }),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: { get: (key: string) => (key === 'theme' ? encoded : null) },
            },
          },
        },
      ],
    }).compileComponents();

    const newService = TestBed.inject(ThemeDesignerService);
    const newFixture = TestBed.createComponent(Designer);
    newFixture.detectChanges();
    await newFixture.whenStable();
    // Wait for the async importThemeFromUrl → importTheme fallback chain
    await new Promise((r) => setTimeout(r, 50));

    expect(newService.designer().activeView).toBe('editor');
    expect(newService.designer().theme!.name).toBe('URL Theme');
  });
});

describe('Designer marketplace import', () => {
  it('loads a theme by ?themeId= from the marketplace API', async () => {
    const { ActivatedRoute } = await import('@angular/router');
    const { provideHttpClient } = await import('@angular/common/http');
    const { HttpTestingController, provideHttpClientTesting } = await import(
      '@angular/common/http/testing'
    );
    const { environment } = await import('../../../environments/environment');

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Designer],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideOptimus({ theme: { preset: Aura } }),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: { get: (key: string) => (key === 'themeId' ? 'abc123' : null) },
            },
          },
        },
      ],
    }).compileComponents();

    const service = TestBed.inject(ThemeDesignerService);
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(Designer);
    fixture.detectChanges();

    const api = environment.apiUrl.replace(/\/$/, '');
    http.expectOne(`${api}/api/themes/abc123`).flush({
      id: 'abc123',
      slug: 'ocean',
      name: 'Ocean',
      description: 'Cool blues',
      base_preset: 'Aura',
      preset: structuredClone(Aura),
      config: { fontSize: '14px', fontFamily: 'Inter var' },
      author: { github_login: 'octocat', avatar_url: 'a.png' },
      report_count: 0,
      view_count: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    await fixture.whenStable();

    expect(service.designer().activeView).toBe('editor');
    expect(service.designer().theme!.name).toBe('Ocean');
    // Opening a marketplace theme sets it as the fork parent.
    expect(service.designer().theme!.parentId).toBe('abc123');
    expect(service.designer().theme!.parentName).toBe('Ocean');
    expect(service.buildPublishPayload('Ocean fork')!.parent_id).toBe('abc123');
    http.verify();
  });
});
