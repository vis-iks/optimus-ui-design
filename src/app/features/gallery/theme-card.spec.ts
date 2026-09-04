import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    preset: {
      primitive: { blue: { 500: '#3b82f6', 700: '#1d4ed8' } },
      semantic: { colorScheme: { light: { primary: { color: '{blue.500}' } } } },
    },
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
      providers: [provideOptimus({ theme: { preset: Aura } })],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeCard);
    fixture.componentRef.setInput('theme', theme());
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  });

  it('renders the theme name inside its thumbnail without duplicate card metadata', () => {
    expect(el.querySelector('.tp-mini header strong')?.textContent).toContain('Ocean');
    expect(el.querySelector('.card')?.getAttribute('aria-label')).toBe('Ocean');
    expect(el.querySelector('.name')).toBeFalsy();
    expect(el.querySelector('.foundation')).toBeFalsy();
    expect(el.querySelector('.author')).toBeFalsy();
    expect(el.querySelector('.actions')).toBeFalsy();
  });

  it('renders a theme preview mock-up driven by the preset', () => {
    const preview = el.querySelector('app-theme-preview .tp') as HTMLElement;
    expect(preview).toBeTruthy();
    // `{primary.500}` resolves through the merged Aura base to the preset's blue.
    expect(preview.style.getPropertyValue('--tp-primary')).toBe('#3b82f6');
    expect(el.querySelector('.tp-mini')).toBeTruthy();
  });

  it('emits selection when the compact card is clicked', () => {
    const spy = vi.fn();
    fixture.componentInstance.select.subscribe(spy);
    (el.querySelector('button.card') as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'abc123' }));
  });

  it('marks the selected card for assistive technology', () => {
    fixture.componentRef.setInput('selected', true);
    fixture.detectChanges();
    expect(el.querySelector('button.card')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps its card content minimal', () => {
    expect(el.querySelector('.forked-from')).toBeFalsy();
    expect(el.querySelector('.updated')).toBeFalsy();
  });
});
