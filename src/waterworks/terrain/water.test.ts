import { describe, expect, it } from 'vitest';
import {
  WATER_STOPS,
  WATER_SURFACE,
  buildChannelRibbon,
  incisionRadius,
  waterColor,
  waterHalfWidth,
} from './water';
import { DENTIST_BASINS, DENTIST_CHANNELS, DENTIST_PADS } from '../content/layout';
import { carvedGround, carvedHeight, linearFromHex } from './heightfield';
import { distanceToPolyline } from './path';
import { WW_PALETTE } from '../tokens';

const luma = (c: [number, number, number]) => c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;

describe('waterColor', () => {
  it('pins the ends of the ramp', () => {
    expect(waterColor(0)).toEqual(WATER_STOPS[0].rgb);
    expect(waterColor(1)).toEqual(WATER_STOPS[WATER_STOPS.length - 1].rgb);
  });

  it('clamps outside 0..1 instead of extrapolating', () => {
    expect(waterColor(-3)).toEqual(waterColor(0));
    expect(waterColor(9)).toEqual(waterColor(1));
  });

  it('clears monotonically with descent', () => {
    // §7: the colour change with descent carries the whole refinement idea,
    // so a stretch that muddies again would be telling the wrong story.
    let prev = -Infinity;
    for (let t = 0; t <= 1; t += 0.05) {
      const l = luma(waterColor(t));
      expect(l).toBeGreaterThan(prev - 1e-9);
      prev = l;
    }
  });

  it('loses its ochre warmth as it clears', () => {
    const rills = waterColor(0);
    const pool = waterColor(1);
    expect(rills[0] - rills[2]).toBeGreaterThan(pool[0] - pool[2]);
  });

  it('is continuous across every stop', () => {
    for (const stop of WATER_STOPS) {
      const before = waterColor(Math.max(0, stop.at - 0.001));
      const after = waterColor(Math.min(1, stop.at + 0.001));
      for (let k = 0; k < 3; k++) expect(Math.abs(after[k] - before[k])).toBeLessThan(0.02);
    }
  });

  it('outreads the soil it runs through, at the clear end', () => {
    // §7 makes the colour grade the only chart in the piece. A ramp that is
    // monotonic but sits below its background is a chart drawn in a colour
    // you cannot see — which is what 0.130 → 0.232 against soil at 0.339 was.
    const soil = luma(linearFromHex(WW_PALETTE.soilDry));
    expect(luma(waterColor(1))).toBeGreaterThan(soil);
    // And the muddy end must still read as darker than the bank, or there is
    // no grade left to see.
    expect(luma(waterColor(0))).toBeLessThan(soil * 0.65);
    // ...but not so dark it stops being water. Without this floor a ramp
    // running to black satisfies every other assertion in this file: the
    // spread test stays satisfiable, and `loses its ochre warmth` compares
    // r - b relatively, which black passes too. That is precisely the
    // one-sided failure this suite exists to prevent.
    expect(luma(waterColor(0))).toBeGreaterThan(soil * 0.3);
  });

  it('keeps real ochre in the rills', () => {
    // Absolute, not relative. `loses its ochre warmth as it clears` only
    // compares the two ends against each other, so a fully desaturated ramp
    // passes it. The rills carry muddy water, and muddy water is warm.
    const rills = waterColor(0);
    expect(rills[0] - rills[2]).toBeGreaterThan(0.1);
  });

  it('spreads far enough across the ramp to be legible', () => {
    // Two-sided. Too narrow and the network reads as one flat tone; too wide
    // and the rills go to black while the pool blows out.
    const spread = luma(waterColor(1)) - luma(waterColor(0));
    expect(spread).toBeGreaterThan(0.18);
    expect(spread).toBeLessThan(0.4);
  });
});

