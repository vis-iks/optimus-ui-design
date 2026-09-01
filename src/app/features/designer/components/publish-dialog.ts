import { ChangeDetectionStrategy, Component, effect, inject, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from '@openng/optimus-ui/button';
import { Dialog } from '@openng/optimus-ui/dialog';
import { InputText } from '@openng/optimus-ui/inputtext';
import { Message } from '@openng/optimus-ui/message';
import { Select } from '@openng/optimus-ui/select';
import { Textarea } from '@openng/optimus-ui/textarea';

import { AuthService } from '../../../core/auth.service';
import { MarketplaceService } from '../../../core/marketplace.service';
import { BasePreset, ThemeDesignerService } from '../services/theme-designer.service';

@Component({
  selector: 'design-publish-dialog',
  standalone: true,
  imports: [FormsModule, RouterLink, Button, Dialog, InputText, Message, Select, Textarea],
  template: `
    <p-dialog
      header="Publish to the marketplace"
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: '34rem' }"
    >
      @if (!auth.isLoggedIn()) {
        <div class="flex flex-col gap-4">
          <p class="text-sm text-muted-color m-0">
            Sign in with GitHub so your theme is credited to you and you can update or remove it
            later.
          </p>
          <div class="flex justify-end">
            <p-button label="Sign in with GitHub" icon="pi pi-github" (click)="auth.login('/designer')" />
          </div>
        </div>
      } @else if (publishedSlug()) {
        <div class="flex flex-col gap-4">
          <p-message severity="success" text="Your theme is live in the marketplace." />
          <div class="flex justify-end gap-2">
            <p-button
              label="View in the marketplace"
              icon="pi pi-arrow-up-right"
              routerLink="/"
              (click)="visible.set(false)"
            />
          </div>
        </div>
      } @else {
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium" for="pub-name">Theme name</label>
            <input id="pub-name" pInputText [(ngModel)]="name" maxlength="60" class="w-full" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium" for="pub-desc">Short description (optional)</label>
            <textarea
              id="pub-desc"
              pTextarea
              [(ngModel)]="description"
              rows="2"
              maxlength="200"
              class="w-full text-sm"
            ></textarea>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium" for="pub-base">Foundation</label>
            <p-select
              inputId="pub-base"
              [options]="baseOptions"
              optionLabel="label"
              optionValue="value"
              [(ngModel)]="base"
              styleClass="w-full"
            />
          </div>

          @if (parentName(); as parent) {
            <p-message
              severity="info"
              [text]="'This will be published as a fork of “' + parent + '”.'"
            />
          }

          <p class="text-xs text-muted-color m-0">
            Publishing as <strong>{{ auth.currentUser()!.github_login }}</strong>. Themes appear
            immediately; anyone can report a theme for a moderator to review.
          </p>

          @if (error()) {
            <p-message severity="error" [text]="error()" />
          }

          <div class="flex justify-end gap-2">
            <p-button label="Cancel" severity="secondary" [text]="true" (click)="visible.set(false)" />
            <p-button
              label="Publish"
              icon="pi pi-upload"
              [loading]="submitting()"
              [disabled]="!name().trim()"
              (click)="publish()"
            />
          </div>
        </div>
      }
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublishDialog {
  protected readonly auth = inject(AuthService);
  private readonly marketplace = inject(MarketplaceService);
  private readonly designer = inject(ThemeDesignerService);

  readonly visible = model(false);

  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly base = signal<BasePreset>('custom');
  protected readonly parentName = signal('');
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly publishedSlug = signal('');

  protected readonly baseOptions: { label: string; value: BasePreset }[] = [
    { label: 'Custom', value: 'custom' },
    { label: 'Aura', value: 'Aura' },
    { label: 'Material', value: 'Material' },
    { label: 'Lara', value: 'Lara' },
    { label: 'Nora', value: 'Nora' },
  ];

  private wasVisible = false;

  constructor() {
    // Prefill from the current theme each time the dialog opens.
    effect(() => {
      const open = this.visible();
      if (open && !this.wasVisible) {
        this.syncFromTheme();
      }
      this.wasVisible = open;
    });
  }

  private syncFromTheme(): void {
    const theme = this.designer.designer().theme;
    this.publishedSlug.set('');
    this.error.set('');
    if (!theme) return;
    this.name.set(theme.name);
    this.description.set(theme.description ?? '');
    this.base.set(theme.base ?? 'custom');
    this.parentName.set(theme.parentName ?? '');
  }

  protected publish(): void {
    const payload = this.designer.buildPublishPayload(
      this.name(),
      this.description(),
      this.base(),
    );
    if (!payload) {
      this.error.set('Create or open a theme before publishing.');
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    this.marketplace.publishTheme(payload).subscribe({
      next: (theme) => {
        this.submitting.set(false);
        this.designer.markPublished(theme.id);
        this.publishedSlug.set(theme.slug);
      },
      error: (err) => {
        this.submitting.set(false);
        const detail = err?.error?.detail;
        this.error.set(
          typeof detail === 'string'
            ? detail
            : err?.status === 401
              ? 'Your session expired. Sign in again to publish.'
              : 'Could not publish the theme. Please try again.',
        );
      },
    });
  }
}
