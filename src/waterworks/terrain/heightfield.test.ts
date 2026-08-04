import { describe, expect, it } from 'vitest';
import {
  baseFall,
  buildTerrainColors,
  buildTerrainGrid,
  carvedHeight,
  clamp01,
  smoothstep,
  srgbToLinear,
  surfaceHeight,
  TERRAIN,
} from './heightfield';
import { DENTIST_BASINS, DENTIST_CHANNELS } from '../content/layout';

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
      const floor = carvedHeight(basin.center.x, basin.center.z, [], DENTIST_BASINS);
      const grade = surfaceHeight(basin.center.x, basin.center.z);
      expect(grade - floor).toBeGreaterThan(basin.depth * 0.9);
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
