import type { BasinSpec, ChannelCut } from '../content/layout';
import { WW_PALETTE } from '../tokens';
import { fbm2D } from './noise';
import { distanceToPolyline } from './path';

export const TERRAIN = {
  xMin: -30,
  xMax: 30,
  zMin: -40,
  zMax: 40,
  /** World units per grid cell. 0.4 gives ~30k vertices — cheap, and fine
   *  enough that a 1.1-unit-wide channel cut still reads as a cut. */
  res: 0.4,
  ridgeHeight: 13,
  outfallHeight: 0,
  seed: 20260803,
} as const;

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Standard smoothstep. Tolerates edge0 > edge1, which gives an inward ramp. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Strictly decreasing fall from the ridge at zMin to the outfall at zMax.
 * Exponent above 1 puts the steep ground at the top and a gentler working
 * bench through the middle, where the headworks sits.
 */
export function baseFall(z: number): number {
  const t = clamp01((z - TERRAIN.zMin) / (TERRAIN.zMax - TERRAIN.zMin));
  const shaped = 1 - Math.pow(1 - t, 1.6);
  return TERRAIN.ridgeHeight + (TERRAIN.outfallHeight - TERRAIN.ridgeHeight) * shaped;
}

/** Valley walls, so the hillside reads as a catchment rather than a ramp. */
export function crossSlope(x: number): number {
  return Math.pow(Math.abs(x) / TERRAIN.xMax, 2.2) * 7;
}

/** Undisturbed ground — before anything was cut into it. */
export function surfaceHeight(x: number, z: number): number {
  const macro = fbm2D(x * 0.035, z * 0.035, TERRAIN.seed, 4);
  const micro = fbm2D(x * 0.22, z * 0.22, TERRAIN.seed + 7, 3);
  return baseFall(z) + crossSlope(x) + (macro - 0.5) * 3.2 + (micro - 0.5) * 0.45;
}

/**
 * Ground after the basins were dug and the channels cut. Both basin and
 * channel incisions are subtracted from undisturbed grade; the order between
 * the two loops doesn't affect the result, since neither term reads the
 * running height `h` — each only depends on (x, z) and static geometry.
 */
export function carvedHeight(
  x: number,
  z: number,
  cuts: ChannelCut[],
  basins: BasinSpec[],
): number {
  let h = surfaceHeight(x, z);

  for (const basin of basins) {
    const d = Math.hypot(x - basin.center.x, z - basin.center.z);
    h -= basin.depth * smoothstep(basin.radius, basin.radius - basin.rimWidth, d);
  }

  for (const cut of cuts) {
    const d = distanceToPolyline(x, z, cut.pts);
    if (d > cut.halfWidth) continue;
    h -= cut.depth * smoothstep(cut.halfWidth, 0, d);
  }

  return h;
}

/**
 * Sample the height function onto a regular XZ grid. Returns raw typed arrays
 * rather than a BufferGeometry so this stays testable without a GL context.
 */
export function buildTerrainGrid(height: (x: number, z: number) => number): {
  positions: Float32Array;
  indices: Uint32Array;
  nx: number;
  nz: number;
} {
  const nx = Math.round((TERRAIN.xMax - TERRAIN.xMin) / TERRAIN.res) + 1;
  const nz = Math.round((TERRAIN.zMax - TERRAIN.zMin) / TERRAIN.res) + 1;

  const positions = new Float32Array(nx * nz * 3);
  const indices = new Uint32Array((nx - 1) * (nz - 1) * 6);

  let p = 0;
  for (let iz = 0; iz < nz; iz++) {
    const z = TERRAIN.zMin + iz * TERRAIN.res;
    for (let ix = 0; ix < nx; ix++) {
      const x = TERRAIN.xMin + ix * TERRAIN.res;
      positions[p++] = x;
      positions[p++] = height(x, z);
      positions[p++] = z;
    }
  }

  let t = 0;
  for (let iz = 0; iz < nz - 1; iz++) {
    for (let ix = 0; ix < nx - 1; ix++) {
      const a = iz * nx + ix;
      const b = a + 1;
      const c = a + nx;
      const d = c + 1;
      indices[t++] = a;
      indices[t++] = c;
      indices[t++] = b;
      indices[t++] = b;
      indices[t++] = c;
      indices[t++] = d;
    }
  }

  return { positions, indices, nx, nz };
}

function lerp3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** sRGB → linear-sRGB transfer function, per IEC 61966-2-1. */
export function srgbToLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/** Decode a '#rrggbb' palette entry into a linear-space RGB triple. */
function linearFromHex(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [
    srgbToLinear(((n >> 16) & 255) / 255),
    srgbToLinear(((n >> 8) & 255) / 255),
    srgbToLinear((n & 255) / 255),
  ];
}

// Linear-space albedos, decoded from the sRGB palette. Three.js does not
// colour-manage raw vertex-colour attributes — it reads them as linear — so
// the decode has to happen here or the terrain renders too bright.
const SOIL_DRY = linearFromHex(WW_PALETTE.soilDry);
const SOIL_DAMP = linearFromHex(WW_PALETTE.soilDamp);
const SILT = linearFromHex(WW_PALETTE.silt);
const MOSS = linearFromHex(WW_PALETTE.moss);

/**
 * Per-vertex soil colour. Dampness is inferred from how far a vertex sits
 * below undisturbed grade, so channels and basins read as wet earth with no
 * texture and no second material. Moss speckles the dry ground above.
 */
export function buildTerrainColors(positions: Float32Array): Float32Array {
  const colors = new Float32Array(positions.length);

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    const cut = surfaceHeight(x, z) - y;
    const damp = clamp01(cut / 1.2);

    let rgb = lerp3(SOIL_DRY, SOIL_DAMP, damp);
    if (damp > 0.75) {
      rgb = lerp3(rgb, SILT, smoothstep(0.75, 1, damp));
    } else {
      const mossiness = clamp01((fbm2D(x * 0.19, z * 0.19, TERRAIN.seed + 31, 3) - 0.56) * 4);
      rgb = lerp3(rgb, MOSS, mossiness * (1 - damp) * 0.7);
    }

    colors[i] = rgb[0];
    colors[i + 1] = rgb[1];
    colors[i + 2] = rgb[2];
  }

  return colors;
}
