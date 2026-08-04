import { describe, expect, it } from 'vitest';
import {
  baseFall,
  buildTerrainColors,
  buildTerrainGrid,
  carvedGround,
  carvedHeight,
  channelIncision,
  clamp01,
  resolvePads,
  smoothstep,
  srgbToLinear,
  surfaceHeight,
  TERRAIN,
} from './heightfield';
import {
  DENTIST_BASINS,
  DENTIST_CHANNELS,
  DENTIST_PAD_SPECS,
  DENTIST_PADS,
  DIVISION_LIP,
  HEADWORKS,
} from '../content/layout';

describe('clamp01', () => {
  it('clamps both ends', () => {
    expect(clamp01(-3)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(9)).toBe(1);
  });
});

describe('smoothstep', () => {
  it('is 0 at edge0 and 1 at edge1', () => {
    expect(smoothstep(0, 10, 0)).toBeCloseTo(0, 9);
    expect(smoothstep(0, 10, 10)).toBeCloseTo(1, 9);
  });

  it('works with a descending edge pair', () => {
    expect(smoothstep(10, 0, 10)).toBeCloseTo(0, 9);
    expect(smoothstep(10, 0, 0)).toBeCloseTo(1, 9);
  });
});

describe('baseFall', () => {
  it('falls strictly from ridge to outfall', () => {
    let prev = Infinity;
    for (let z = TERRAIN.zMin; z < TERRAIN.zMax; z += 1) {
      const h = baseFall(z);
      expect(h).toBeLessThan(prev);
      prev = h;
    }
  });

  it('spans exactly the configured drop', () => {
    expect(baseFall(TERRAIN.zMin)).toBeCloseTo(TERRAIN.ridgeHeight, 6);
    expect(baseFall(TERRAIN.zMax)).toBeCloseTo(TERRAIN.outfallHeight, 6);
  });
});

describe('surfaceHeight', () => {
  it('is deterministic', () => {
    expect(surfaceHeight(3.5, -12.25)).toBe(surfaceHeight(3.5, -12.25));
  });

  it('descends grossly from the catchment to the outfall', () => {
    expect(surfaceHeight(0, TERRAIN.zMin)).toBeGreaterThan(surfaceHeight(0, TERRAIN.zMax) + 8);
  });

  it('rises towards the valley sides', () => {
    expect(surfaceHeight(28, 0)).toBeGreaterThan(surfaceHeight(0, 0));
  });
});

describe('carvedHeight', () => {
  it('leaves untouched ground alone', () => {
    const x = 26;
    const z = -34;
    expect(carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS)).toBeCloseTo(
      surfaceHeight(x, z),
      6,
    );
  });

  it('incises along a channel centreline', () => {
    const centre = DENTIST_CHANNELS[3].pts[Math.floor(DENTIST_CHANNELS[3].pts.length / 2)];
    const cut = carvedHeight(centre.x, centre.z, DENTIST_CHANNELS, DENTIST_BASINS);
    expect(cut).toBeLessThan(surfaceHeight(centre.x, centre.z) - 0.5);
  });

  it('hollows out each basin to roughly its stated depth', () => {
    for (const basin of DENTIST_BASINS) {
      const floor = carvedHeight(basin.center.x, basin.center.z, DENTIST_CHANNELS, DENTIST_BASINS);
      const grade = surfaceHeight(basin.center.x, basin.center.z);
      expect(grade - floor).toBeGreaterThan(basin.depth * 0.9);
      expect(grade - floor).toBeLessThan(basin.depth * 1.15);
    }
  });
});

describe('channelIncision', () => {
  it('takes the deepest overlapping cut, never their sum', () => {
    // Four cuts converge at the headworks and four leave the division lip.
    // Summing gave 2.35 and 2.95; the deepest single contributor is 0.85.
    for (const at of [HEADWORKS, DIVISION_LIP]) {
      const incision = channelIncision(at.x, at.z, DENTIST_CHANNELS);
      const deepestCut = Math.max(...DENTIST_CHANNELS.map((c) => c.depth));
      expect(incision).toBeLessThanOrEqual(deepestCut + 1e-9);
    }
  });

  it('still cuts to full depth on a lone channel centreline', () => {
    const rill = DENTIST_CHANNELS[0];
    const early = rill.pts[1];
    expect(channelIncision(early.x, early.z, [rill])).toBeCloseTo(rill.depth, 6);
  });
});

describe('carvedGround', () => {
  it('bounds every basin excavation on BOTH sides', () => {
    // The old assertion was a lower bound only, so a 3x-too-deep basin passed.
    for (const basin of DENTIST_BASINS) {
      const floor = carvedGround(basin.center.x, basin.center.z, DENTIST_CHANNELS, DENTIST_BASINS);
      const grade = surfaceHeight(basin.center.x, basin.center.z);
      expect(grade - floor).toBeGreaterThan(basin.depth * 0.9);
      expect(grade - floor).toBeLessThan(basin.depth * 1.15);
    }
  });

  it('gives every basin a flat floor', () => {
    for (const basin of DENTIST_BASINS) {
      const inner = basin.radius - basin.rimWidth;
      const heights: number[] = [];
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        for (const frac of [0, 0.45, 0.9]) {
          const x = basin.center.x + Math.cos(a) * inner * frac;
          const z = basin.center.z + Math.sin(a) * inner * frac;
          heights.push(carvedGround(x, z, DENTIST_CHANNELS, DENTIST_BASINS));
        }
      }
      const spread = Math.max(...heights) - Math.min(...heights);
      expect(spread).toBeLessThan(0.02);
    }
  });
});

