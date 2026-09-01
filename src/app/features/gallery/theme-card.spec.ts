import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideOptimus } from '@openng/optimus-ui/config';
import Aura from '@openng/optimus-ui-themes/aura';

import { ThemeCard } from './theme-card';
import { MarketplaceTheme } from '../../core/marketplace.models';

function theme(overrides: Partial<MarketplaceTheme> = {}): MarketplaceTheme {
  return {
    id: 'abc123',
    slug: 'ocean',
    name: 'Ocean',
    description: 'Cool blues',
    base_preset: 'Aura',
    preset: { primitive: { blue: { 500: '#3b82f6', 700: '#1d4ed8' } } },
    config: { fontSize: '14px', fontFamily: 'Inter var' },
    author: { github_login: 'octocat', avatar_url: 'https://avatars/octo.png' },
    parent_id: null,
    parent: null,
    fork_count: 0,
    report_count: 0,
    view_count: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('ThemeCard', () => {
  let fixture: ComponentFixture<ThemeCard>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeCard],
      providers: [provideRouter([]), provideOptimus({ theme: { preset: Aura } })],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeCard);
    fixture.componentRef.setInput('theme', theme());
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  });

  it('renders the name, description and author', () => {
    expect(el.querySelector('.name')?.textContent).toContain('Ocean');
    expect(el.querySelector('.desc')?.textContent).toContain('Cool blues');
    expect(el.querySelector('.author')?.textContent).toContain('octocat');
  });

  it('renders a swatch strip from the preset colors', () => {
    const swatches = el.querySelectorAll('.swatch');
    expect(swatches.length).toBe(2);
    expect((swatches[0] as HTMLElement).style.background).toBe('rgb(59, 130, 246)');
  });

  it('links "Fork & edit" to the designer with the theme id', () => {
    const link = el.querySelector('a.btn--primary') as HTMLAnchorElement;
    expect(link.textContent).toContain('Fork');
    expect(link.getAttribute('href')).toBe('/designer?themeId=abc123');
  });

  it('links the lineage button to the theme detail page', () => {
    const link = el.querySelector('a.btn[href="/theme/abc123"]');
    expect(link).toBeTruthy();
  });

  it('shows a "forked from" link when the theme has a parent', () => {
    fixture.componentRef.setInput(
      'theme',
      theme({
        parent: {
          id: 'root1',
          slug: 'root',
          name: 'Root Theme',
          base_preset: 'Aura',
          author: { github_login: 'alice', avatar_url: 'a.png' },
          parent_id: null,
          fork_count: 1,
          created_at: new Date().toISOString(),
        },
      }),
    );
    fixture.detectChanges();
    const link = el.querySelector('a.forked-from') as HTMLAnchorElement;
    expect(link.textContent).toContain('Root Theme');
    expect(link.getAttribute('href')).toBe('/theme/root1');
  });

  it('shows the fork count when there are forks', () => {
    fixture.componentRef.setInput('theme', theme({ fork_count: 3 }));
    fixture.detectChanges();
    expect(el.querySelector('a.fork-link')?.textContent).toContain('3');
  });

  it('emits report when the flag button is clicked', () => {
    const spy = vi.fn();
    fixture.componentInstance.report.subscribe(spy);
    (el.querySelector('button.btn') as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'abc123' }));
  });

  it('shows "today" for a freshly created theme', () => {
    expect(el.querySelector('.meta')?.textContent).toContain('today');
  });
});
