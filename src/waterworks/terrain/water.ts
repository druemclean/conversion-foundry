import type { ChannelCut } from './types';

export type WaterStop = { at: number; rgb: [number, number, number] };

/**
 * Spec §7: water graded from muddy ochre at the rills, through olive, to
 * blue-grey and finally near-clear at the pool. Linear-space values, because
 * these are written into a vertex-colour attribute and Three reads those as
 * already linear — the same trap that made the terrain render too bright.
 *
 * The luminance spread across the ramp is doing the actual work. A first pass
 * ran 0.107 to 0.144, which is monotonic — the test passed — but far too
 * narrow to see: the whole network read as uniformly dark and the grade,
 * which §7 makes the only chart in the piece, said nothing. Roughly doubling
 * the top end is what makes "clearer with descent" legible without a legend.
 */
export const WATER_STOPS: WaterStop[] = [
  { at: 0.0, rgb: [0.19, 0.12, 0.052] },
  { at: 0.38, rgb: [0.165, 0.155, 0.07] },
  { at: 0.72, rgb: [0.13, 0.18, 0.185] },
  { at: 1.0, rgb: [0.175, 0.245, 0.27] },
];

/** Water colour at flow position `t`, clamped at both ends. */
export function waterColor(t: number): [number, number, number] {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  if (c <= WATER_STOPS[0].at) return WATER_STOPS[0].rgb;

  for (let i = 1; i < WATER_STOPS.length; i++) {
    const a = WATER_STOPS[i - 1];
    const b = WATER_STOPS[i];
    if (c <= b.at) {
      const k = (c - a.at) / (b.at - a.at);
      return [
        a.rgb[0] + (b.rgb[0] - a.rgb[0]) * k,
        a.rgb[1] + (b.rgb[1] - a.rgb[1]) * k,
        a.rgb[2] + (b.rgb[2] - a.rgb[2]) * k,
      ];
    }
  }
  return WATER_STOPS[WATER_STOPS.length - 1].rgb;
}

/**
 * A water surface following a channel centreline.
 *
 * `inset` lifts the surface off the channel bed. The bed is the deepest point
 * of the cut, so the surface is placed relative to the *bank* height at each
 * side sample and then lowered — water that stands proud of its own bank is
 * the most obvious wrongness available, and the test asserts it cannot.
 *
 * Returns typed arrays rather than geometry so this stays testable in Node.
 */
export function buildChannelRibbon(
  cut: ChannelCut,
  height: (x: number, z: number) => number,
  inset: number,
): {
  positions: Float32Array;
  uvs: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
} {
  const n = cut.pts.length;
  const positions = new Float32Array(n * 2 * 3);
  const uvs = new Float32Array(n * 2 * 2);
  const colors = new Float32Array(n * 2 * 3);
  const indices = new Uint32Array((n - 1) * 6);

  const halfWidth = cut.halfWidth * 0.72;
  let run = 0;

  for (let i = 0; i < n; i++) {
    const p = cut.pts[i];
    const prev = cut.pts[Math.max(0, i - 1)];
    const next = cut.pts[Math.min(n - 1, i + 1)];
    if (i > 0) run += Math.hypot(p.x - prev.x, p.z - prev.z);

    const dx = next.x - prev.x;
    const dz = next.z - prev.z;
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len;
    const nz = dx / len;

    const t = cut.flowFrom + (cut.flowTo - cut.flowFrom) * (n === 1 ? 0 : i / (n - 1));
    const rgb = waterColor(t);
    const bed = height(p.x, p.z);

    for (let side = 0; side < 2; side++) {
      const sign = side === 0 ? -1 : 1;
      const x = p.x + nx * sign * halfWidth;
      const z = p.z + nz * sign * halfWidth;
      // Sit below whichever is lower, the bed at centre or the bank here, so
      // the surface can never break through the ground on a cross slope.
      const y = Math.min(bed, height(x, z)) - inset;

      const v = (i * 2 + side) * 3;
      positions[v] = x;
      positions[v + 1] = y;
      positions[v + 2] = z;
      colors[v] = rgb[0];
      colors[v + 1] = rgb[1];
      colors[v + 2] = rgb[2];

      const u = (i * 2 + side) * 2;
      uvs[u] = side;
      uvs[u + 1] = run;
    }
  }

  let k = 0;
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices[k++] = a;
    indices[k++] = c;
    indices[k++] = b;
    indices[k++] = b;
    indices[k++] = c;
    indices[k++] = d;
  }

  return { positions, uvs, colors, indices };
}
