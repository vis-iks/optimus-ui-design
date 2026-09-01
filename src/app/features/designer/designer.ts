import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Splitter } from '@openng/optimus-ui/splitter';
import { Tooltip } from '@openng/optimus-ui/tooltip';

import { AppHeader } from '../../core/app-header';
import { MarketplaceService } from '../../core/marketplace.service';
import { ThemeDesignerService } from './services/theme-designer.service';
import { CreateTheme } from './components/create-theme';
import { DesignEditor } from './components/editor';
import { EditorFooter } from './components/editor-footer';
import { Grid } from './blocks/grid/grid';
import { getStarterTheme } from '../../starter-themes';

@Component({
  selector: 'app-designer',
  standalone: true,
  imports: [AppHeader, Splitter, Tooltip, CreateTheme, DesignEditor, EditorFooter, Grid],
  templateUrl: './designer.html',
  styleUrl: './designer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Designer implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly marketplace = inject(MarketplaceService);
  protected readonly designerService = inject(ThemeDesignerService);
  protected readonly activeView = computed(() => this.designerService.designer().activeView);
  protected readonly previewThemeName = this.designerService.previewThemeName;
  protected readonly previewFontFamily = this.designerService.previewFontFamily;
  protected readonly previewFontSize = this.designerService.previewFontSize;
  protected readonly themeName = computed(
    () => this.designerService.designer().theme?.name ?? 'Theme Designer',
  );
  protected readonly shareCopied = signal(false);

  ngOnInit(): void {
    const themeId = this.route.snapshot.queryParamMap.get('themeId');
    if (themeId) {
      this.marketplace.getTheme(themeId).subscribe({
        next: (theme) => this.designerService.applyMarketplaceTheme(theme),
        error: () => this.designerService.openCreateTheme(),
      });
      return;
    }

    const themeParam = this.route.snapshot.queryParamMap.get('theme');
    if (themeParam) {
      this.designerService
        .importThemeFromUrl(themeParam)
        .catch(() => false)
        .then((ok) => {
          if (!ok) this.designerService.importTheme(themeParam);
        });
      return;
    }

    const starter = getStarterTheme(this.route.snapshot.queryParamMap.get('starter'));
    if (starter) {
      this.designerService.createThemeFromPreset(`${starter.name} Custom`, starter.preset, {
        fontFamily: starter.fontFamily,
        fontSize: starter.fontSize,
      });
    }
  }

  protected backToCreate(): void {
    this.designerService.openCreateTheme();
  }

  protected async copyShareLink(): Promise<void> {
    const token = await this.designerService.compressThemeForUrl();
    if (!token) return;
    const url = `${window.location.origin}/designer?theme=${token}`;
    await navigator.clipboard.writeText(url);
    this.shareCopied.set(true);
    setTimeout(() => this.shareCopied.set(false), 2000);
  }
}
