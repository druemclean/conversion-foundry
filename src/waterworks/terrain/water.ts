import type { ChannelCut } from './types';

/**
 * Tuning for both water surfaces, kept here rather than in the R3F
 * components so a Node test can assert against them. `terrain/` imports no
 * Three.js — that boundary is why any of this is testable.
 */
export const WATER_SURFACE = {
  /** Fraction of a channel's depth that the running water fills. */
  channelFill: 0.85,
  /**
   * Pulls the ribbon inside the true waterline. The edge then always has
   * ground below it; drawn at the waterline exactly, it would graze the bank
   * and re-bury itself wherever the terrain's micro-noise ran high.
   */
  widthSafety: 0.94,
  /** Water may never come closer than this to the rim of its own cut. */
  freeboard: 0.05,
  /** Water always stands at least this far above its own bed. */
  bedClearance: 0.02,
  /** How far under the water plane a ribbon edge must sit to count as wet. */
  edgeClearance: 0.01,

  channelOpacity: 0.88,
  channelRoughness: 0.2,

  /**
   * Spec §5.4 puts the retention line and the silt below the waterline by
   * definition, and §10.1 needs both readable. At 0.9 the pools were opaque
   * and two of the four pool-wall marks rendered to nothing.
   */
  poolOpacity: 0.58,
  poolRoughness: 0.12,
} as const;

/**
 * Inverse of the cut profile `channelIncision` uses — `smoothstep(halfWidth,
 * 0, d)`, in units of half-width. Returns the distance from the centreline at
 * which the cut has removed `fraction` of its full depth: 0 at the deepest
 * point, 1 at the lip.
 *
 * Bisection rather than the closed form. Smoothstep's cubic inverts to a
 * trigonometric expression that is easy to get subtly wrong, and this runs
 * eleven times at module load — the clarity is worth more than the cycles.
 */
