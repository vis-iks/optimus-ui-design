import Aura from '@openng/optimus-ui-themes/aura';
import Lara from '@openng/optimus-ui-themes/lara';
import Nora from '@openng/optimus-ui-themes/nora';
import type { Preset } from '@openng/optimus-ui-themes/types';

import Material from './material-preset';

export const THEME_PRESET_OPTIONS = ['Aura', 'Material', 'Lara', 'Nora'] as const;
export type ThemePresetName = (typeof THEME_PRESET_OPTIONS)[number];

export const DEFAULT_THEME_PRESET: ThemePresetName = 'Material';

export const THEME_PRESETS: Record<ThemePresetName, Preset> = {
  Aura,
  Material,
  Lara,
  Nora,
};
