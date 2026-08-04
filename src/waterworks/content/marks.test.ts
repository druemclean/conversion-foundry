import { describe, expect, it } from 'vitest';
import {
  DENTIST_BASINS,
  DENTIST_CHANNELS,
  RETENTION_STAIN_HEIGHT,
  basinWallRadius,
} from './layout';
import { WW_PALETTE } from '../tokens';
import { carvedGround, linearFromHex } from '../terrain/heightfield';
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

  it('puts the retention band on the wall, not hanging in open water', () => {
    // Two-sided. The band must sit against the stone it marks: too far in and
    // it is a bright hoop suspended in the pool (§10.1's "horizontal thing at
    // a height" collapse); too far out and it is buried in the bank.
    //
    // Judged over bearings, not along one. The band is a ring, so what matters
    // is that it meets the wall around most of its circumference — and a
    // single probe cannot tell you that, because the channels entering and
    // leaving each basin breach the rim and send that bearing's reading
    // anywhere. Sampling +x alone is also circular: it is the bearing the
    // old implementation searched.
    for (const basin of DENTIST_BASINS) {
      const drawn = basinWallRadius(basin, basin.retentionFrac);
      const floor = carvedGround(basin.center.x, basin.center.z, DENTIST_CHANNELS, DENTIST_BASINS);
      const target = floor + basin.depth * basin.retentionFrac;

      const errors: number[] = [];
      for (let k = 0; k < 24; k++) {
        const angle = (k / 24) * Math.PI * 2;
        const h = carvedGround(
          basin.center.x + Math.cos(angle) * drawn,
          basin.center.z + Math.sin(angle) * drawn,
          DENTIST_CHANNELS,
          DENTIST_BASINS,
        );
        errors.push(Math.abs(h - target));
      }
      errors.sort((p, q) => p - q);

      // Absolute sanity bound. It is loose on purpose: a circular band at one
      // radius cannot sit flush on a wall whose height varies with bearing,
      // and around these basins the surrounding grade varies by more than the
      // band is tall. Median error by basin is GA4 0.180, Ads 0.143, Meta
      // 0.357, final 0.044 — Meta is the worst because its ground is the most
      // irregular, and no choice of radius fixes that.
      expect(errors[12]).toBeLessThan(0.45);

      // The assertion that actually earns its place: measuring the wall must
      // never be materially worse than the straight-line model it replaced.
      // That model assumed the wall climbs linearly from floor to rim, but
      // `carvedGround` blends the floor in with a smoothstep — worth 0.19 on
      // the final pool, most of a band height. Without this bound the search
      // could silently degrade back past the model and still look measured.
      const linear = basin.radius - basin.rimWidth + basin.rimWidth * basin.retentionFrac;
      const modelErrors: number[] = [];
      for (let k = 0; k < 24; k++) {
        const angle = (k / 24) * Math.PI * 2;
        const h = carvedGround(
          basin.center.x + Math.cos(angle) * linear,
          basin.center.z + Math.sin(angle) * linear,
          DENTIST_CHANNELS,
          DENTIST_BASINS,
        );
        modelErrors.push(Math.abs(h - target));
      }
      modelErrors.sort((p, q) => p - q);
      // Margin, not equality: the tightest basin (Ads) sits 0.016 the good
      // side of the model, and the terrain underneath is still being worked
      // on. A bound this close to zero would flake on unrelated changes
      // while catching nothing a 0.05 bound misses.
      expect(errors[12]).toBeLessThan(modelErrors[12] + 0.05);
      // And it lands on the sloping rim, not on the flat floor inside it nor
      // out on the hillside beyond the lip.
      expect(drawn).toBeGreaterThan(basin.radius - basin.rimWidth);
      expect(drawn).toBeLessThan(basin.radius);
    }
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