describe('pads', () => {
  it('levels the ground flat across each pad', () => {
    for (const pad of DENTIST_PADS) {
      const heights: number[] = [];
      const cos = Math.cos(pad.angle);
      const sin = Math.sin(pad.angle);
      for (const fx of [-0.9, -0.45, 0, 0.45, 0.9]) {
        for (const fz of [-0.9, 0, 0.9]) {
          const lx = fx * pad.halfWidth;
          const lz = fz * pad.halfLength;
          // Forward Y-rotation back into world space.
          const x = pad.center.x + lx * cos + lz * sin;
          const z = pad.center.z - lx * sin + lz * cos;
          heights.push(carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS, DENTIST_PADS));
        }
      }
      const spread = Math.max(...heights) - Math.min(...heights);
      expect(spread).toBeLessThan(0.02);
    }
  });

  it('sets each pad level from the un-padded ground beneath it', () => {
    for (const pad of DENTIST_PADS) {
      expect(pad.level).toBeCloseTo(
        carvedGround(pad.center.x, pad.center.z, DENTIST_CHANNELS, DENTIST_BASINS),
        6,
      );
    }
  });

  it('leaves ground well outside every pad untouched', () => {
    const far = { x: 26, z: -34 };
    expect(carvedHeight(far.x, far.z, DENTIST_CHANNELS, DENTIST_BASINS, DENTIST_PADS)).toBeCloseTo(
      carvedGround(far.x, far.z, DENTIST_CHANNELS, DENTIST_BASINS),
      6,
    );
  });

  it('does not let one pad shift another pad level', () => {
    const reordered = resolvePads(
      [...DENTIST_PAD_SPECS].reverse(),
      DENTIST_CHANNELS,
      DENTIST_BASINS,
    );
    for (const pad of DENTIST_PADS) {
      const twin = reordered.find((p) => p.id === pad.id);
      expect(twin).toBeDefined();
      expect(twin!.level).toBeCloseTo(pad.level, 9);
    }
  });

  it('keeps every pad core clear of every other pad core', () => {
    // Two platforms at two different levels cannot both be true at a point.
    // The disc-shaped pads this replaced overlapped and un-levelled each other.
    for (const a of DENTIST_PADS) {
      for (const b of DENTIST_PADS) {
        if (a.id === b.id) continue;
        const gap = Math.hypot(a.center.x - b.center.x, a.center.z - b.center.z);
        const reachA = Math.hypot(a.halfWidth, a.halfLength) + a.blend;
        const reachB = Math.hypot(b.halfWidth, b.halfLength) + b.blend;
        expect(gap).toBeGreaterThan(Math.min(reachA, reachB));
      }
    }
  });
});

describe('buildTerrainGrid', () => {
  const flat = () => 2;
  const grid = buildTerrainGrid(flat);

  it('spans the configured bounds at the configured resolution', () => {
    expect(grid.nx).toBe(Math.round((TERRAIN.xMax - TERRAIN.xMin) / TERRAIN.res) + 1);
    expect(grid.nz).toBe(Math.round((TERRAIN.zMax - TERRAIN.zMin) / TERRAIN.res) + 1);
  });

  it('emits three floats per vertex', () => {
    expect(grid.positions.length).toBe(grid.nx * grid.nz * 3);
  });

  it('emits two triangles per cell', () => {
    expect(grid.indices.length).toBe((grid.nx - 1) * (grid.nz - 1) * 6);
  });

  it('samples the height function into Y', () => {
    for (let i = 1; i < grid.positions.length; i += 3) {
      expect(grid.positions[i]).toBeCloseTo(2, 6);
    }
  });

  it('keeps every index in range', () => {
    const maxIndex = grid.nx * grid.nz - 1;
    for (const idx of grid.indices) {
      expect(idx).toBeLessThanOrEqual(maxIndex);
    }
  });
});

describe('buildTerrainColors', () => {
  it('emits three floats per vertex', () => {
    const grid = buildTerrainGrid((x, z) => carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS));
    expect(buildTerrainColors(grid.positions).length).toBe(grid.positions.length);
  });

  it('darkens cut ground relative to untouched ground', () => {
    const height = (x: number, z: number) => carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS);
    const reach = DENTIST_CHANNELS[3].pts[Math.floor(DENTIST_CHANNELS[3].pts.length / 2)];

    const inCut = new Float32Array([reach.x, height(reach.x, reach.z), reach.z]);
    const onGrade = new Float32Array([26, height(26, -34), -34]);

    const cutColor = buildTerrainColors(inCut);
    const gradeColor = buildTerrainColors(onGrade);

    const luma = (c: Float32Array) => c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
    expect(luma(cutColor)).toBeLessThan(luma(gradeColor));
  });
});

describe('srgbToLinear', () => {
  it('pins both ends of the range', () => {
    expect(srgbToLinear(0)).toBeCloseTo(0, 10);
    expect(srgbToLinear(1)).toBeCloseTo(1, 10);
  });

  it('matches the known mid-grey value', () => {
    expect(srgbToLinear(0.5)).toBeCloseTo(0.2140, 4);
  });

  it('uses the linear segment below the knee', () => {
    expect(srgbToLinear(0.04)).toBeCloseTo(0.04 / 12.92, 10);
  });

  it('darkens every mid-tone, which is the whole point of the decode', () => {
    for (const s of [0.2, 0.4, 0.6, 0.8]) {
      expect(srgbToLinear(s)).toBeLessThan(s);
    }
  });

  it('is monotonically increasing', () => {
    let prev = -1;
    for (let s = 0; s <= 1; s += 0.05) {
      const v = srgbToLinear(s);
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
  });
});
