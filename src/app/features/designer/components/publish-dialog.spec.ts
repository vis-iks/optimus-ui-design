import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideOptimus } from '@openng/optimus-ui/config';
import Aura from '@openng/optimus-ui-themes/aura';

import { PublishDialog } from './publish-dialog';
import { AuthService } from '../../../core/auth.service';
import { environment } from '../../../../environments/environment';
import { ThemeDesignerService } from '../services/theme-designer.service';

const API = environment.apiUrl.replace(/\/$/, '');

describe('PublishDialog', () => {
  let fixture: ComponentFixture<PublishDialog>;
  let el: HTMLElement;
  let http: HttpTestingController;
  let designer: ThemeDesignerService;
  let auth: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PublishDialog],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideOptimus({ theme: { preset: Aura } }),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    designer = TestBed.inject(ThemeDesignerService);
    auth = TestBed.inject(AuthService);

    designer.designer.update((prev) => ({
      ...prev,
      theme: {
        name: 'Ocean',
        preset: { primitive: { blue: { 500: '#3b82f6' } } },
        config: { fontSize: '14px', fontFamily: 'Inter var' },
        base: 'Aura',
      },
    }));

    fixture = TestBed.createComponent(PublishDialog);
    el = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => http.verify());

  async function open() {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('prompts for GitHub sign-in when signed out', async () => {
    await open();
    const btn = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Sign in with GitHub'),
    );
    expect(btn).toBeTruthy();
    expect(el.querySelector('#pub-name')).toBeNull();
  });

  it('prefills the form from the active theme when signed in', async () => {
    auth.setUser({ id: 1, github_login: 'octocat', avatar_url: 'a.png', is_admin: false });
    await open();
    const input = el.querySelector('#pub-name') as HTMLInputElement;
    expect(input.value).toBe('Ocean');
  });

  it('POSTs the publish payload and shows the success state', async () => {
    auth.setUser({ id: 1, github_login: 'octocat', avatar_url: 'a.png', is_admin: false });
    await open();

    const publishBtn = Array.from(el.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Publish',
    ) as HTMLButtonElement;
    publishBtn.click();

    const req = http.expectOne(`${API}/api/themes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.name).toBe('Ocean');
    expect(req.request.body.base_preset).toBe('Aura');
    req.flush({ id: 'xyz', slug: 'ocean', ...req.request.body });
    fixture.detectChanges();

    expect(el.textContent).toContain('live in the marketplace');
    expect(designer.designer().theme?.publishedId).toBe('xyz');
  });

  it('surfaces a server error message', async () => {
    auth.setUser({ id: 1, github_login: 'octocat', avatar_url: 'a.png', is_admin: false });
    await open();
    (
      Array.from(el.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === 'Publish',
      ) as HTMLButtonElement
    ).click();

    http
      .expectOne(`${API}/api/themes`)
      .flush({ detail: 'You have reached the limit of 50 published themes' }, {
        status: 429,
        statusText: 'Too Many Requests',
      });
    fixture.detectChanges();

    expect(el.textContent).toContain('reached the limit');
  });
});