describe('buildChannelRibbon', () => {
  const cut = DENTIST_CHANNELS.find((c) => c.id === 'gated-reach')!;
  const groundAt = (x: number, z: number) =>
    carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS, DENTIST_PADS);
  // Excavation only, no structure pads — see buildChannelRibbon's doc comment
  // for why the rim guard needs this rather than `groundAt`.
  const bankAt = (x: number, z: number) => carvedGround(x, z, DENTIST_CHANNELS, DENTIST_BASINS);
  const ribbon = buildChannelRibbon(cut, groundAt, bankAt);

  // A channel has no bank in two places, and in both the guard is correctly
  // inoperative: where it opens into a pond, and where it forks. Rim samples
  // there land inside the basin or inside the neighbouring cut, so "stay
  // below your bank" has nothing to bite on — and the water is under the pool
  // disc or in the fork regardless. Exposure is measured on the reaches that
  // do have banks, at a higher bar than a whole-channel average could carry.
  const insideBasin = (x: number, z: number) =>
    DENTIST_BASINS.some((b) => Math.hypot(x - b.center.x, z - b.center.z) <= b.radius);

  const atJunction = (cut: (typeof DENTIST_CHANNELS)[number], x: number, z: number) =>
    DENTIST_CHANNELS.some(
      (other) => other.id !== cut.id && distanceToPolyline(x, z, other.pts) <= other.halfWidth,
    );

  /**
   * The same two exclusions, applied at the centreline *and* at the two points
   * the rim guard actually samples — one cut half-width either side, on the
   * same normal `buildChannelRibbon` uses. A cross-section whose centreline is
   * in open ground can still have a rim sample sitting in a neighbouring cut,
   * and there the guard is as inoperative as if the centreline were.
   */
  const excludedSection = (cut: (typeof DENTIST_CHANNELS)[number], i: number) => {
    const n = cut.pts.length;
    const p = cut.pts[i];
    const prev = cut.pts[Math.max(0, i - 1)];
    const next = cut.pts[Math.min(n - 1, i + 1)];
    const dx = next.x - prev.x;
    const dz = next.z - prev.z;
    const len = Math.hypot(dx, dz) || 1;
    const nx = (-dz / len) * cut.halfWidth;
    const nz = (dx / len) * cut.halfWidth;
    return [
      [p.x, p.z],
      [p.x + nx, p.z + nz],
      [p.x - nx, p.z - nz],
    ].some(([x, z]) => insideBasin(x, z) || atJunction(cut, x, z));
  };

  it('emits two vertices per centreline sample', () => {
    expect(ribbon.positions.length).toBe(cut.pts.length * 2 * 3);
  });

  it('emits two triangles per segment', () => {
    expect(ribbon.indices.length).toBe((cut.pts.length - 1) * 6);
  });

  it('keeps every index in range', () => {
    const maxIndex = ribbon.positions.length / 3 - 1;
    for (const idx of ribbon.indices) expect(idx).toBeLessThanOrEqual(maxIndex);
  });

  it('sits inside the channel it fills, never wider', () => {
    for (let i = 0; i < ribbon.positions.length; i += 3) {
      const x = ribbon.positions[i];
      const z = ribbon.positions[i + 2];
      let nearest = Infinity;
      for (const p of cut.pts) nearest = Math.min(nearest, Math.hypot(x - p.x, z - p.z));
      expect(nearest).toBeLessThanOrEqual(cut.halfWidth + 1e-6);
    }
  });

  it('runs downhill from first sample to last', () => {
    const firstY = ribbon.positions[1];
    const lastY = ribbon.positions[ribbon.positions.length - 2];
    expect(lastY).toBeLessThan(firstY);
  });

  it('runs downhill step by step, not just end to end', () => {
    // Endpoint-only is the same shape of assertion as the one that let the
    // buried ribbon through: a wildly non-monotonic surface passes as long as
    // its two ends are ordered. Measured, six channels have steps rising by
    // up to 0.67 — all of them where the water sits on a pond floor and
    // climbs out of the mouth, which is inside the exclusions below and under
    // the pool disc regardless.
    //
    // The exclusion is applied at the rim samples as well as at the
    // centreline, because the rim samples are what the guard actually reads.
    // Where they land in a neighbouring cut the guard is inoperative for the
    // same reason `atJunction` exists — and that is not hypothetical: on
    // to-ga4 the two sections either side of client-gate-run's tail, 0.53
    // outside its cut, step up 0.117 while their bed rises only 0.034.
    //
    // What survives is the bed itself: 0.045 at rill-centre's head, where the
    // noise fade towards the tile boundary ramps in, and up to 0.039 on
    // to-meta, which climbs the valley's cross-slope faster than it falls down
    // the valley. The water follows the ground it lies in; the tolerance is
    // sized for that, not for anything the fill logic does.
    for (const c of DENTIST_CHANNELS) {
      const r = buildChannelRibbon(c, groundAt, bankAt);
      const n = c.pts.length;
      let counted = 0;
      for (let s = 1; s < n; s++) {
        if (excludedSection(c, s) || excludedSection(c, s - 1)) continue;
        counted++;
        const rise = r.positions[s * 6 + 1] - r.positions[(s - 1) * 6 + 1];
        expect(rise).toBeLessThan(0.05);
      }
      // Two-sided: the exclusion must not be allowed to excuse a whole
      // channel. If a filter can drop every awkward step, the bar above it
      // means nothing.
      expect(counted).toBeGreaterThan((n - 1) * 0.35);
    }
  });

  it('keeps every cross-section level', () => {
    // A water surface is level across its width. Sampling the bank height
    // per side tilted the ribbon on every cross slope.
    for (let i = 0; i < ribbon.positions.length; i += 6) {
      expect(ribbon.positions[i + 4]).toBeCloseTo(ribbon.positions[i + 1], 9);
    }
  });

  it('stands in its cut, neither buried nor overfilled', () => {
    // The regression this plan exists for, bounded from both sides. The old
    // code placed the surface below the lower of bed and bank, so all 62
    // vertices of this channel — and of the other ten — were underground by
    // 0.35 to 0.89 units, and the one-sided assertion that replaced this one
    // passed anyway.
    //
    // Lower bound: a direction-only check would pass on a one-micron film, so
    // the water has to be a real fraction of the cut deep. Upper bound: you
    // cannot fill a channel deeper than you dug it. Both are stated against
    // the cut's own depth rather than against nearby ground — on a cross
    // slope, water at this fill legitimately sits above the hillside a couple
    // of metres downslope, which is what a bank is for.
    let counted = 0;
    const total = ribbon.positions.length / 6;
    for (let s = 0; s < cut.pts.length; s++) {
      const p = cut.pts[s];
      const y = ribbon.positions[s * 6 + 1];
      // Each side searches for its own waterline, so the midpoint of the two
      // bank vertices is NOT the centreline. `cut.pts[s]` is the point the
      // ribbon itself sampled for `bed`, which makes this exact rather than
      // approximate.
      if (insideBasin(p.x, p.z) || atJunction(cut, p.x, p.z)) continue;
      counted++;
      const standing = y - groundAt(p.x, p.z);

      expect(standing).toBeGreaterThan(cut.depth * 0.4);
      expect(standing).toBeLessThanOrEqual(cut.depth + 1e-6);
    }
    // Two-sided: the exclusion must not be allowed to excuse the whole
    // channel. If a filter can drop every awkward sample, the bar above it
    // means nothing.
    expect(counted).toBeGreaterThan(total * 0.35);
  });

  it('shows water at the surface everywhere the channel has banks', () => {
    // The bug was uniform across all eleven cuts, so the guard has to be too.
    for (const c of DENTIST_CHANNELS) {
      const r = buildChannelRibbon(c, groundAt, bankAt);
      let exposed = 0;
      let counted = 0;
      let total = 0;
      for (let i = 0; i < r.positions.length; i += 3) {
        const x = r.positions[i];
        const y = r.positions[i + 1];
        const z = r.positions[i + 2];
        total++;
        if (insideBasin(x, z) || atJunction(c, x, z)) continue;
        counted++;
        if (y > groundAt(x, z)) exposed++;
      }
      // Two-sided: the exclusion must not be allowed to excuse a whole
      // channel. If a filter can drop every awkward sample, the bar above it
      // means nothing.
      expect(counted).toBeGreaterThan(total * 0.35);
      expect(exposed / counted).toBeGreaterThan(0.95);
    }
  });

  it('stands deep enough to see in every channel, not just the gated reach', () => {
    // The magnitude bar, applied across all eleven cuts. `shows water at the
    // surface everywhere the channel has banks` only asks that `y` beat the
    // ground, which a two-centimetre film satisfies — and a two-centimetre
    // film is exactly what the client-gate pad produced downstream of the
    // gate (0.020 on a 0.5-deep cut, 0.04 of its depth) while that suite
    // stayed green. Worse than invisible: below the terrain's own 0.4-unit
    // tessellation error, so it z-fought the ground it stood on.
    //
    // Stated as a fraction of each cut's own depth, because the eleven cuts
    // run 0.45 to 0.85 deep and one absolute number would be vacuous on the
    // gated reach and unreachable on a draw-off. Measured per-channel minima
    // run 0.28 (client-gate-run, where the pad flattens bed and rim together
    // so the level falls back to `bedClearance`) and 0.36 (to-meta, climbing
    // the valley's cross-slope) to 0.83; every other channel clears 0.63.
    for (const c of DENTIST_CHANNELS) {
      const r = buildChannelRibbon(c, groundAt, bankAt);
      let counted = 0;
      const total = c.pts.length;
      for (let s = 0; s < c.pts.length; s++) {
        const p = c.pts[s];
        if (insideBasin(p.x, p.z) || atJunction(c, p.x, p.z)) continue;
        counted++;
        const standing = r.positions[s * 6 + 1] - groundAt(p.x, p.z);
        expect(standing).toBeGreaterThan(c.depth * 0.25);
        expect(standing).toBeLessThanOrEqual(c.depth + 1e-6);
      }
      // Two-sided: the exclusion must not be allowed to excuse a whole
      // channel. If a filter can drop every awkward sample, the bar above it
      // means nothing.
      expect(counted).toBeGreaterThan(total * 0.35);
    }
  });

  it('carries a flow coordinate that increases downstream', () => {
    let prev = -Infinity;
    for (let i = 1; i < ribbon.uvs.length; i += 4) {
      expect(ribbon.uvs[i]).toBeGreaterThanOrEqual(prev);
      prev = ribbon.uvs[i];
    }
  });

  it('gives both banks of a sample the same flow coordinate', () => {
    for (let i = 1; i + 2 < ribbon.uvs.length; i += 4) {
      expect(ribbon.uvs[i + 2]).toBeCloseTo(ribbon.uvs[i], 9);
    }
  });

  it('separates the two banks across the ribbon', () => {
    expect(ribbon.uvs[0]).toBe(0);
    expect(ribbon.uvs[2]).toBe(1);
  });
});

