import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from '@openng/optimus-ui/button';
import { IconField } from '@openng/optimus-ui/iconfield';
import { InputIcon } from '@openng/optimus-ui/inputicon';
import { InputText } from '@openng/optimus-ui/inputtext';
import { Paginator, PaginatorState } from '@openng/optimus-ui/paginator';
import { ProgressSpinner } from '@openng/optimus-ui/progressspinner';
import { Select } from '@openng/optimus-ui/select';

import { AppHeader } from '../../core/app-header';
import { downloadThemePreset } from '../../core/download-theme-preset';
import { MarketplaceService } from '../../core/marketplace.service';
import { BasePreset, MarketplaceTheme } from '../../core/marketplace.models';
import { Grid } from '../designer/blocks/grid/grid';
import { ThemeDesignerService } from '../designer/services/theme-designer.service';
import { ThemeCard } from './theme-card';

const PAGE_SIZE = 24;

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    AppHeader,
    Button,
    IconField,
    InputIcon,
    InputText,
    Paginator,
    ProgressSpinner,
    Select,
    Grid,
    ThemeCard,
  ],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Gallery implements OnInit {
  private readonly marketplace = inject(MarketplaceService);
  private readonly designer = inject(ThemeDesignerService);

  protected readonly themes = signal<MarketplaceTheme[]>([]);
  protected readonly selectedTheme = signal<MarketplaceTheme | null>(null);
  protected readonly previewFontFamily = this.designer.previewFontFamily;
  protected readonly previewFontSize = this.designer.previewFontSize;
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly first = signal(0);
  protected readonly pageSize = PAGE_SIZE;

  protected searchDraft = '';
  protected readonly search = signal('');
  protected readonly sort = signal<'recent' | 'popular'>('recent');
  protected readonly base = signal<BasePreset | 'all'>('all');

  protected readonly sortOptions = [
    { label: 'Newest', value: 'recent' },
    { label: 'Most viewed', value: 'popular' },
  ];
  protected readonly baseOptions = [
    { label: 'All foundations', value: 'all' },
    { label: 'Aura', value: 'Aura' },
    { label: 'Material', value: 'Material' },
    { label: 'Lara', value: 'Lara' },
    { label: 'Nora', value: 'Nora' },
    { label: 'Custom', value: 'custom' },
  ];

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.marketplace
      .listThemes({
        sort: this.sort(),
        base: this.base(),
        search: this.search(),
        limit: PAGE_SIZE,
        offset: this.first(),
      })
      .subscribe({
        next: (res) => {
          this.themes.set(res.items);
          const selectedId = this.selectedTheme()?.id;
          const selected = res.items.find((theme) => theme.id === selectedId) ?? res.items[0] ?? null;
          this.selectedTheme.set(selected);
          if (selected) this.previewTheme(selected);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.themes.set([]);
          this.total.set(0);
          this.loading.set(false);
          this.failed.set(true);
        },
      });
  }

  protected onSearchInput(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.first.set(0);
      this.search.set(this.searchDraft.trim());
      this.load();
    }, 300);
  }

  protected onFilterChange(): void {
    this.first.set(0);
    this.load();
  }

  protected onPage(event: PaginatorState): void {
    this.first.set(event.first ?? 0);
    this.load();
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected selectTheme(theme: MarketplaceTheme): void {
    this.selectedTheme.set(theme);
    this.previewTheme(theme);
  }

  protected downloadTheme(theme: MarketplaceTheme): void {
    downloadThemePreset(theme.name, theme.preset);
  }

  private previewTheme(theme: MarketplaceTheme): void {
    this.designer.previewThemeFromPreset(theme.name, theme.preset, theme.config);
  }
}
