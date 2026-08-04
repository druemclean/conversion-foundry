import { describe, expect, it } from 'vitest';
import { DENTIST_BASINS, RETENTION_STAIN_HEIGHT } from './layout';
import { WW_PALETTE } from '../tokens';
import { linearFromHex } from '../terrain/heightfield';
import { WATER_SURFACE } from '../terrain/water';

const luma = (c: [number, number, number]) => c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
const linearLuma = (hex: string) => luma(linearFromHex(hex));

describe('the four pool-wall marks (spec §10.1)', () => {
  it('keeps every retention line below its waterline', () => {
    // Deliberate, and recorded here so nobody "fixes" the legibility problem
    // by lifting the band into the air. §5.4: the retention line is the
    // lowest point a new intake can be lowered to, which is underwater by
    // definition. Legibility is the water's job, not the line's.
    for (const basin of DENTIST_BASINS) {
      const waterline = basin.depth * basin.fillFrac;
      const stainTop = basin.depth * basin.retentionFrac + RETENTION_STAIN_HEIGHT / 2;
      expect(stainTop).toBeLessThan(waterline);
    }
  });

  it('keeps the retention line reachable through the water', () => {
    // Submerged is fine; invisible is not. If a pool were ever filled so far
    // above its retention line that no plausible clarity would show it, the
    // mark is decorative. Half the basin's depth is the working bound.
    for (const basin of DENTIST_BASINS) {
      const waterline = basin.depth * basin.fillFrac;
      const stainTop = basin.depth * basin.retentionFrac + RETENTION_STAIN_HEIGHT / 2;
      expect(waterline - stainTop).toBeLessThan(basin.depth * 0.5);
    }
  });

  it('keeps GA4 the deepest reach and Meta the shallowest', () => {
    // §10.1: GA4's retention line is lowest on the wall, Meta's highest —
    // that ordering IS the lesson of §5.4, that some things you can rebuild
    // later and some you cannot. Guarded because the tuning in this task
    // moves GA4's line, and a tuning pass must not quietly invert the point.
    const frac = (id: string) => DENTIST_BASINS.find((b) => b.id === id)!.retentionFrac;
    expect(frac('ga4')).toBeLessThan(frac('ads'));
    expect(frac('ads')).toBeLessThan(frac('meta'));
  });

  it('makes the retention line a different tone from the stone it marks', () => {
    // §10.1: the four marks survive only by differing in kind. At #5f5344 the
    // stain sat at 0.108 against silt at 0.106 — the same tone, so through
    // clear water it would still have read as nothing.
    const stain = linearLuma(WW_PALETTE.retentionStain);
    for (const wall of [WW_PALETTE.silt, WW_PALETTE.soilDamp, WW_PALETTE.soilDry]) {
      expect(Math.abs(stain - linearLuma(wall))).toBeGreaterThan(0.12);
    }
  });

  it('reads the retention line as a light mark, not a dark one', () => {
    // Direction matters as well as magnitude: a mark darker than its
    // surroundings is indistinguishable from the shadow in the basin.
    expect(linearLuma(WW_PALETTE.retentionStain)).toBeGreaterThan(
      linearLuma(WW_PALETTE.silt),
    );
  });

  it('keeps the pools translucent enough to transmit a submerged mark', () => {
    // The upper bound is what this whole pass turns on. The lower bound stops
    // a later tuning pass dissolving the water surface altogether — the
    // surface is itself one of the four marks.
    expect(WATER_SURFACE.poolOpacity).toBeLessThan(0.7);
    expect(WATER_SURFACE.poolOpacity).toBeGreaterThan(0.35);
  });
});