describe('incisionRadius', () => {
  // The profile carvedGround cuts is depth * smoothstep(halfWidth, 0, d).
  // incisionRadius inverts it: given a fraction of full depth, how far out
  // from the centreline has the cut removed exactly that much?
  const profile = (d: number) => {
    const t = 1 - d;
    return t * t * (3 - 2 * t);
  };

  it('pins the ends of the profile', () => {
    // Full depth at the centreline, nothing at the lip.
    expect(incisionRadius(1)).toBeCloseTo(0, 6);
    expect(incisionRadius(0)).toBeCloseTo(1, 6);
  });

  it('round-trips against the profile it inverts', () => {
    for (const fraction of [0.05, 0.12, 0.15, 0.3, 0.5, 0.75, 0.9]) {
      expect(profile(incisionRadius(fraction))).toBeCloseTo(fraction, 5);
    }
  });

  it('moves outward as less depth is asked for', () => {
    // A shallower slice of the cut is a wider one. If this inverted, every
    // channel's water would be narrowest when the channel was fullest.
    let prev = Infinity;
    for (let f = 0.05; f <= 0.95; f += 0.05) {
      const r = incisionRadius(f);
      expect(r).toBeLessThan(prev);
      prev = r;
    }
  });

  it('clamps outside 0..1 instead of extrapolating', () => {
    expect(incisionRadius(-2)).toBeCloseTo(incisionRadius(0), 6);
    expect(incisionRadius(4)).toBeCloseTo(incisionRadius(1), 6);
  });
});

