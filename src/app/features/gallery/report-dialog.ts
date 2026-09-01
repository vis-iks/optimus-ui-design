import { ChangeDetectionStrategy, Component, inject, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from '@openng/optimus-ui/button';
import { Dialog } from '@openng/optimus-ui/dialog';
import { Message } from '@openng/optimus-ui/message';
import { Select } from '@openng/optimus-ui/select';
import { Textarea } from '@openng/optimus-ui/textarea';

import { MarketplaceService } from '../../core/marketplace.service';
import { MarketplaceTheme, ReportReason } from '../../core/marketplace.models';

@Component({
  selector: 'app-report-dialog',
  standalone: true,
  imports: [FormsModule, Button, Dialog, Message, Select, Textarea],
  template: `
    <p-dialog
      header="Report theme"
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '30rem' }"
    >
      @if (theme(); as t) {
        <div class="flex flex-col gap-4">
          <p class="text-sm text-muted-color m-0">
            Flag <strong>{{ t.name }}</strong> for a moderator. Themes with several reports are
            hidden automatically pending review.
          </p>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium" for="report-reason">Reason</label>
            <p-select
              inputId="report-reason"
              [options]="reasons"
              optionLabel="label"
              optionValue="value"
              [(ngModel)]="reason"
              styleClass="w-full"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium" for="report-details">Details (optional)</label>
            <textarea
              id="report-details"
              pTextarea
              [(ngModel)]="details"
              rows="3"
              maxlength="1000"
              class="w-full text-sm"
            ></textarea>
          </div>

          @if (error()) {
            <p-message severity="error" [text]="error()" />
          }

          <div class="flex justify-end gap-2">
            <p-button label="Cancel" severity="secondary" [text]="true" (click)="visible.set(false)" />
            <p-button
              label="Submit report"
              severity="danger"
              [loading]="submitting()"
              (click)="submit(t)"
            />
          </div>
        </div>
      }
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportDialog {
  private readonly marketplace = inject(MarketplaceService);

  readonly visible = model(false);
  readonly theme = input<MarketplaceTheme | null>(null);
  readonly reported = output<void>();

  protected readonly reasons: { label: string; value: ReportReason }[] = [
    { label: 'Spam or low effort', value: 'spam' },
    { label: 'Offensive or inappropriate', value: 'offensive' },
    { label: 'Broken / does not work', value: 'broken' },
    { label: 'Copyright or trademark', value: 'copyright' },
    { label: 'Something else', value: 'other' },
  ];

  protected reason: ReportReason = 'spam';
  protected details = '';
  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  protected submit(theme: MarketplaceTheme): void {
    this.submitting.set(true);
    this.error.set('');
    this.marketplace.reportTheme(theme.id, this.reason, this.details.trim() || undefined).subscribe({
      next: () => {
        this.submitting.set(false);
        this.details = '';
        this.reason = 'spam';
        this.visible.set(false);
        this.reported.emit();
      },
      error: (err) => {
        this.submitting.set(false);
        const detail = err?.error?.detail;
        this.error.set(
          typeof detail === 'string' ? detail : 'Could not submit the report. Please try again.',
        );
      },
    });
  }
}
