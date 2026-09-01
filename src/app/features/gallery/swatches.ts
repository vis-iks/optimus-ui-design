const COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|oklch\()/i;

function isColor(value: unknown): value is string {
  return typeof value === 'string' && COLOR_RE.test(value.trim());
}

function collect(node: unknown, out: string[], seen: Set<string>): void {
  if (out.length >= 24) return;
  if (isColor(node)) {
    const c = node.trim();
    if (!seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
    return;
  }
  if (node && typeof node === 'object') {
    for (const value of Object.values(node as Record<string, unknown>)) {
      collect(value, out, seen);
    }
  }
}

/**
 * Pull a short strip of representative colors out of a PrimeNG preset for a
 * lightweight card preview. Prefers the primitive palette ramps, then anything
 * else concrete. Token references like `{blue.500}` are ignored (kept cheap).
 */
export function extractSwatches(preset: Record<string, unknown> | null | undefined, max = 6): string[] {
  if (!preset) return [];
  const out: string[] = [];
  const seen = new Set<string>();

  const primitive = preset['primitive'];
  if (primitive) collect(primitive, out, seen);
  if (out.length < max) collect(preset['semantic'], out, seen);
  if (out.length < max) collect(preset, out, seen);

  // Spread the picks across the collected range so the strip isn't 6 near-identical greys.
  if (out.length <= max) return out;
  const step = out.length / max;
  return Array.from({ length: max }, (_, i) => out[Math.floor(i * step)]);
}
