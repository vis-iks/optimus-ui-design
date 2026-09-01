import { resolveThemePreview } from './theme-preview-tokens';

describe('resolveThemePreview', () => {
  it('resolves nested {token} references through the primitive palette', () => {
    const tokens = resolveThemePreview(
      {
        primitive: { violet: { 500: '#8b5cf6', 600: '#7c3aed' } },
        semantic: {
          colorScheme: {
            light: {
              primary: { color: '{violet.500}', hoverColor: '{violet.600}' },
            },
          },
        },
      },
      'Aura',
    );

    expect(tokens.primary).toBe('#8b5cf6');
    expect(tokens.primaryHover).toBe('#7c3aed');
  });

  it('falls back to the named base preset for tokens the theme does not override', () => {
    const bare = resolveThemePreview({}, 'Aura');
    // Aura ships a concrete surface ramp and border radius.
    expect(bare.surface).toMatch(/^#|rgb|oklch/);
    expect(bare.radius).toMatch(/px|rem|em/);
    expect(bare.text).toBeTruthy();
  });

  it('produces a light surface for the light scheme and a dark one for dark', () => {
    const light = resolveThemePreview(null, 'custom', 'light');
    const dark = resolveThemePreview(null, 'custom', 'dark');
    // Rough luminance check: the light surface reads far brighter than the dark one.
    const bright = (hex: string) => parseInt(hex.replace('#', '').slice(0, 2), 16);
    expect(bright(light.surface)).toBeGreaterThan(bright(dark.surface) + 100);
  });

  it('reads dark-scheme tokens when scheme is "dark"', () => {
    const tokens = resolveThemePreview(
      {
        primitive: { sky: { 400: '#38bdf8' } },
        semantic: {
          colorScheme: {
            dark: { primary: { color: '{sky.400}' } },
            light: { primary: { color: '#000000' } },
          },
        },
      },
      'Aura',
      'dark',
    );
    expect(tokens.primary).toBe('#38bdf8');
  });

  it('never throws on a malformed preset', () => {
    expect(() =>
      resolveThemePreview({ semantic: 'nonsense' as unknown as Record<string, unknown> }, undefined),
    ).not.toThrow();
  });
});