export function incisionRadius(fraction: number): number {
  const target = fraction < 0 ? 0 : fraction > 1 ? 1 : fraction;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    const t = 1 - mid;
    const profile = t * t * (3 - 2 * t);
    // The profile falls as `mid` grows, so still-too-deep means go outward.
    if (profile > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Half-width of the water surface in a filled channel, in world units. */
export function waterHalfWidth(cut: ChannelCut): number {
  return cut.halfWidth * incisionRadius(1 - WATER_SURFACE.channelFill) * WATER_SURFACE.widthSafety;
}

export type WaterStop = { at: number; rgb: [number, number, number] };

/**
 * Spec §7: water graded from muddy ochre at the rills, through olive, to
 * blue-grey and finally near-clear at the pool. Linear-space values, because
 * these are written into a vertex-colour attribute and Three reads those as
 * already linear — the same trap that made the terrain render too bright.
 *
 * The luminance spread is doing the actual work, and it is measured against
 * the *soil*, not against itself. A first pass ran 0.107 to 0.144: monotonic,
 * so the test passed, and far too narrow to see. The second ran 0.130 to
 * 0.232, which is a real spread but still sits under the 0.339 of the bank it
 * runs through — so every channel read as a dark line whatever its geometry.
 * The clear end now outreads the soil and the muddy end stays well under it,
 * which is what makes "clearer with descent" legible without a legend.
 */
export const WATER_STOPS: WaterStop[] = [
  { at: 0.0, rgb: [0.235, 0.15, 0.062] },
  { at: 0.38, rgb: [0.255, 0.245, 0.105] },
  { at: 0.72, rgb: [0.23, 0.31, 0.32] },
  { at: 1.0, rgb: [0.3, 0.395, 0.43] },
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
 * The largest radius on one side of a cross-section at which the ground is
 * still below the water plane — the real waterline, measured rather than
 * modelled.
 *
 * An analytic width cannot do this job. At this fill the idealised cut
 * profile leaves the ribbon edge only `depth * 0.056` below the bank — about
 * 0.03 units on these channels — while the terrain's micro-relief runs to
 * ±0.2. Measured, that made every edge a coin flip: mean margins of 0.01 to
 * 0.05 against tenth-percentile margins of -0.07 to -0.24, and half of all
 * ribbon edges came out buried in the bank they were supposed to sit inside.
 *
 * Searching the surface makes the edge correct by construction, and lets the
 * ribbon widen wherever the bank allows instead of holding one conservative
 * fraction everywhere. `waterHalfWidth` remains the model this searches
 * around: it sets both the outer bound and the fallback — the caller computes
 * it once per channel and passes it in as `estimate`, since it depends
 * only on `cut` and both side-searches would otherwise repeat the same
 * 48-iteration bisection.
 *
 * `nx`/`nz` arrive already signed for the side being measured.
 */
function waterlineRadius(
  cut: ChannelCut,
  px: number,
  pz: number,
  nx: number,
  nz: number,
  y: number,
  estimate: number,
  groundAt: (x: number, z: number) => number,
): number {
  const outer = Math.min(cut.halfWidth * 0.97, estimate * 1.4);
  const inner = estimate * 0.45;
  const steps = 14;

  // Walk inward from the outer bound and take the first radius that is
  // genuinely wet, so the ribbon is as wide as the ground actually permits.
  for (let i = 0; i <= steps; i++) {
    const r = outer + ((inner - outer) * i) / steps;
    if (groundAt(px + nx * r, pz + nz * r) < y - WATER_SURFACE.edgeClearance) return r;
  }
  return inner;
}

/**
 * A water surface following a channel centreline.
 *
 * Water is placed by *fill level*, not by offset from the ground: one level
 * `y` per cross-section at `bed + depth * channelFill`, clamped so it can
 * neither top the rim of its own cut nor sink back to the bed.
 *
 * The predecessor offset the surface below `min(bed, bank)`, which put all
 * eleven channels underground — mean burial 0.42 units — and what reached the
 * screen was the buried ribbon z-fighting through a terrain tessellated at
 * 0.4. Both bank vertices now share one `y`, because a water surface is level
 * across its width and per-bank sampling tilted it on every cross slope.
 *
 * Two samplers, not one, because they answer different questions:
 * - `groundAt` is the real rendered surface — pads included — and is what the
 *   water actually rests on (`bed`).
 * - `bankAt` is the excavated ground *without* structure pads, and is what the
 *   rim guard checks against. A pad is a levelled building platform:
 *   `resolvePads` sets `pad.level = carvedGround(centre)`, which for a pad
 *   sitting on a channel centreline is the channel bed itself, and every pad's
 *   footprint is wider than the cut it sits on. Guarding against `groundAt`
 *   at the rim would read that flattened bed back at the rim sample and
 *   conclude "no banks here" at exactly the four places a viewer looks
 *   hardest — the intake weir, both sluice gates, and the division lip —
 *   pinning the water to `bedClearance` right at each structure. `bankAt`
 *   still respects real excavation, so junction cuts and basin mouths still
 *   lower the guard correctly; it just isn't fooled by a building sitting on
 *   top of the ground.
 *
 * Returns typed arrays rather than geometry so this stays testable in Node.
 */
export function buildChannelRibbon(
  cut: ChannelCut,
  groundAt: (x: number, z: number) => number,
  bankAt: (x: number, z: number) => number,
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

  // Depends only on `cut`, so hoisted out of the per-side, per-cross-section
  // calls into `waterlineRadius` below instead of recomputing it — each call
  // runs a 48-iteration bisection.
  const halfWidthEstimate = waterHalfWidth(cut);

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
    const bed = groundAt(p.x, p.z);

    // The rim is sampled at the cut's full half-width, where the incision
    // profile has returned to grade. Sampling at the ribbon's edge instead
    // would read ground that is below the water by design and drag the
    // surface straight back down to the bed. Sampled against `bankAt`
    // (excavation only, no pads) — see the doc comment above.
    const rimA = bankAt(p.x + nx * cut.halfWidth, p.z + nz * cut.halfWidth);
    const rimB = bankAt(p.x - nx * cut.halfWidth, p.z - nz * cut.halfWidth);
    const guard = Math.min(rimA, rimB) - WATER_SURFACE.freeboard;
    // The bed clearance wins over the rim guard, which matters at a channel
    // mouth: there the rim samples land inside the pond and sit below the
    // channel bed, and obeying them would bury the last few metres.
    const y = Math.max(
      bed + WATER_SURFACE.bedClearance,
      Math.min(bed + cut.depth * WATER_SURFACE.channelFill, guard),
    );

    for (let side = 0; side < 2; side++) {
      const sign = side === 0 ? -1 : 1;
      // Each side finds its own waterline: on a cross slope the two banks are
      // at different heights, so a single shared half-width would bury one
      // edge to keep the other wet. The surface stays level regardless — `y`
      // is computed once per cross-section, above.
      const r = waterlineRadius(cut, p.x, p.z, nx * sign, nz * sign, y, halfWidthEstimate, groundAt);
      const x = p.x + nx * sign * r;
      const z = p.z + nz * sign * r;

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
