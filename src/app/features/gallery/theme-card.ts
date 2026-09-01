import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Avatar } from '@openng/optimus-ui/avatar';
import { Tag } from '@openng/optimus-ui/tag';

import { MarketplaceTheme } from '../../core/marketplace.models';
import { extractSwatches } from './swatches';

@Component({
  selector: 'app-theme-card',
  standalone: true,
  imports: [RouterLink, Avatar, Tag],
  template: `
    <article class="card">
      <div class="swatches" aria-hidden="true">
        @for (c of swatches(); track $index) {
          <span class="swatch" [style.background]="c"></span>
        } @empty {
          <span class="swatch swatch--empty"></span>
        }
      </div>

      <div class="body">
        <header class="head">
          <h3 class="name" [title]="theme().name">{{ theme().name }}</h3>
          <p-tag [value]="theme().base_preset" severity="secondary" [rounded]="true" />
        </header>

        @if (theme().description) {
          <p class="desc">{{ theme().description }}</p>
        }

        @if (theme().parent; as parent) {
          <a class="forked-from" [routerLink]="['/theme', parent.id]">
            <i class="pi pi-clone" aria-hidden="true"></i> forked from {{ parent.name }}
          </a>
        }

        <div class="meta">
          <span class="author">
            <p-avatar
              [image]="theme().author.avatar_url"
              shape="circle"
              size="normal"
              [style]="{ width: '1.25rem', height: '1.25rem' }"
            />
            {{ theme().author.github_login }}
          </span>
          <span class="dot">·</span>
          <span>{{ relativeDate() }}</span>
          <span class="dot">·</span>
          <span><i class="pi pi-eye"></i> {{ theme().view_count }}</span>
          @if (theme().fork_count > 0) {
            <span class="dot">·</span>
            <a class="fork-link" [routerLink]="['/theme', theme().id]"
              ><i class="pi pi-clone"></i> {{ theme().fork_count }}</a
            >
          }
        </div>

        <div class="actions">
          <a
            class="btn btn--primary"
            routerLink="/designer"
            [queryParams]="{ themeId: theme().id }"
          >
            <i class="pi pi-clone" aria-hidden="true"></i> Fork &amp; edit
          </a>
          <a class="btn" [routerLink]="['/theme', theme().id]" title="View lineage">
            <i class="pi pi-sitemap"></i>
          </a>
          <button type="button" class="btn" (click)="report.emit(theme())" title="Report this theme">
            <i class="pi pi-flag"></i>
          </button>
        </div>
      </div>
    </article>
  `,
  styles: [
    `
      .card {
        display: flex;
        flex-direction: column;
        border: 1px solid var(--p-content-border-color, #e5e7eb);
        border-radius: 14px;
        overflow: hidden;
        background: var(--p-content-background, #fff);
        transition: border-color 0.15s ease, transform 0.15s ease;
      }
      .card:hover {
        border-color: var(--p-primary-color, #6366f1);
        transform: translateY(-2px);
      }
      .swatches {
        display: flex;
        height: 56px;
      }
      .swatch {
        flex: 1;
      }
      .swatch--empty {
        background: var(--p-content-hover-background, #f1f5f9);
      }
      .body {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.875rem 1rem 1rem;
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
      }
      .name {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .desc {
        margin: 0;
        font-size: 0.8rem;
        color: var(--p-text-muted-color, #6b7280);
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .forked-from {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.72rem;
        color: var(--p-text-muted-color, #6b7280);
        text-decoration: none;
        max-width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .forked-from:hover {
        color: var(--p-primary-color, #6366f1);
      }
      .fork-link {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        color: inherit;
        text-decoration: none;
      }
      .fork-link:hover {
        color: var(--p-primary-color, #6366f1);
      }
      .meta {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.75rem;
        color: var(--p-text-muted-color, #6b7280);
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
        gap: 0.5rem;
        margin-top: 0.25rem;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        padding: 0.4rem 0.75rem;
        font-size: 0.8rem;
        font-weight: 500;
        border-radius: 8px;
        border: 1px solid var(--p-content-border-color, #e5e7eb);
        background: transparent;
        color: inherit;
        cursor: pointer;
        text-decoration: none;
      }
      .btn:hover {
        background: var(--p-content-hover-background, #f1f5f9);
      }
      .btn--primary {
        flex: 1;
        border-color: transparent;
        background: var(--p-primary-color, #6366f1);
        color: var(--p-primary-contrast-color, #fff);
      }
      .btn--primary:hover {
        background: var(--p-primary-color, #6366f1);
        filter: brightness(0.95);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeCard {
  readonly theme = input.required<MarketplaceTheme>();
  readonly report = output<MarketplaceTheme>();

  protected readonly swatches = computed(() => extractSwatches(this.theme().preset));

  protected readonly relativeDate = computed(() => {
    const then = new Date(this.theme().created_at).getTime();
    if (Number.isNaN(then)) return '';
    const days = Math.floor((Date.now() - then) / 86_400_000);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  });
}
