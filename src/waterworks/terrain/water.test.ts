import { describe, expect, it } from 'vitest';
import { WATER_STOPS, buildChannelRibbon, waterColor } from './water';
import { DENTIST_BASINS, DENTIST_CHANNELS, DENTIST_PADS } from '../content/layout';
import { carvedHeight } from './heightfield';

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
});

describe('buildChannelRibbon', () => {
  const cut = DENTIST_CHANNELS.find((c) => c.id === 'gated-reach')!;
  const height = (x: number, z: number) =>
    carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS, DENTIST_PADS);
  const ribbon = buildChannelRibbon(cut, height, 0.12);

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

  it('never stands above the ground beside it', () => {
    // Water above its own bank is the single most obvious wrongness available.
    for (let i = 0; i < ribbon.positions.length; i += 3) {
      const x = ribbon.positions[i];
      const y = ribbon.positions[i + 1];
      const z = ribbon.positions[i + 2];
      expect(y).toBeLessThanOrEqual(height(x, z) + 1e-6);
    }
  });

  it('carries a flow coordinate that increases downstream', () => {
    // Four floats per sample: [u, run] for each of the two bank vertices. The
    // run is what the ripple scrolls along, so it has to be monotonic or the
    // water would appear to change direction mid-channel.
    let prev = -Infinity;
    for (let i = 1; i < ribbon.uvs.length; i += 4) {
      expect(ribbon.uvs[i]).toBeGreaterThanOrEqual(prev);
      prev = ribbon.uvs[i];
    }
  });

  it('gives both banks of a sample the same flow coordinate', () => {
    // Otherwise the ripple would shear across the channel instead of running
    // down it.
    for (let i = 1; i + 2 < ribbon.uvs.length; i += 4) {
      expect(ribbon.uvs[i + 2]).toBeCloseTo(ribbon.uvs[i], 9);
    }
  });

  it('separates the two banks across the ribbon', () => {
    // u distinguishes left bank from right; if both were 0 the ripple would
    // have no cross-channel coordinate at all.
    expect(ribbon.uvs[0]).toBe(0);
    expect(ribbon.uvs[2]).toBe(1);
  });
});
