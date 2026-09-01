import Aura from '@openng/optimus-ui-themes/aura';

import { THEME_PRESETS, type ThemePresetName } from '../../theme-presets';
import type { BasePreset } from '../../core/marketplace.models';

/**
 * The handful of resolved values a {@link ThemePreview} needs to paint a
 * faithful little mock-up of a marketplace theme without applying it globally.
 */
export interface ThemePreviewTokens {
  primary: string;
  primaryContrast: string;
  primaryHover: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  fieldBackground: string;
  fieldBorder: string;
  radius: string;
  cardRadius: string;
}

type Dict = Record<string, unknown>;

/** Aura-flavoured fallbacks, used when a preset omits a token entirely. */
const LIGHT_DEFAULTS: ThemePreviewTokens = {
  primary: '#10b981',
  primaryContrast: '#ffffff',
  primaryHover: '#059669',
  surface: '#ffffff',
  surfaceMuted: '#f1f5f9',
  border: '#e2e8f0',
  text: '#334155',
  textMuted: '#64748b',
  fieldBackground: '#ffffff',
  fieldBorder: '#cbd5e1',
  radius: '6px',
  cardRadius: '8px',
};

const DARK_DEFAULTS: ThemePreviewTokens = {
  primary: '#34d399',
  primaryContrast: '#0f172a',
  primaryHover: '#6ee7b7',
  surface: '#0f172a',
  surfaceMuted: '#1e293b',
  border: '#1e293b',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  fieldBackground: '#0f172a',
  fieldBorder: '#334155',
  radius: '6px',
  cardRadius: '8px',
};

function isPlainObject(value: unknown): value is Dict {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Deep-merge `over` onto `base`; scalars and arrays from `over` win. */
function deepMerge(base: unknown, over: unknown): unknown {
  if (over === undefined || over === null) return base;
  if (!isPlainObject(base) || !isPlainObject(over)) return over;
  const out: Dict = { ...base };
  for (const key of Object.keys(over)) {
    out[key] = deepMerge(base[key], over[key]);
  }
  return out;
}

/** camelCase a run of dot-path segments: `['border','radius']` -> `borderRadius`. */
function camelKey(segments: string[]): string {
  return segments
    .map((s, i) => (i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)))
    .join('');
}

/**
 * Walk `root` following `segments`, greedily collapsing leading segments into a
 * camelCase key so token dot-paths (`border.radius.md`) hit real object keys
 * (`borderRadius.md`).
 */
function walk(root: unknown, segments: string[]): unknown {
  let current: unknown = root;
  let i = 0;
  while (i < segments.length) {
    if (!isPlainObject(current)) return undefined;
    let matched = false;
    for (let j = segments.length; j > i; j--) {
      const key = camelKey(segments.slice(i, j));
      if (key in current) {
        current = current[key];
        i = j;
        matched = true;
        break;
      }
    }
    if (!matched) return undefined;
  }
  return current;
}

/**
 * Resolve a preset value that may be a literal (`#fff`, `oklch(...)`) or one or
 * more nested `{token.path}` references, looking through the primitive palette,
 * the active colour scheme, then the semantic layer.
 */
function resolveValue(
  value: unknown,
  merged: Dict,
  scheme: 'light' | 'dark',
  seen = new Set<string>(),
): string | undefined {
  if (typeof value !== 'string') return undefined;
  const token = value.trim();
  if (!token) return undefined;
  if (!(token.startsWith('{') && token.endsWith('}'))) {
    // A literal — but reject leftover unresolved refs embedded in it.
    return token.includes('{') ? undefined : token;
  }
  if (seen.has(token)) return undefined;
  seen.add(token);

  const segments = token.slice(1, -1).split('.');
  const semantic = merged['semantic'] as Dict | undefined;
  const colorScheme = semantic?.['colorScheme'] as Dict | undefined;
  const roots: unknown[] = [
    merged['primitive'],
    colorScheme?.[scheme],
    semantic,
  ];
  for (const root of roots) {
    const hit = walk(root, segments);
    if (hit !== undefined) {
      return resolveValue(hit, merged, scheme, seen);
    }
  }
  return undefined;
}

function basePresetFor(base: BasePreset | undefined): unknown {
  if (base && base !== 'custom' && base in THEME_PRESETS) {
    return THEME_PRESETS[base as ThemePresetName];
  }
  return Aura;
}

/**
 * Distil a marketplace preset down to the values needed for a static preview
 * card. Merges the named base preset underneath so partially-overridden themes
 * still resolve, and never throws — missing tokens fall back to sane defaults.
 */
export function resolveThemePreview(
  preset: Record<string, unknown> | null | undefined,
  base: BasePreset | undefined,
  scheme: 'light' | 'dark' = 'light',
): ThemePreviewTokens {
  const defaults = scheme === 'dark' ? DARK_DEFAULTS : LIGHT_DEFAULTS;
  let merged: Dict;
  try {
    merged = deepMerge(basePresetFor(base), preset ?? {}) as Dict;
  } catch {
    return { ...defaults };
  }

  const semantic = (merged['semantic'] as Dict | undefined) ?? {};
  const colorScheme = (semantic['colorScheme'] as Dict | undefined) ?? {};
  const activeScheme = (colorScheme[scheme] as Dict | undefined) ?? {};

  const fromScheme = (path: string): string | undefined =>
    resolveValue(walk(activeScheme, path.split('.')), merged, scheme);

  const pick = (value: string | undefined, fallback: string): string =>
    value && value.length > 0 ? value : fallback;

  return {
    primary: pick(fromScheme('primary.color'), defaults.primary),
    primaryContrast: pick(fromScheme('primary.contrastColor'), defaults.primaryContrast),
    primaryHover: pick(fromScheme('primary.hoverColor'), defaults.primaryHover),
    surface: pick(fromScheme('content.background') ?? fromScheme('surface.0'), defaults.surface),
    surfaceMuted: pick(
      fromScheme('content.hoverBackground') ?? fromScheme('surface.100'),
      defaults.surfaceMuted,
    ),
    border: pick(
      fromScheme('content.borderColor') ?? fromScheme('surface.200'),
      defaults.border,
    ),
    text: pick(fromScheme('text.color'), defaults.text),
    textMuted: pick(fromScheme('text.mutedColor'), defaults.textMuted),
    fieldBackground: pick(fromScheme('formField.background'), defaults.fieldBackground),
    fieldBorder: pick(fromScheme('formField.borderColor'), defaults.fieldBorder),
    radius: pick(
      resolveValue(walk(semantic, ['formField', 'borderRadius']), merged, scheme),
      defaults.radius,
    ),
    cardRadius: pick(
      resolveValue(walk(merged['primitive'], ['borderRadius', 'lg']), merged, scheme),
      defaults.cardRadius,
    ),
  };
}
