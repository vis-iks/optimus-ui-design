import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MarketplaceTheme } from '../../core/marketplace.models';
import { ThemePreview } from './theme-preview';

@Component({
  selector: 'app-theme-card',
  standalone: true,
  imports: [ThemePreview],
  template: `
    <button
      type="button"
      class="card"
      [class.card--selected]="selected()"
      [attr.aria-pressed]="selected()"
      [attr.aria-label]="theme().name"
      (click)="select.emit(theme())"
    >
      <app-theme-preview
        class="preview"
        [preset]="theme().preset"
        [basePreset]="theme().base_preset"
        [fontFamily]="theme().config.fontFamily"
        [fontSize]="theme().config.fontSize"
        [themeName]="theme().name"
        [compact]="true"
        aria-hidden="true"
      />
    </button>
  `,
  styles: [
    `
      .card {
        display: flex;
        width: 100%;
        flex-direction: column;
        padding: 0;
        border: 0;
        border-radius: 8px;
        background: transparent;
        overflow: hidden;
        color: inherit;
        cursor: pointer;
        font: inherit;
        text-align: left;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .card:hover {
        background: var(--p-content-hover-background, #f1f5f9);
      }
      .card:focus-visible {
        outline: 3px solid color-mix(in srgb, var(--p-primary-color, #6366f1) 35%, transparent);
        outline-offset: 2px;
      }
      .card--selected {
        background: color-mix(in srgb, var(--p-primary-color, #6366f1) 10%, transparent);
        box-shadow: inset 3px 0 0 var(--p-primary-color, #6366f1);
      }
      .preview {
        display: block;
        border-bottom: 1px solid var(--p-content-border-color, #e5e7eb);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeCard {
  readonly theme = input.required<MarketplaceTheme>();
  readonly selected = input(false);
  readonly select = output<MarketplaceTheme>();
}
