import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '@openng/optimus-ui/button';

import { AppHeader } from '../../core/app-header';
import { MarketplaceService } from '../../core/marketplace.service';
import { MarketplaceReport, ResolveAction } from '../../core/marketplace.models';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [RouterLink, AppHeader, Button],
  template: `
    <app-header />
    <main class="wrap">
      <header class="head">
        <h1>Report queue</h1>
        <a routerLink="/">← Back to the marketplace</a>
      </header>

      @if (loading()) {
        <p class="muted">Loading…</p>
      } @else if (reports().length === 0) {
        <p class="muted">Nothing to review. 🎉</p>
      } @else {
        <ul class="list">
          @for (r of reports(); track r.id) {
            <li class="row">
              <div class="info">
                <div class="line1">
                  <strong>{{ r.theme.name }}</strong>
                  <span class="badge">{{ r.reason }}</span>
                  <span class="muted">by {{ r.reporter.github_login }}</span>
                </div>
                @if (r.details) {
                  <p class="details">{{ r.details }}</p>
                }
                <p class="muted small">
                  Theme author: {{ r.theme.author.github_login }} ·
                  {{ r.theme.report_count }} report(s) total
                </p>
              </div>
              <div class="actions">
                <p-button label="Dismiss" size="small" severity="secondary" [outlined]="true"
                  (click)="resolve(r, 'dismiss')" />
                <p-button label="Hide" size="small" severity="warn"
                  (click)="resolve(r, 'hide')" />
                <p-button label="Delete" size="small" severity="danger"
                  (click)="resolve(r, 'delete')" />
              </div>
            </li>
          }
        </ul>
      }
    </main>
  `,
  styles: [
    `
      .wrap {
        max-width: 860px;
        margin: 0 auto;
        padding: 2rem 1.5rem 4rem;
      }
      .head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
      }
      .head a {
        font-size: 0.85rem;
        text-decoration: none;
        color: var(--p-primary-color, #6366f1);
      }
      h1 {
        font-size: 1.4rem;
        margin: 0 0 1rem;
      }
      .muted {
        color: var(--p-text-muted-color, #6b7280);
      }
      .small {
        font-size: 0.75rem;
      }
      .list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .row {
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        align-items: flex-start;
        border: 1px solid var(--p-content-border-color, #e5e7eb);
        border-radius: 12px;
        padding: 1rem;
      }
      .line1 {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .badge {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        background: var(--p-content-hover-background, #f1f5f9);
        border-radius: 999px;
        padding: 0.1rem 0.5rem;
      }
      .details {
        margin: 0.4rem 0;
        font-size: 0.85rem;
      }
      .actions {
        display: flex;
        gap: 0.4rem;
        flex-shrink: 0;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPanel implements OnInit {
  private readonly marketplace = inject(MarketplaceService);

  protected readonly reports = signal<MarketplaceReport[]>([]);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.refresh();
  }

  protected refresh(): void {
    this.loading.set(true);
    this.marketplace.listReports(false).subscribe({
      next: (rows) => {
        this.reports.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.reports.set([]);
        this.loading.set(false);
      },
    });
  }

  protected resolve(report: MarketplaceReport, action: ResolveAction): void {
    this.marketplace.resolveReport(report.id, action).subscribe({
      next: () => this.refresh(),
    });
  }
}
