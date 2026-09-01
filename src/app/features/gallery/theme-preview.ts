import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { ThemeModeService } from '../../core/theme-mode.service';
import type { BasePreset } from '../../core/marketplace.models';
import { resolveThemePreview } from './theme-preview-tokens';

/**
 * A static, self-contained mock-up of what a marketplace theme looks like.
 *
 * Applying a real PrimeNG preset is global (`usePreset` writes to `:root`), so a
 * gallery of cards can't each render a live theme. Instead we resolve a preset
 * down to a dozen key colours/radii and paint plain elements styled to mimic a
 * button, input, tags and a toggle — enough to read the theme's personality at
 * a glance.
 */
@Component({
  selector: 'app-theme-preview',
  standalone: true,
  template: `
    @let t = tokens();
    <div
      class="tp"
      [style.--tp-primary]="t.primary"
      [style.--tp-primary-contrast]="t.primaryContrast"
      [style.--tp-primary-hover]="t.primaryHover"
      [style.--tp-surface]="t.surface"
      [style.--tp-surface-muted]="t.surfaceMuted"
      [style.--tp-border]="t.border"
      [style.--tp-text]="t.text"
      [style.--tp-text-muted]="t.textMuted"
      [style.--tp-field-bg]="t.fieldBackground"
      [style.--tp-field-border]="t.fieldBorder"
      [style.--tp-radius]="t.radius"
      [style.--tp-card-radius]="t.cardRadius"
    >
      <div class="tp-chrome">
        <span class="tp-dot"></span>
        <span class="tp-dot"></span>
        <span class="tp-dot"></span>
      </div>

      <div class="tp-body">
        <div class="tp-line tp-line--lg"></div>
        <div class="tp-line tp-line--sm"></div>

        <div class="tp-row">
          <span class="tp-btn tp-btn--primary">Get started</span>
          <span class="tp-btn tp-btn--ghost">Cancel</span>
        </div>

        <div class="tp-field"><span class="tp-field-label">Email</span></div>

        <div class="tp-row tp-row--tight">
          <span class="tp-tag tp-tag--primary">Active</span>
          <span class="tp-tag">Draft</span>
          <span class="tp-switch"><span class="tp-knob"></span></span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .tp {
        --tp-primary: #10b981;
        --tp-primary-contrast: #fff;
        --tp-primary-hover: #059669;
        --tp-surface: #fff;
        --tp-surface-muted: #f1f5f9;
        --tp-border: #e2e8f0;
        --tp-text: #334155;
        --tp-text-muted: #64748b;
        --tp-field-bg: #fff;
        --tp-field-border: #cbd5e1;
        --tp-radius: 6px;
        --tp-card-radius: 8px;

        background: var(--tp-surface);
        color: var(--tp-text);
        border-bottom: 1px solid var(--tp-border);
        user-select: none;
        pointer-events: none;
        overflow: hidden;
      }
      .tp-chrome {
        display: flex;
        gap: 5px;
        padding: 7px 10px;
        background: var(--tp-surface-muted);
        border-bottom: 1px solid var(--tp-border);
      }
      .tp-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--tp-border);
      }
      .tp-body {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
      }
      .tp-line {
        height: 7px;
        border-radius: 4px;
        background: var(--tp-text);
        opacity: 0.85;
      }
      .tp-line--lg {
        width: 55%;
      }
      .tp-line--sm {
        width: 78%;
        height: 6px;
        background: var(--tp-text-muted);
        opacity: 0.5;
      }
      .tp-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 2px;
      }
      .tp-row--tight {
        gap: 6px;
      }
      .tp-btn {
        font-size: 10px;
        font-weight: 600;
        line-height: 1;
        padding: 6px 10px;
        border-radius: var(--tp-radius);
      }
      .tp-btn--primary {
        background: var(--tp-primary);
        color: var(--tp-primary-contrast);
      }
      .tp-btn--ghost {
        color: var(--tp-primary);
        border: 1px solid var(--tp-primary);
      }
      .tp-field {
        display: flex;
        align-items: center;
        height: 22px;
        padding: 0 8px;
        background: var(--tp-field-bg);
        border: 1px solid var(--tp-field-border);
        border-radius: var(--tp-radius);
      }
      .tp-field-label {
        font-size: 10px;
        color: var(--tp-text-muted);
      }
      .tp-tag {
        font-size: 9px;
        font-weight: 600;
        line-height: 1;
        padding: 4px 7px;
        border-radius: 999px;
        background: var(--tp-surface-muted);
        color: var(--tp-text-muted);
      }
      .tp-tag--primary {
        background: color-mix(in srgb, var(--tp-primary) 16%, transparent);
        color: var(--tp-primary);
      }
      .tp-switch {
        display: inline-flex;
        align-items: center;
        width: 26px;
        height: 15px;
        padding: 2px;
        margin-left: auto;
        border-radius: 999px;
        background: var(--tp-primary);
      }
      .tp-knob {
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: var(--tp-primary-contrast);
        margin-left: auto;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemePreview {
  readonly preset = input.required<Record<string, unknown>>();
  readonly basePreset = input<BasePreset>();

  private readonly mode = inject(ThemeModeService);

  protected readonly tokens = computed(() =>
    resolveThemePreview(
      this.preset(),
      this.basePreset(),
      this.mode.isDark() ? 'dark' : 'light',
    ),
  );
}