describe('waterHalfWidth', () => {
  const cut = DENTIST_CHANNELS.find((c) => c.id === 'gated-reach')!;

  it('stays inside the cut it fills', () => {
    expect(waterHalfWidth(cut)).toBeLessThan(cut.halfWidth);
  });

  it('is wide enough to see', () => {
    // Two-sided on purpose. The upper bound above stops it flooding the
    // hillside; without this lower bound a one-pixel thread would pass, and
    // a thread is what the overlook was already showing.
    expect(waterHalfWidth(cut)).toBeGreaterThan(cut.halfWidth * 0.6);
  });

  it('keeps the waterline search bracketed inside the analytic waterline', () => {
    // This constrains the *estimate*, not the drawn edge. The estimate sets
    // the search's inner bound and its fallback, so it has to sit inside the
    // analytic waterline — where the cut's own profile meets the fill level —
    // or a fallback would place the edge in the bank.
    //
    // The drawn edge is deliberately not held to this: the measured search
    // proved the analytic waterline over-conservative, and the shipped ribbon
    // on this channel runs 0.742 to 1.116 half-width against an analytic
    // waterline of 0.869. Lower bound because a search bracketed far too tight
    // would never widen at all.
    const waterline = cut.halfWidth * incisionRadius(1 - WATER_SURFACE.channelFill);
    expect(waterHalfWidth(cut)).toBeLessThan(waterline);
    expect(waterHalfWidth(cut)).toBeGreaterThan(waterline * 0.85);
  });
});
