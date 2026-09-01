import { computed, Injectable, signal } from '@angular/core';
import { $dt, usePreset } from '@openng/optimus-ui-themes';

export interface AcToken {
  name: string;
  label: string;
  variable: string;
  value: string;
  isColor: boolean;
}

export interface ThemeConfig {
  fontSize: string;
  fontFamily: string;
}

export type BasePreset = 'Aura' | 'Material' | 'Lara' | 'Nora' | 'custom';

export interface ThemeState {
  name: string;
  preset: any;
  config: ThemeConfig;
  /** Foundation this theme was started from, used as the marketplace default. */
  base?: BasePreset;
  /** Set once a theme has been published to the marketplace. */
  publishedId?: string;
  description?: string;
  /** The marketplace theme this one was forked from, if any. */
  parentId?: string;
  parentName?: string;
}

export interface PublishThemePayload {
  name: string;
  description?: string | null;
  base_preset: BasePreset;
  preset: any;
  config: ThemeConfig;
  parent_id?: string | null;
}

export interface DesignerState {
  activeView: 'create' | 'editor';
  activeTab: number;
  theme: ThemeState | null;
  acTokens: AcToken[];
}

const FONT_LIST = [
  'system-ui',
  'Inter var',
  'Archivo',
  'Assistant',
  'Cairo',
  'Figtree',
  'Hanken Grotesk',
  'IBM Plex Sans',
  'Instrument Sans',
  'Inter',
  'Josefin Sans',
  'Lexend',
  'Montserrat',
  'Mulish',
  'Nunito',
  'Nunito Sans',
  'Open Sans',
  'Outfit',
  'Poppins',
  'Public Sans',
  'Quicksand',
  'Raleway',
  'Roboto',
  'Rubik',
  'Source Sans 3',
  'Work Sans',
  'Yantramanav',
];

const FONT_SIZES = ['12px', '13px', '14px', '15px', '16px', '17px', '18px', '19px', '20px'];
const STUDIO_FONT_SIZE = '14px';

function resolveFontStack(fontFamily: string): string {
  if (fontFamily === 'system-ui') {
    return 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  }
  if (fontFamily === 'Inter var') {
    return '"Inter var", sans-serif';
  }
  return `"${fontFamily}", "Helvetica Neue", Arial, sans-serif`;
}

@Injectable({ providedIn: 'root' })
export class ThemeDesignerService {
  readonly fonts = FONT_LIST;
  readonly fontSizes = FONT_SIZES;
  readonly previewThemeName = signal('Custom');
  readonly previewFontFamily = signal(resolveFontStack('Inter var'));
  readonly previewFontSize = signal(STUDIO_FONT_SIZE);

  readonly designer = signal<DesignerState>({
    activeView: 'create',
    activeTab: 0,
    theme: null,
    acTokens: [],
  });

  readonly acTokens = computed(() => this.designer().acTokens);

  resolveColor(token: string | undefined): string {
    if (!token) {
      return '';
    }

    let color: string;
    if (token.startsWith('{') && token.endsWith('}')) {
      const cssVariable = $dt(token).variable.slice(4, -1);
      color = getComputedStyle(document.documentElement).getPropertyValue(cssVariable);
    } else {
      color = token;
    }

    return this.removeAlphaTransparency(color);
  }

  removeAlphaTransparency(color: string): string {
    if (color && /^#[0-9A-Fa-f]{8}$/.test(color)) {
      return color.slice(0, 7);
    }
    return color;
  }

  resolveColorPlain(color: string | undefined): string {
    if (!color) {
      return '';
    }
    if (color.startsWith('{') && color.endsWith('}')) {
      return $dt(color).variable;
    }
    return color;
  }

  refreshACTokens(): void {
    this.designer.update((prev) => ({ ...prev, acTokens: [] }));
    const theme = this.designer().theme;
    if (theme) {
      this.generateACTokens(null, theme.preset);
    }
  }

