import { Injectable, signal } from '@angular/core';

const KEY = 'ts_theme_mode';

/** App-wide light/dark toggle. Applies `.p-dark` on <html>; persists per browser. */
@Injectable({ providedIn: 'root' })
export class ThemeModeService {
  private readonly _isDark = signal(this.initial());
  readonly isDark = this._isDark.asReadonly();

  constructor() {
    this.apply(this._isDark());
  }

  toggle(): void {
    this.set(!this._isDark());
  }

  set(dark: boolean): void {
    this._isDark.set(dark);
    this.apply(dark);
    try {
      localStorage.setItem(KEY, dark ? 'dark' : 'light');
    } catch {
      /* storage unavailable — mode lasts for this page load only */
    }
  }

  private initial(): boolean {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
    } catch {
      /* ignore */
    }
    return (
      typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
    );
  }

  private apply(dark: boolean): void {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('p-dark', dark);
    }
  }
}
