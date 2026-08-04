import { describe, expect, it } from 'vitest';
import {
  SKIRT_DEPTH,
  SURROUND,
  buildSkirt,
  buildSurroundGrid,
  buildSurroundNormals,
  surroundHeight,
  baseFall,
  buildTerrainColors,
  buildTerrainGrid,
  carvedGround,
  carvedHeight,
  channelIncision,
  clamp01,
  crossSlope,
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
  // This is also the overlap guard. Two platforms at two different levels
  // cannot both be true at a point, and it was this assertion that caught the
  // original disc-shaped pads overlapping each other.
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

  it('gives every pad enough flat ground for the structure it carries', () => {
    for (const pad of DENTIST_PADS) {
      // The flat core must cover the structure's own footprint.
      expect(pad.halfWidth).toBeGreaterThanOrEqual(pad.carries.halfWidth);
      expect(pad.halfLength).toBeGreaterThanOrEqual(pad.carries.halfLength);

      // And no corner of that footprint may sit high enough to bury it.
      const cos = Math.cos(pad.angle);
      const sin = Math.sin(pad.angle);
      for (const sx of [-1, 0, 1]) {
        for (const sz of [-1, 0, 1]) {
          const lx = sx * pad.carries.halfWidth;
          const lz = sz * pad.carries.halfLength;
          const x = pad.center.x + lx * cos + lz * sin;
          const z = pad.center.z - lx * sin + lz * cos;
          const ground = carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS, DENTIST_PADS);
          expect(ground - pad.level).toBeLessThan(pad.carries.height);
        }
      }
    }
  });
});

