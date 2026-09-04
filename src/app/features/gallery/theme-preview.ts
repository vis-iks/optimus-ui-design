import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import { ThemeModeService } from '../../core/theme-mode.service';
import type { BasePreset } from '../../core/marketplace.models';
import { resolveThemePreview } from './theme-preview-tokens';

type PreviewScreen = 'preview' | 'login' | 'dashboard';

function fontStack(fontFamily: string): string {
  const family = fontFamily.trim().replaceAll('"', '');
  if (!family || family === 'system-ui') return 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
  if (family === 'Inter var') return '"Inter var", Inter, system-ui, sans-serif';
  return `"${family}", "Inter var", Inter, system-ui, sans-serif`;
}

/** An isolated, token-driven application sampler for marketplace themes. */
@Component({
  selector: 'app-theme-preview',
  standalone: true,
  template: `
    @let t = tokens();
    <div
      class="tp"
      [style.--tp-primary]="t.primary"
      [style.--tp-primary-contrast]="t.primaryContrast"
      [style.--tp-surface]="t.surface"
      [style.--tp-surface-muted]="t.surfaceMuted"
      [style.--tp-border]="t.border"
      [style.--tp-text]="t.text"
      [style.--tp-text-muted]="t.textMuted"
      [style.--tp-field-bg]="t.fieldBackground"
      [style.--tp-field-border]="t.fieldBorder"
      [style.--tp-radius]="t.radius"
      [style.--tp-card-radius]="t.cardRadius"
      [style.--tp-tag-radius]="t.tagRadius"
      [style.--tp-success-bg]="t.statusSuccessBackground"
      [style.--tp-success-color]="t.statusSuccessColor"
      [style.--tp-warn-bg]="t.statusWarnBackground"
      [style.--tp-warn-color]="t.statusWarnColor"
      [style.--tp-row-scale]="t.tableRowScale"
      [style.font-family]="fontStack()"
      [style.font-size]="fontSize()"
      [class.tp--compact]="compact()"
    >
      @if (compact()) {
        <div class="tp-mini" aria-hidden="true">
          <header><span class="tp-mini-mark">P</span><strong>{{ themeName() }}</strong></header>
          <div class="tp-mini-grid">
            <section class="tp-mini-form"><label>Project name</label><span>Website refresh</span><button>Save</button></section>
            <section class="tp-mini-table">
              <div class="tp-mini-table-head"><i></i><small>Code</small><small>Department</small><small>Status</small></div>
              <div class="tp-mini-table-row"><i class="tp-mini-row-icon"><i class="pi pi-check"></i></i><span>REC-002</span><span>Operations</span><em class="tp-mini-tag tp-mini-tag--success"><i class="pi pi-check-circle"></i><span>Completed</span></em></div>
              <div class="tp-mini-table-row"><i class="tp-mini-row-icon tp-mini-row-icon--muted"></i><span>REC-003</span><span>Engineering</span><em class="tp-mini-tag tp-mini-tag--warn"><i class="pi pi-clock"></i><span>In Progress</span></em></div>
            </section>
          </div>
        </div>
      } @else {
        <div class="tp-app">
          <header class="tp-bar"><span class="tp-mark">P</span><span>Studio</span><span class="tp-avatar">A</span></header>
          <nav class="tp-tabs" aria-label="Sample screens" role="tablist">
            @for (item of screens; track item.id) {
              <button type="button" [class.is-active]="screen() === item.id" [attr.aria-selected]="screen() === item.id" (click)="screen.set(item.id)">{{ item.label }}</button>
            }
          </nav>
          @switch (screen()) {
            @case ('dashboard') {
              <section class="tp-screen tp-dashboard">
                <div class="tp-heading"><div><small>Overview</small><strong>Projects</strong></div><button class="tp-button" type="button">New project</button></div>
                <div class="tp-stats"><span><strong>24</strong> tasks</span><span><strong>6</strong> due this week</span></div>
                <div class="tp-list">
                  <div><i class="tp-row-icon">W</i><span><strong>Website refresh</strong><small>12 tasks</small></span><em>Review</em></div>
                  <div><i class="tp-row-icon muted">A</i><span><strong>App onboarding</strong><small>8 tasks</small></span><em class="quiet-tag">Live</em></div>
                </div>
              </section>
            }
            @case ('login') {
              <section class="tp-screen tp-login"><div class="tp-login-card"><span class="tp-mark">P</span><strong>Welcome back</strong><small>Sign in to continue</small><label>Email <span class="tp-input">name@company.com</span></label><label>Password <span class="tp-input">••••••••</span></label><button class="tp-button" type="button">Sign in</button></div></section>
            }
            @case ('preview') {
              <section class="tp-screen tp-components"><div class="tp-heading"><div><small>Form</small><strong>Project details</strong></div></div><label>Name <span class="tp-input">Website refresh</span></label><div class="tp-control-row"><span class="tp-select">In review <b>⌄</b></span><span class="tp-toggle"><i></i></span></div><div class="tp-action-row"><button class="tp-button" type="button">Save changes</button><button class="tp-quiet" type="button">Cancel</button></div></section>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .tp { --tp-primary:#10b981; --tp-primary-contrast:#fff; --tp-surface:#fff; --tp-surface-muted:#f1f5f9; --tp-border:#e2e8f0; --tp-text:#334155; --tp-text-muted:#64748b; --tp-field-bg:#fff; --tp-field-border:#cbd5e1; --tp-radius:6px; --tp-card-radius:8px; --tp-tag-radius:6px; --tp-success-bg:#dcfce7; --tp-success-color:#15803d; --tp-warn-bg:#ffedd5; --tp-warn-color:#c2410c; --tp-row-scale:1; overflow:hidden; background:var(--tp-surface); color:var(--tp-text); }
      .tp-mini { --tp-mini-radius:calc(var(--tp-radius) * .78); --tp-mini-card-radius:calc(var(--tp-card-radius) * .78); display:flex; min-height:11.75rem; flex-direction:column; gap:.7rem; padding:.9rem; background:var(--tp-surface-muted); font-size:.75rem; }
      .tp-mini header { display:flex; align-items:center; gap:.5rem; color:var(--tp-text); }
      .tp-mini-mark { display:grid; place-items:center; width:1.25rem; height:1.25rem; border-radius:calc(var(--tp-mini-radius) * .7); background:var(--tp-primary); color:var(--tp-primary-contrast); font-size:.65rem; font-weight:700; }
      .tp-mini header strong { font-size:.8rem; }
      .tp-mini-grid { display:grid; grid-template-rows:auto minmax(0, 1fr); gap:.65rem; flex:1; min-height:0; }
      .tp-mini-form { display:grid; grid-template-columns:auto minmax(0, 1fr) auto; align-items:center; gap:.5rem; min-width:0; }
      .tp-mini-form label { color:var(--tp-text-muted); font-size:.62rem; font-weight:600; }
      .tp-mini-form span { overflow:hidden; min-height:1.55rem; padding:.4rem .5rem; border:1px solid var(--tp-field-border); border-radius:var(--tp-mini-radius); background:var(--tp-field-bg); color:var(--tp-text); font-size:.68rem; text-overflow:ellipsis; white-space:nowrap; }
      .tp-mini-form button { min-height:1.55rem; padding:0 .6rem; border:0; border-radius:var(--tp-mini-radius); background:var(--tp-primary); color:var(--tp-primary-contrast); font:inherit; font-size:.68rem; font-weight:700; }
      .tp-mini-table { display:flex; min-width:0; flex-direction:column; overflow:hidden; border:1px solid var(--tp-border); border-radius:var(--tp-mini-card-radius); background:var(--tp-surface); }
      .tp-mini-table-head, .tp-mini-table-row { display:grid; grid-template-columns:.8rem minmax(0, .9fr) minmax(0, 1.25fr) minmax(0, .9fr); align-items:center; gap:.45rem; padding:calc(.4rem * var(--tp-row-scale)) calc(.55rem * var(--tp-row-scale)); }
      .tp-mini-table-head { background:color-mix(in srgb, var(--tp-surface-muted) 55%, var(--tp-surface)); }
      .tp-mini-table-head small { overflow:hidden; color:var(--tp-text-muted); font-size:.58rem; font-weight:600; text-overflow:ellipsis; white-space:nowrap; }
      .tp-mini-table-head i, .tp-mini-row-icon { width:.6rem; height:.6rem; border-radius:calc(var(--tp-mini-radius) * .33); }
      .tp-mini-table-head i { border:1px solid var(--tp-field-border); }
      .tp-mini-row-icon { display:grid; place-items:center; background:var(--tp-primary); }
      .tp-mini-row-icon > i { font-size:.4rem; color:var(--tp-primary-contrast); }
      .tp-mini-row-icon--muted { border:1px solid var(--tp-field-border); background:var(--tp-surface-muted); }
      .tp-mini-table-row { border-top:1px solid var(--tp-border); }
      .tp-mini-table-row span { overflow:hidden; color:var(--tp-text); font-size:.61rem; text-overflow:ellipsis; white-space:nowrap; }
      .tp-mini-table-row em { display:flex; overflow:hidden; min-width:0; align-items:center; justify-self:start; font-style:normal; }
      .tp-mini-tag { display:inline-flex; overflow:hidden; max-width:100%; align-items:center; gap:.22rem; padding:.16rem .38rem; border-radius:calc(var(--tp-tag-radius) * .6); font-size:.54rem; font-weight:700; line-height:1.4; }
      .tp-mini-tag > i { flex:none; font-size:.6rem; }
      .tp-mini-tag span { overflow:hidden; color:inherit; text-overflow:ellipsis; white-space:nowrap; }
      .tp-mini-tag--success { background:var(--tp-success-bg); color:var(--tp-success-color); }
      .tp-mini-tag--warn { background:var(--tp-warn-bg); color:var(--tp-warn-color); }
      .tp-app { min-height:26rem; background:var(--tp-surface-muted); }
      .tp-bar { display:flex; align-items:center; gap:.55rem; height:3.3rem; padding:0 1rem; border-bottom:1px solid var(--tp-border); background:var(--tp-surface); font-size:.78rem; font-weight:700; }
      .tp-mark { display:grid; place-items:center; width:1.55rem; height:1.55rem; border-radius:calc(var(--tp-radius) * .7); background:var(--tp-primary); color:var(--tp-primary-contrast); font-size:.7rem; font-weight:700; }
      .tp-avatar { display:grid; place-items:center; width:1.45rem; height:1.45rem; margin-left:auto; border-radius:50%; background:var(--tp-surface-muted); color:var(--tp-text-muted); font-size:.62rem; }
      .tp-tabs { display:flex; gap:1rem; padding:0 .95rem; border-bottom:1px solid var(--tp-border); background:var(--tp-surface); }
      .tp-tabs button { padding:.65rem 0 .55rem; border:0; border-bottom:2px solid transparent; background:transparent; color:var(--tp-text-muted); font:inherit; font-size:.67rem; cursor:pointer; }
      .tp-tabs button.is-active { border-bottom-color:var(--tp-primary); color:var(--tp-text); font-weight:700; }
      .tp-screen { min-height:19.1rem; padding:1.1rem; }
      .tp-heading { display:flex; align-items:end; justify-content:space-between; gap:1rem; }
      .tp-heading div { display:flex; flex-direction:column; gap:.2rem; }
      .tp-heading small { color:var(--tp-text-muted); font-size:.58rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
      .tp-screen strong { font-size:1rem; line-height:1.1; }
      .tp-button { border:0; border-radius:var(--tp-radius); background:var(--tp-primary); color:var(--tp-primary-contrast); font:inherit; font-size:.67rem; font-weight:700; padding:.55rem .75rem; }
      .tp-stats { display:grid; grid-template-columns:1fr 1fr; gap:.55rem; margin:1rem 0; }
      .tp-stats span { padding:.65rem; border:1px solid var(--tp-border); border-radius:var(--tp-card-radius); background:var(--tp-surface); color:var(--tp-text-muted); font-size:.62rem; }
      .tp-stats strong { display:block; margin-bottom:.15rem; color:var(--tp-text); font-size:.9rem; }
      .tp-list { overflow:hidden; border:1px solid var(--tp-border); border-radius:var(--tp-card-radius); background:var(--tp-surface); }
      .tp-list > div { display:grid; grid-template-columns:1.75rem minmax(0, 1fr) auto; align-items:center; gap:.6rem; padding:.7rem; }
      .tp-list > div + div { border-top:1px solid var(--tp-border); }
      .tp-row-icon { display:grid; place-items:center; width:1.75rem; height:1.75rem; border-radius:50%; background:var(--tp-primary); color:var(--tp-primary-contrast); font-size:.6rem; font-style:normal; font-weight:700; }
      .tp-row-icon.muted { background:var(--tp-surface-muted); color:var(--tp-text-muted); }
      .tp-list > div > span { display:flex; min-width:0; flex-direction:column; gap:.12rem; }
      .tp-list strong { overflow:hidden; font-size:.68rem; text-overflow:ellipsis; white-space:nowrap; }
      .tp-list small, .tp-login-card > small { color:var(--tp-text-muted); font-size:.58rem; }
      .tp-list em { padding:.3rem .4rem; border-radius:99px; background:color-mix(in srgb, var(--tp-primary) 13%, transparent); color:var(--tp-primary); font-size:.55rem; font-style:normal; font-weight:700; }
      .tp-list em.quiet-tag { background:var(--tp-surface-muted); color:var(--tp-text-muted); }
      .tp-login { display:grid; place-items:center; }
      .tp-login-card { display:flex; width:min(100%,15rem); flex-direction:column; align-items:stretch; gap:.65rem; padding:1.2rem; border:1px solid var(--tp-border); border-radius:var(--tp-card-radius); background:var(--tp-surface); }
      .tp-login-card .tp-mark { margin-bottom:.15rem; }
      .tp-login-card label, .tp-components label { display:flex; flex-direction:column; gap:.32rem; color:var(--tp-text-muted); font-size:.62rem; font-weight:600; }
      .tp-input, .tp-select { display:flex; align-items:center; min-height:2.1rem; padding:0 .65rem; border:1px solid var(--tp-field-border); border-radius:var(--tp-radius); background:var(--tp-field-bg); color:var(--tp-text); font-size:.67rem; font-weight:400; }
      .tp-components { display:flex; flex-direction:column; gap:1rem; }
      .tp-control-row, .tp-action-row { display:flex; align-items:center; gap:.65rem; }
      .tp-select { flex:1; justify-content:space-between; }
      .tp-select b { color:var(--tp-text-muted); font-size:.8rem; }
      .tp-toggle { display:flex; align-items:center; width:2rem; height:1.15rem; padding:.12rem; border-radius:99px; background:var(--tp-primary); }
      .tp-toggle i { width:.9rem; height:.9rem; margin-left:auto; border-radius:50%; background:var(--tp-primary-contrast); }
      .tp-quiet { border:0; background:transparent; color:var(--tp-text-muted); font:inherit; font-size:.67rem; font-weight:600; }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemePreview {
  readonly preset = input.required<Record<string, unknown>>();
  readonly basePreset = input<BasePreset>();
  readonly fontFamily = input('inherit');
  readonly fontSize = input('14px');
  readonly themeName = input('New project');
  readonly compact = input(false);

  protected readonly screen = signal<PreviewScreen>('preview');
  protected readonly screens: { id: PreviewScreen; label: string }[] = [
    { id: 'preview', label: 'Preview' },
    { id: 'login', label: 'Login' },
    { id: 'dashboard', label: 'Dashboard' },
  ];
  private readonly mode = inject(ThemeModeService);
  protected readonly fontStack = computed(() => fontStack(this.fontFamily()));
  protected readonly tokens = computed(() =>
    resolveThemePreview(this.preset(), this.basePreset(), this.mode.isDark() ? 'dark' : 'light'),
  );
}
