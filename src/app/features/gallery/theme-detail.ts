import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Avatar } from '@openng/optimus-ui/avatar';
import { Button } from '@openng/optimus-ui/button';
import { Tag } from '@openng/optimus-ui/tag';
import { forkJoin } from 'rxjs';

import { AppHeader } from '../../core/app-header';
import { AuthService } from '../../core/auth.service';
import { downloadThemePreset } from '../../core/download-theme-preset';
import { MarketplaceService } from '../../core/marketplace.service';
import { MarketplaceTheme, ThemeFamily, ThemeSummary } from '../../core/marketplace.models';
import { ReportDialog } from './report-dialog';
import { extractSwatches } from './swatches';

interface TreeRow {
  node: ThemeSummary;
  depth: number;
  isLast: boolean;
}

@Component({
  selector: 'app-theme-detail',
  standalone: true,
  imports: [RouterLink, AppHeader, Avatar, Button, Tag, ReportDialog],
  template: `
    <app-header />

    <main class="wrap">
      <a routerLink="/" class="back">← Back to the marketplace</a>

      @if (loading()) {
        <p class="muted">Loading…</p>
      } @else if (!theme()) {
        <p class="muted">This theme is not available.</p>
      } @else {
        @let t = theme()!;
        <div class="hero">
          <div class="swatches" aria-hidden="true">
            @for (c of swatches(); track $index) {
              <span [style.background]="c"></span>
            }
          </div>
          <div class="hero-body">
            <div class="title-row">
              <h1>{{ t.name }}</h1>
              <p-tag [value]="t.base_preset" severity="secondary" [rounded]="true" />
            </div>
            @if (t.description) {
              <p class="desc">{{ t.description }}</p>
            }
            <div class="meta">
              <span class="author">
                <p-avatar
                  [image]="t.author.avatar_url"
                  shape="circle"
                  [style]="{ width: '1.4rem', height: '1.4rem' }"
                />
                {{ t.author.github_login }}
              </span>
              <span class="dot">·</span>
              <span>{{ t.view_count }} views</span>
              <span class="dot">·</span>
              <span>{{ t.fork_count }} forks</span>
              @if (t.parent) {
                <span class="dot">·</span>
                <a [routerLink]="['/theme', t.parent.id]">forked from {{ t.parent.name }}</a>
              }
            </div>
            <div class="actions">
              <a class="btn btn--primary" routerLink="/designer" [queryParams]="{ themeId: t.id }">
                <i class="pi pi-clone"></i> Fork &amp; edit
              </a>
              <p-button
                label="Download"
                icon="pi pi-download"
                severity="secondary"
                [outlined]="true"
                size="small"
                (click)="onDownload(t)"
              />
              <p-button
                label="Report"
                icon="pi pi-flag"
                severity="secondary"
                [outlined]="true"
                size="small"
                (click)="onReport(t)"
              />
            </div>
          </div>
        </div>

        <section class="lineage">
          <h2>Lineage</h2>
          @if (rows().length <= 1) {
            <p class="muted">No forks yet — this theme has no descendants or ancestors.</p>
          } @else {
            <ul class="tree">
              @for (row of rows(); track row.node.id) {
                <li [style.--depth]="row.depth" [class.is-focus]="row.node.id === family()!.focus_id">
                  <span class="branch" aria-hidden="true">{{ row.depth > 0 ? '└─' : '' }}</span>
                  <a [routerLink]="['/theme', row.node.id]" class="tree-name">{{ row.node.name }}</a>
                  <p-tag [value]="row.node.base_preset" severity="secondary" [rounded]="true" />
                  <span class="tree-author">&#64;{{ row.node.author.github_login }}</span>
                  @if (row.node.id === family()!.focus_id) {
                    <span class="here">this theme</span>
                  }
                </li>
              }
            </ul>
          }
        </section>
      }
    </main>

    <app-report-dialog [theme]="reportTarget()" [(visible)]="reportOpen" />
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: var(--p-content-background, #fff);
        color: var(--p-text-color, #111827);
      }
      .wrap {
        max-width: 900px;
        margin: 0 auto;
        padding: 1.75rem 1.5rem 4rem;
      }
      .back {
        font-size: 0.85rem;
        text-decoration: none;
        color: var(--p-primary-color, #6366f1);
      }
      .muted {
        color: var(--p-text-muted-color, #6b7280);
      }
      .hero {
        margin-top: 1.25rem;
        border: 1px solid var(--p-content-border-color, #e5e7eb);
        border-radius: 14px;
        overflow: hidden;
      }
      .swatches {
        display: flex;
        height: 72px;
      }
      .swatches span {
        flex: 1;
      }
      .hero-body {
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .title-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }
      .title-row h1 {
        margin: 0;
        font-size: 1.4rem;
        font-weight: 700;
      }
      .desc {
        margin: 0;
        color: var(--p-text-muted-color, #6b7280);
        font-size: 0.9rem;
      }
      .meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.4rem;
        font-size: 0.8rem;
        color: var(--p-text-muted-color, #6b7280);
      }
      .meta a {
        color: inherit;
      }
      .author {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
      }
      .dot {
        opacity: 0.5;
      }
      .actions {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-top: 0.4rem;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.45rem 0.9rem;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        text-decoration: none;
      }
      .btn--primary {
        background: var(--p-primary-color, #6366f1);
        color: var(--p-primary-contrast-color, #fff);
      }
      .lineage {
        margin-top: 2rem;
      }
      .lineage h2 {
        font-size: 1.1rem;
        margin: 0 0 0.75rem;
      }
      .tree {
        list-style: none;
        margin: 0;
        padding: 0;
        font-size: 0.88rem;
      }
      .tree li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.35rem 0;
        padding-left: calc(var(--depth) * 1.5rem);
      }
      .tree li.is-focus {
        font-weight: 600;
      }
      .branch {
        color: var(--p-text-muted-color, #6b7280);
        font-family: var(--font-mono, monospace);
      }
      .tree-name {
        color: inherit;
        text-decoration: none;
      }
      .tree-name:hover {
        color: var(--p-primary-color, #6366f1);
      }
      .tree-author {
        color: var(--p-text-muted-color, #6b7280);
        font-size: 0.8rem;
      }
      .here {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--p-primary-color, #6366f1);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly marketplace = inject(MarketplaceService);
  protected readonly auth = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly theme = signal<MarketplaceTheme | null>(null);
  protected readonly family = signal<ThemeFamily | null>(null);

  protected readonly reportTarget = signal<MarketplaceTheme | null>(null);
  protected readonly reportOpen = signal(false);

  protected readonly swatches = computed(() => extractSwatches(this.theme()?.preset));

  /** Depth-first flatten of the family tree, starting at the root(s). */
  protected readonly rows = computed<TreeRow[]>(() => {
    const fam = this.family();
    if (!fam) return [];

    const ids = new Set(fam.nodes.map((n) => n.id));
    const childrenOf = new Map<string, ThemeSummary[]>();
    const roots: ThemeSummary[] = [];
    for (const node of fam.nodes) {
      if (node.parent_id && ids.has(node.parent_id)) {
        const list = childrenOf.get(node.parent_id) ?? [];
        list.push(node);
        childrenOf.set(node.parent_id, list);
      } else {
        roots.push(node);
      }
    }

    const byDate = (a: ThemeSummary, b: ThemeSummary) => a.created_at.localeCompare(b.created_at);
    roots.sort(byDate);
    for (const list of childrenOf.values()) list.sort(byDate);

    const out: TreeRow[] = [];
    const walk = (node: ThemeSummary, depth: number, isLast: boolean) => {
      out.push({ node, depth, isLast });
      const kids = childrenOf.get(node.id) ?? [];
      kids.forEach((kid, i) => walk(kid, depth + 1, i === kids.length - 1));
    };
    roots.forEach((root, i) => walk(root, 0, i === roots.length - 1));
    return out;
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.loading.set(true);
      forkJoin({
        theme: this.marketplace.getTheme(id),
        family: this.marketplace.getFamily(id),
      }).subscribe({
        next: ({ theme, family }) => {
          this.theme.set(theme);
          this.family.set(family);
          this.loading.set(false);
        },
        error: () => {
          this.theme.set(null);
          this.family.set(null);
          this.loading.set(false);
        },
      });
    });
  }

  protected onDownload(theme: MarketplaceTheme): void {
    downloadThemePreset(theme.name, theme.preset);
  }

  protected onReport(theme: MarketplaceTheme): void {
    if (!this.auth.isLoggedIn()) {
      this.auth.login(`/theme/${theme.id}`);
      return;
    }
    this.reportTarget.set(theme);
    this.reportOpen.set(true);
  }
}