describe('buildTerrainGrid', () => {
  const flat = () => 2;
  const grid = buildTerrainGrid(flat);

  it('spans the configured bounds plus a one-cell guard ring', () => {
    expect(grid.nx).toBe(Math.round((TERRAIN.xMax - TERRAIN.xMin) / TERRAIN.res) + 3);
    expect(grid.nz).toBe(Math.round((TERRAIN.zMax - TERRAIN.zMin) / TERRAIN.res) + 3);
  });

  it('emits three floats per vertex', () => {
    expect(grid.positions.length).toBe(grid.nx * grid.nz * 3);
  });

  it('emits two triangles per cell, guard ring excluded', () => {
    expect(grid.indices.length).toBe((grid.nx - 3) * (grid.nz - 3) * 6);
  });

  it('renders exactly the configured bounds despite the guard ring', () => {
    // The guard ring exists only so the outermost rendered vertices have faces
    // on both sides and get true normals. It must never widen what is drawn —
    // the surround's hole is sized against these bounds.
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const idx of grid.indices) {
      const v = idx * 3;
      minX = Math.min(minX, grid.positions[v]);
      maxX = Math.max(maxX, grid.positions[v]);
      minZ = Math.min(minZ, grid.positions[v + 2]);
      maxZ = Math.max(maxZ, grid.positions[v + 2]);
    }
    expect(minX).toBeCloseTo(TERRAIN.xMin, 6);
    expect(maxX).toBeCloseTo(TERRAIN.xMax, 6);
    expect(minZ).toBeCloseTo(TERRAIN.zMin, 6);
    expect(maxZ).toBeCloseTo(TERRAIN.zMax, 6);
  });

  it('samples the guard ring outside those bounds', () => {
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < grid.positions.length; i += 3) {
      minX = Math.min(minX, grid.positions[i]);
      maxX = Math.max(maxX, grid.positions[i]);
    }
    expect(minX).toBeCloseTo(TERRAIN.xMin - TERRAIN.res, 6);
    expect(maxX).toBeCloseTo(TERRAIN.xMax + TERRAIN.res, 6);
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

describe('surroundHeight', () => {
  it('matches the worked tile exactly along every boundary edge', () => {
    // Continuity here is the whole point — a mismatch shows as a cliff or a
    // crack at the horizon. Clamping guarantees it, so assert it holds.
    for (let x = TERRAIN.xMin; x <= TERRAIN.xMax; x += 2.5) {
      expect(surroundHeight(x, TERRAIN.zMin)).toBeCloseTo(surfaceHeight(x, TERRAIN.zMin), 9);
      expect(surroundHeight(x, TERRAIN.zMax)).toBeCloseTo(surfaceHeight(x, TERRAIN.zMax), 9);
    }
    for (let z = TERRAIN.zMin; z <= TERRAIN.zMax; z += 2.5) {
      expect(surroundHeight(TERRAIN.xMin, z)).toBeCloseTo(surfaceHeight(TERRAIN.xMin, z), 9);
      expect(surroundHeight(TERRAIN.xMax, z)).toBeCloseTo(surfaceHeight(TERRAIN.xMax, z), 9);
    }
  });

  it('stays at or below the tile surface everywhere inside it', () => {
    // Inside the footprint the surround is the overlap band backing the seam.
    // It must never rise above the worked ground (it would poke through), and
    // away from the boundary it ducks well below the deepest cut.
    for (let x = -25; x <= 25; x += 10) {
      for (let z = -35; z <= 35; z += 10) {
        expect(surroundHeight(x, z)).toBeLessThanOrEqual(surfaceHeight(x, z) + 1e-9);
        expect(surroundHeight(x, z)).toBeGreaterThan(surfaceHeight(x, z) - 4.001);
      }
    }
  });

  it('saturates instead of climbing to absurd heights', () => {
    // Extending crossSlope itself would put the horizon 120 units in the air.
    for (const at of [
      { x: SURROUND.xMin, z: 0 },
      { x: SURROUND.xMax, z: 0 },
      { x: 0, z: SURROUND.zMin },
      { x: 0, z: SURROUND.zMax },
    ]) {
      const h = surroundHeight(at.x, at.z);
      expect(h).toBeLessThan(TERRAIN.ridgeHeight + 45);
      expect(h).toBeGreaterThan(-30);
    }
  });

  it('continues the landform rather than rolling uniformly away', () => {
    // A uniform roll-away made the worked tile a mesa on a plinth. Uphill of
    // the ridge the ground must keep climbing; below the outfall it must not.
    const uphill = surroundHeight(0, TERRAIN.zMin - 80);
    const atRidge = surroundHeight(0, TERRAIN.zMin);
    expect(uphill).toBeGreaterThan(atRidge);

    const sideways = surroundHeight(TERRAIN.xMax + 80, 0);
    const atSide = surroundHeight(TERRAIN.xMax, 0);
    expect(sideways).toBeGreaterThan(atSide);

    const downhill = surroundHeight(0, TERRAIN.zMax + 80);
    const atOutfall = surroundHeight(0, TERRAIN.zMax);
    expect(downhill).toBeLessThan(atOutfall + 6);
  });

  it('is continuous across the boundary, not just equal on it', () => {
    const justInside = surroundHeight(TERRAIN.xMax - 0.01, 0);
    const justOutside = surroundHeight(TERRAIN.xMax + 0.01, 0);
    expect(Math.abs(justInside - justOutside)).toBeLessThan(0.05);
  });
});

describe('buildSurroundGrid', () => {
  const grid = buildSurroundGrid();

  it('spans the configured bounds at the configured resolution', () => {
    expect(grid.nx).toBe(Math.round((SURROUND.xMax - SURROUND.xMin) / SURROUND.res) + 1);
    expect(grid.nz).toBe(Math.round((SURROUND.zMax - SURROUND.zMin) / SURROUND.res) + 1);
  });

  it('keeps every index in range', () => {
    const maxIndex = grid.nx * grid.nz - 1;
    for (const idx of grid.indices) expect(idx).toBeLessThanOrEqual(maxIndex);
  });

  it('emits whole triangles only', () => {
    expect(grid.indices.length % 3).toBe(0);
    expect(grid.indices.length).toBeGreaterThan(0);
  });

  it('leaves a hole for the worked tile', () => {
    // Every emitted triangle must have all three corners outside the hole,
    // or the surround would render over the channels and basins.
    for (let t = 0; t < grid.indices.length; t += 3) {
      for (let k = 0; k < 3; k++) {
        const v = grid.indices[t + k] * 3;
        const x = grid.positions[v];
        const z = grid.positions[v + 2];
        const inHole =
          Math.abs(x) < SURROUND.holeX && z > SURROUND.holeZMin && z < SURROUND.holeZMax;
        expect(inHole).toBe(false);
      }
    }
  });

  it('emits a true overlap band inside the tile footprint', () => {
    // Cells are dropped when ANY corner is in the hole, so the hole margin
    // must exceed one full cell or the corner test eats the entire overlap
    // ring — which is exactly what happened at a 2-unit margin: the meshes
    // met only along the boundary curve, and the T-junctions between the
    // tile's 0.4-unit edge vertices and the surround's 5-unit edge spans
    // opened pinhole cracks with the sky behind them. Height agreement cannot
    // fix a T-junction; only geometry behind it can.
    expect(TERRAIN.xMax - SURROUND.holeX).toBeGreaterThan(SURROUND.res);
    expect(SURROUND.holeZMin - TERRAIN.zMin).toBeGreaterThan(SURROUND.res);
    expect(TERRAIN.zMax - SURROUND.holeZMax).toBeGreaterThan(SURROUND.res);

    let inside = 0;
    for (let t = 0; t < grid.indices.length; t += 3) {
      for (let k = 0; k < 3; k++) {
        const v = grid.indices[t + k] * 3;
        const x = grid.positions[v];
        const z = grid.positions[v + 2];
        if (Math.abs(x) < TERRAIN.xMax && z > TERRAIN.zMin && z < TERRAIN.zMax) inside++;
      }
    }
    expect(inside).toBeGreaterThan(0);
    expect(SURROUND.drop).toBe(0);
  });

  it('dips below the worked ground inside the tile so cuts stay open', () => {
    // The overlap band must never poke through a channel or basin carved near
    // the tile edge (the intake cut reaches the boundary). Inside the tile
    // footprint the surround therefore hugs a level below the undisturbed
    // surface, deeper than the deepest cut, while still meeting the boundary
    // exactly.
    for (const [x, z] of [
      [27.5, 0],
      [-27.5, 10],
      [0, -37.5],
      [10, 37.5],
    ] as const) {
      const inward = Math.min(
        TERRAIN.xMax - Math.abs(x),
        Math.min(z - TERRAIN.zMin, TERRAIN.zMax - z),
      );
      expect(inward).toBeGreaterThan(0);
      expect(surroundHeight(x, z)).toBeLessThan(surfaceHeight(x, z) - 2.5);
    }
    // And exactly at the boundary the two surfaces still agree.
    expect(surroundHeight(TERRAIN.xMax, 0)).toBeCloseTo(surfaceHeight(TERRAIN.xMax, 0), 9);
    expect(surroundHeight(0, TERRAIN.zMin)).toBeCloseTo(surfaceHeight(0, TERRAIN.zMin), 9);
  });
});

describe('surfaceHeight edge fade', () => {
  it('carries no noise on the tile boundary', () => {
    // The surround samples this boundary every 5 units and draws straight
    // lines between; the tile samples it every 0.4 through the noise. Any
    // noise on the boundary makes the two edges disagree between shared
    // samples, opening backlit slivers of sky along the seam. So the noise
    // must be fully faded by the time it reaches the edge.
    for (let z = TERRAIN.zMin; z <= TERRAIN.zMax; z += 7.3) {
      expect(surfaceHeight(TERRAIN.xMin, z)).toBeCloseTo(baseFall(z) + crossSlope(TERRAIN.xMin), 9);
      expect(surfaceHeight(TERRAIN.xMax, z)).toBeCloseTo(baseFall(z) + crossSlope(TERRAIN.xMax), 9);
    }
    for (let x = TERRAIN.xMin; x <= TERRAIN.xMax; x += 5.9) {
      expect(surfaceHeight(x, TERRAIN.zMin)).toBeCloseTo(baseFall(TERRAIN.zMin) + crossSlope(x), 9);
      expect(surfaceHeight(x, TERRAIN.zMax)).toBeCloseTo(baseFall(TERRAIN.zMax) + crossSlope(x), 9);
    }
  });

  it('keeps full noise in the interior', () => {
    const noise = Math.abs(surfaceHeight(0, 0) - (baseFall(0) + crossSlope(0)));
    expect(noise).toBeGreaterThan(0.01);
  });

  it('lets the surround edge interpolation match the tile edge between samples', () => {
    // The surround grid samples the boundary at multiples of its 5-unit res.
    // Halfway between two such samples, its straight edge must sit within a
    // whisker of the tile's own edge height, or the seam reopens.
    for (let x0 = -30; x0 < 30; x0 += 5) {
      const a = surroundHeight(x0, TERRAIN.zMin);
      const b = surroundHeight(x0 + 5, TERRAIN.zMin);
      const mid = surfaceHeight(x0 + 2.5, TERRAIN.zMin);
      expect(Math.abs((a + b) / 2 - mid)).toBeLessThan(0.1);
    }
  });
});

describe('buildSurroundNormals', () => {
  const grid = buildSurroundGrid();
  const normals = buildSurroundNormals(grid.positions);

  it('emits one unit normal per vertex', () => {
    expect(normals.length).toBe(grid.positions.length);
    for (let i = 0; i < normals.length; i += 3) {
      const len = Math.hypot(normals[i], normals[i + 1], normals[i + 2]);
      expect(len).toBeCloseTo(1, 5);
      // A heightfield's surface normal always points up, never sideways-only.
      expect(normals[i + 1]).toBeGreaterThan(0);
    }
  });

  it('matches the analytic gradient of surroundHeight at hole-edge vertices', () => {
    // The whole point: edge vertices must carry the true surface normal, not
    // the tilted average computeVertexNormals produces from one-sided faces —
    // that tilt caught the key light and lit a white hairline tracing the
    // worked tile's outline.
    const eps = 0.25;
    for (let i = 0; i < grid.positions.length; i += 3) {
      const x = grid.positions[i];
      const z = grid.positions[i + 2];
      if (Math.abs(Math.abs(x) - 30) > 1e-6 && Math.abs(Math.abs(z) - 40) > 1e-6) continue;
      const dhdx = (surroundHeight(x + eps, z) - surroundHeight(x - eps, z)) / (2 * eps);
      const dhdz = (surroundHeight(x, z + eps) - surroundHeight(x, z - eps)) / (2 * eps);
      const len = Math.hypot(dhdx, 1, dhdz);
      expect(normals[i]).toBeCloseTo(-dhdx / len, 3);
      expect(normals[i + 1]).toBeCloseTo(1 / len, 3);
      expect(normals[i + 2]).toBeCloseTo(-dhdz / len, 3);
    }
  });
});

describe('buildSkirt', () => {
  const height = (x: number, z: number) =>
    carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS, DENTIST_PADS);
  const skirt = buildSkirt(height);

  it('walks the full tile perimeter at terrain resolution', () => {
    const perimeterSteps =
      2 *
      (Math.round((TERRAIN.xMax - TERRAIN.xMin) / TERRAIN.res) +
        Math.round((TERRAIN.zMax - TERRAIN.zMin) / TERRAIN.res));
    // Two vertices (top and bottom) per perimeter point, closed loop.
    expect(skirt.positions.length).toBe(perimeterSteps * 2 * 3);
    // Two triangles per perimeter segment.
    expect(skirt.indices.length).toBe(perimeterSteps * 6);
  });

  it('keeps every vertex on the tile boundary', () => {
    for (let i = 0; i < skirt.positions.length; i += 3) {
      const x = skirt.positions[i];
      const z = skirt.positions[i + 2];
      const onX = Math.abs(Math.abs(x) - TERRAIN.xMax) < 1e-9;
      const onZ =
        Math.abs(z - TERRAIN.zMin) < 1e-9 || Math.abs(z - TERRAIN.zMax) < 1e-9;
      expect(onX || onZ).toBe(true);
    }
  });

  it('hangs from the carved edge down by exactly the skirt depth', () => {
    // Vertices alternate top, bottom for each perimeter point.
    for (let i = 0; i < skirt.positions.length; i += 6) {
      const x = skirt.positions[i];
      const top = skirt.positions[i + 1];
      const z = skirt.positions[i + 2];
      const bottom = skirt.positions[i + 4];
      // Positions round-trip through Float32, which keeps ~7 significant
      // digits — on ~20-unit heights that is 1e-5, not double precision.
      expect(top).toBeCloseTo(height(x, z), 4);
      expect(bottom).toBeCloseTo(top - SKIRT_DEPTH, 4);
    }
  });

  it('keeps every index in range and whole triangles only', () => {
    expect(skirt.indices.length % 3).toBe(0);
    const maxIndex = skirt.positions.length / 3 - 1;
    for (const idx of skirt.indices) expect(idx).toBeLessThanOrEqual(maxIndex);
  });
});