  generateACTokens(parentPath: string | null, obj: Record<string, unknown>): void {
    for (const key in obj) {
      if (key === 'dark' || key === 'components' || key === 'directives') {
        continue;
      }

      if (
        key === 'primitive' ||
        key === 'semantic' ||
        key === 'colorScheme' ||
        key === 'light' ||
        key === 'extend'
      ) {
        this.generateACTokens(null, obj[key] as Record<string, unknown>);
      } else {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          this.generateACTokens(
            parentPath ? parentPath + '.' + key : key,
            obj[key] as Record<string, unknown>,
          );
        } else {
          const regex = /\.\d+$/;
          const tokenName = this.camelCaseToDotCase(parentPath ? parentPath + '.' + key : key);
          const tokenValue = String(obj[key]);
          const isColor =
            tokenName.includes('color') ||
            tokenName.includes('background') ||
            regex.test(tokenName) ||
            tokenValue.startsWith('#') ||
            tokenValue.startsWith('rgb') ||
            tokenValue.startsWith('hsl') ||
            tokenValue.startsWith('oklch');

          this.designer.update((prev) => ({
            ...prev,
            acTokens: [
              ...prev.acTokens,
              {
                name: tokenName,
                label: '{' + tokenName + '}',
                variable: $dt(tokenName).variable,
                value: tokenValue,
                isColor,
              },
            ],
          }));
        }
      }
    }
  }

  camelCaseToDotCase(name: string): string {
    return name.replace(/([a-z])([A-Z])/g, '$1.$2').toLowerCase();
  }

  applyTheme(showMessage = false): void {
    const theme = this.designer().theme;
    if (!theme) {
      return;
    }
    usePreset(theme.preset);
    this.refreshACTokens();
    if (showMessage) {
      console.info('Theme applied successfully.');
    }
  }

  createThemeFromPreset(
    name: string,
    preset: any,
    config?: Partial<ThemeConfig>,
    base: BasePreset = 'custom',
  ): void {
    const cloned = structuredClone(preset);
    const themeConfig: ThemeConfig = {
      fontSize: '14px',
      fontFamily: 'Inter var',
      ...config,
    };
    this.designer.update((prev) => ({
      ...prev,
      theme: {
        name,
        preset: cloned,
        config: themeConfig,
        base,
      },
      activeView: 'editor',
      activeTab: 0,
      acTokens: [],
    }));

    usePreset(cloned);
    this.refreshACTokens();
    document.documentElement.style.fontSize = themeConfig.fontSize;
    void this.applyFont(themeConfig.fontFamily);
  }

  previewThemeFromPreset(name: string, preset: any, config: ThemeConfig): void {
    this.previewThemeName.set(name);
    this.previewFontFamily.set(resolveFontStack(config.fontFamily));
    this.previewFontSize.set(config.fontSize);
    usePreset(preset);
    document.documentElement.style.fontSize = STUDIO_FONT_SIZE;

    if (config.fontFamily !== 'system-ui' && config.fontFamily !== 'Inter var') {
      for (const weight of [400, 500, 600, 700]) {
        void this.loadFont(config.fontFamily, weight, false);
      }
    }
  }

  openCreateTheme(): void {
    this.designer.update((prev) => ({ ...prev, activeView: 'create' }));
  }

  async downloadTheme(): Promise<void> {
    const theme = this.designer().theme;
    if (!theme) {
      return;
    }

    const presetJson = this.serializePreset(theme.preset);
    const fileName = this.slugify(theme.name) + '-preset.ts';
    const origin =
      typeof window !== 'undefined' && window.location ? window.location.origin : '';
    const content = `/* eslint-disable */
// Generated by ${origin || 'Optimus UI Design'}
// Theme: ${theme.name}

export default ${presetJson} as const;
`;

    const blob = new Blob([content], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async applyFont(fontFamily: string): Promise<void> {
    document.body.style.fontFamily = resolveFontStack(fontFamily);
    if (fontFamily !== 'system-ui' && fontFamily !== 'Inter var') {
      await this.loadFont(fontFamily, 400);
      await this.loadFont(fontFamily, 500);
      await this.loadFont(fontFamily, 600);
      await this.loadFont(fontFamily, 700);
    }
  }

  async loadFont(
    fontFamily: string,
    weight: number,
    applyToBody = true,
  ): Promise<FontFace | undefined> {
    try {
      const fontFamilyPath = fontFamily.toLowerCase().replace(/\s+/g, '-');
      const fontUrl = `https://fonts.bunny.net/${fontFamilyPath}/files/${fontFamilyPath}-latin-${weight}-normal.woff2`;
      const font = new FontFace(fontFamily, `url(${fontUrl})`, {
        weight: weight.toString(),
        style: 'normal',
      });

      const loadedFont = await font.load();
      document.fonts.add(loadedFont);
      if (applyToBody) {
        document.body.style.fontFamily = `"${fontFamily}", sans-serif`;
      }
      return loadedFont;
    } catch {
      // silent fail -- some fonts may not have all weights
      return undefined;
    }
  }

  encodeTheme(): string {
    const theme = this.designer().theme;
    if (!theme) {
      return '';
    }
    const payload = { name: theme.name, preset: theme.preset, config: theme.config };
    const json = JSON.stringify(payload, (_key, value) => {
      if (typeof value === 'function') {
        return undefined;
      }
      return value as unknown;
    });
    return btoa(unescape(encodeURIComponent(json)));
  }

  decodeTheme(base64: string): ThemeState | null {
    try {
      const json = decodeURIComponent(escape(atob(base64)));
      const payload = JSON.parse(json) as Record<string, unknown>;
      if (!payload['preset'] || typeof payload['preset'] !== 'object') {
        return null;
      }
      return {
        name: (payload['name'] as string) || 'Imported Theme',
        preset: payload['preset'],
        config: (payload['config'] as ThemeConfig) || { fontSize: '14px', fontFamily: 'Inter var' },
      };
    } catch {
      return null;
    }
  }

  /**
   * Accepts any of the formats the app can produce:
   *  - a base64 token (`{name, preset, config}` JSON),
   *  - raw JSON (a full payload, or a bare preset object),
   *  - a downloaded `.ts` preset file (`export default { … } as const;`).
   */
  parseThemeInput(raw: string): ThemeState | null {
    const value = raw.trim();
    if (!value) return null;

    const fallbackConfig: ThemeConfig = { fontSize: '14px', fontFamily: 'Inter var' };
    const fromPreset = (preset: unknown, name?: string): ThemeState | null => {
      if (!preset || typeof preset !== 'object' || Array.isArray(preset)) return null;
      return { name: name?.trim() || 'Imported Theme', preset, config: fallbackConfig };
    };

    // 1. base64 token
    const decoded = this.decodeTheme(value);
    if (decoded) return decoded;

    // 2. downloaded .ts preset file
    if (/export\s+default\s*\{/.test(value)) {
      const start = value.indexOf('{', value.indexOf('export'));
      const end = value.lastIndexOf('}');
      if (start !== -1 && end > start) {
        try {
          const preset = JSON.parse(value.slice(start, end + 1)) as unknown;
          const nameMatch = value.match(/\/\/\s*Theme:\s*(.+)/);
          return fromPreset(preset, nameMatch?.[1]);
        } catch {
          /* fall through */
        }
      }
    }

    // 3. raw JSON — either a {name, preset, config} payload or a bare preset
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object') {
        if (parsed['preset'] && typeof parsed['preset'] === 'object') {
          return {
            name: (parsed['name'] as string) || 'Imported Theme',
            preset: parsed['preset'],
            config: (parsed['config'] as ThemeConfig) || fallbackConfig,
          };
        }
        const presetKeys = Object.keys(parsed).filter((k) => k !== 'name' && k !== 'config');
        if (presetKeys.length > 0) {
          return fromPreset(parsed, parsed['name'] as string | undefined);
        }
      }
    } catch {
      /* not JSON */
    }

    return null;
  }

  importTheme(input: string): boolean {
    const theme = this.parseThemeInput(input);
    if (!theme) {
      return false;
    }
    this.applyImportedTheme(theme);
    return true;
  }

  async compressThemeForUrl(): Promise<string> {
    const theme = this.designer().theme;
    if (!theme) return '';
    const payload = { name: theme.name, preset: theme.preset, config: theme.config };
    const json = JSON.stringify(payload, (_key, value) =>
      typeof value === 'function' ? undefined : (value as unknown),
    );
    const bytes = new TextEncoder().encode(json);
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const compressed = await new Response(cs.readable).arrayBuffer();
    const binary = Array.from(new Uint8Array(compressed), (b) => String.fromCharCode(b)).join('');
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  async importThemeFromUrl(compressed: string): Promise<boolean> {
    const theme = await this.decompressThemeFromUrl(compressed);
    if (!theme) return false;
    this.applyImportedTheme(theme);
    return true;
  }

  private async decompressThemeFromUrl(urlSafe: string): Promise<ThemeState | null> {
    try {
      const base64 = urlSafe.replace(/-/g, '+').replace(/_/g, '/');
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      // Check gzip magic number (0x1F 0x8B) to avoid uncatchable DecompressionStream errors
      if (bytes.length < 2 || bytes[0] !== 0x1f || bytes[1] !== 0x8b) return null;
      const ds = new DecompressionStream('gzip');
      const writer = ds.writable.getWriter();
      writer.write(bytes);
      writer.close();
      const decompressed = await new Response(ds.readable).arrayBuffer();
      const json = new TextDecoder().decode(decompressed);
      const payload = JSON.parse(json) as Record<string, unknown>;
      if (!payload['preset'] || typeof payload['preset'] !== 'object') return null;
      return {
        name: (payload['name'] as string) || 'Imported Theme',
        preset: payload['preset'],
        config: (payload['config'] as ThemeConfig) || { fontSize: '14px', fontFamily: 'Inter var' },
      };
    } catch {
      return null;
    }
  }

  private applyImportedTheme(theme: ThemeState): void {
    this.designer.update((prev) => ({
      ...prev,
      theme,
      activeView: 'editor',
      activeTab: 0,
      acTokens: [],
    }));
    usePreset(theme.preset);
    this.refreshACTokens();
    document.documentElement.style.fontSize = theme.config.fontSize;
  }

  /**
   * Load a marketplace theme into the editor as the basis for a fork. Publishing
   * afterwards creates a new theme whose parent is this one.
   */
  applyMarketplaceTheme(theme: {
    id?: string;
    name: string;
    description?: string | null;
    base_preset?: BasePreset;
    preset: any;
    config?: Partial<ThemeConfig>;
  }): void {
    this.applyImportedTheme({
      name: theme.name || 'Imported Theme',
      description: theme.description ?? undefined,
      base: theme.base_preset ?? 'custom',
      parentId: theme.id,
      parentName: theme.name,
      preset: theme.preset,
      config: { fontSize: '14px', fontFamily: 'Inter var', ...theme.config },
    });
    void this.applyFont(this.designer().theme!.config.fontFamily);
  }

  /** Structured, function-free payload for POST /api/themes. */
  buildPublishPayload(name: string, description?: string, base?: BasePreset): PublishThemePayload | null {
    const theme = this.designer().theme;
    if (!theme) {
      return null;
    }
    const preset = JSON.parse(
      JSON.stringify(theme.preset, (_key, value) =>
        typeof value === 'function' ? undefined : (value as unknown),
      ),
    );
    return {
      name: (name || theme.name).trim(),
      description: description?.trim() || null,
      base_preset: base ?? theme.base ?? 'custom',
      preset,
      config: theme.config,
      parent_id: theme.parentId ?? null,
    };
  }

  markPublished(id: string): void {
    this.designer.update((prev) =>
      prev.theme ? { ...prev, theme: { ...prev.theme, publishedId: id } } : prev,
    );
  }

  private serializePreset(obj: unknown, indent = 2): string {
    return JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === 'function') {
          return undefined;
        }
        return value as unknown;
      },
      indent,
    );
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
