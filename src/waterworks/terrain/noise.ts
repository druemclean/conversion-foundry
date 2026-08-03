/**
 * Integer lattice hash. Uses Math.imul throughout so the arithmetic stays in
 * 32-bit integer space — plain `*` would silently lose precision above 2^53
 * and make the terrain non-reproducible across machines.
 */
export function hash2(ix: number, iy: number, seed: number): number {
  let h =
    Math.imul(ix | 0, 374761393) +
    Math.imul(iy | 0, 668265263) +
    Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967296;
}

/** Hermite fade — zero first derivative at both ends, so cells don't crease. */
function fade(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Bilinear value noise over the integer lattice. */
export function valueNoise2D(x: number, y: number, seed = 0): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fade(x - x0);
  const fy = fade(y - y0);

  const n00 = hash2(x0, y0, seed);
  const n10 = hash2(x0 + 1, y0, seed);
  const n01 = hash2(x0, y0 + 1, seed);
  const n11 = hash2(x0 + 1, y0 + 1, seed);

  const top = n00 + (n10 - n00) * fx;
  const bottom = n01 + (n11 - n01) * fx;
  return top + (bottom - top) * fy;
}

/**
 * Fractal Brownian motion — octaves of value noise at doubling frequency and
 * halving amplitude, normalised back into [0, 1]. Each octave gets its own
 * seed offset so the lattices don't align and produce visible grid artefacts.
 */
export function fbm2D(x: number, y: number, seed = 0, octaves = 4): number {
  let sum = 0;
  let amplitude = 1;
  let frequency = 1;
  let norm = 0;

  for (let i = 0; i < octaves; i++) {
    sum += valueNoise2D(x * frequency, y * frequency, seed + i * 101) * amplitude;
    norm += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return sum / norm;
}
