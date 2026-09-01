import { extractSwatches } from './swatches';

describe('extractSwatches', () => {
  it('returns an empty array for nullish input', () => {
    expect(extractSwatches(null)).toEqual([]);
    expect(extractSwatches(undefined)).toEqual([]);
    expect(extractSwatches({})).toEqual([]);
  });

  it('pulls concrete colors out of the primitive palette', () => {
    const preset = {
      primitive: {
        blue: { 50: '#eff6ff', 500: '#3b82f6', 900: '#1e3a8a' },
      },
    };
    expect(extractSwatches(preset)).toEqual(['#eff6ff', '#3b82f6', '#1e3a8a']);
  });

  it('ignores token references and non-color strings', () => {
    const preset = {
      primitive: { primary: '{blue.500}', name: 'My Theme', radius: '0.5rem' },
      semantic: { primary: { color: 'rgb(59, 130, 246)' } },
    };
    expect(extractSwatches(preset)).toEqual(['rgb(59, 130, 246)']);
  });

  it('caps the result at the requested maximum', () => {
    const ramp: Record<string, string> = {};
    for (let i = 0; i < 20; i++) ramp[i] = `#0000${(i % 10).toString().repeat(2)}`;
    const out = extractSwatches({ primitive: { grey: ramp } }, 6);
    expect(out).toHaveLength(6);
  });

  it('dedupes repeated colors', () => {
    const preset = {
      primitive: { a: '#111111', b: '#111111', c: '#222222' },
    };
    expect(extractSwatches(preset)).toEqual(['#111111', '#222222']);
  });
});
