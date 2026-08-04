import { carvedGround, resolvePads } from '../terrain/heightfield';
import { meander, sampleSpline, tangentAngle, type Vec2 } from '../terrain/path';
import type { BasinSpec, ChannelCut, PadSpec, ResolvedPad } from '../terrain/types';

export type { BasinSpec, ChannelCut, PadSpec, ResolvedPad };

/** Where the intake weir stands, at the head of the cut network. */
export const HEADWORKS: Vec2 = { x: 0, z: -24 };

/** The level lip that feeds every destination channel at once — spec §10.1. */
export const DIVISION_LIP: Vec2 = { x: 0, z: -9 };

/** Off-system, on land you do not control — spec §3. */
export const CLIENT_GATE: Vec2 = { x: -26, z: -4 };

function cut(
  id: string,
  waypoints: Vec2[],
  halfWidth: number,
  depth: number,
  flowFrom: number,
  flowTo: number,
  seed: number,
): ChannelCut {
  return {
    id,
    pts: meander(sampleSpline(waypoints, 10), halfWidth * 0.75, seed),
    halfWidth,
    depth,
    flowFrom,
    flowTo,
  };
}

/**
 * The dentist's network, upstream to downstream. Three feeder rills converge
 * at the intake weir; a gated reach runs down to the division lip; three
 * destination channels leave the lip together; three draw-offs return to the
 * final pool. Widths narrow downstream because a draw-off carries less than
 * a trunk.
 */
export const DENTIST_CHANNELS: ChannelCut[] = [
  cut('rill-west', [{ x: -11, z: -37 }, { x: -7, z: -32 }, { x: -2.5, z: -26.5 }, HEADWORKS], 0.55, 0.5, 0.0, 0.12, 11),
  cut('rill-centre', [{ x: 1, z: -38 }, { x: 0.5, z: -32 }, { x: 0.2, z: -27 }, HEADWORKS], 0.55, 0.5, 0.0, 0.12, 23),
  cut('rill-east', [{ x: 9, z: -36 }, { x: 6, z: -31 }, { x: 2.5, z: -26.5 }, HEADWORKS], 0.55, 0.5, 0.0, 0.12, 37),

  cut('gated-reach', [HEADWORKS, { x: -0.6, z: -19 }, { x: 0.8, z: -14 }, DIVISION_LIP], 1.15, 0.85, 0.12, 0.4, 5),

  cut('to-ga4', [DIVISION_LIP, { x: -6, z: -6 }, { x: -12, z: -1 }, { x: -14, z: 3 }], 0.85, 0.7, 0.4, 0.62, 41),
  cut('to-ads', [DIVISION_LIP, { x: 0.4, z: -4 }, { x: 0, z: 1 }, { x: 0, z: 5 }], 0.85, 0.7, 0.4, 0.62, 53),
  cut('to-meta', [DIVISION_LIP, { x: 6, z: -6 }, { x: 11, z: -2 }, { x: 13, z: 2 }], 0.85, 0.7, 0.4, 0.62, 67),

  cut('draw-ga4', [{ x: -14, z: 7 }, { x: -10, z: 13 }, { x: -4, z: 18 }, { x: -1.2, z: 21 }], 0.5, 0.45, 0.68, 0.92, 71),
  cut('draw-ads', [{ x: 0, z: 9 }, { x: 0, z: 14 }, { x: 0, z: 18 }, { x: 0, z: 21 }], 0.5, 0.45, 0.68, 0.92, 83),
  cut('draw-meta', [{ x: 13, z: 6 }, { x: 9, z: 12 }, { x: 4, z: 18 }, { x: 1.2, z: 21 }], 0.5, 0.45, 0.68, 0.92, 97),

  cut('client-gate-run', [CLIENT_GATE, { x: -21, z: -5 }, { x: -16, z: -7 }, { x: -11, z: -8.4 }, { x: -2, z: -9 }], 0.6, 0.5, 0.05, 0.36, 103),
];

/** The gated reach, named so gate placement can be derived from its geometry. */
export const GATED_REACH = DENTIST_CHANNELS.find((c) => c.id === 'gated-reach')!;

/**
 * Sluice gates. Positions are authored; the angle is derived from the channel
 * tangent, because the channel meanders procedurally and a hand-authored
 * rotation silently goes stale the moment the meander seed changes. One gate
 * was 26 degrees off perpendicular and spanned neither kerb.
 */
export const DENTIST_SLUICE_GATES = [
  { id: 'consent', at: { x: -0.5, z: -20.5 }, width: 1.9 },
  { id: 'naming', at: { x: 0.35, z: -15.5 }, width: 1.9 },
].map((gate) => ({
  ...gate,
  angle: tangentAngle(GATED_REACH.pts, gate.at.x, gate.at.z),
}));

/**
 * Height of the retention-line band on a basin wall. Lives here rather than
 * in the R3F component so a Node test can check the band against the
 * waterline it sits under — spec §5.4 puts it below the surface by design.
 */
export const RETENTION_STAIN_HEIGHT = 0.22;

/**
 * Three platform pools at the same elevation — peers, no hierarchy (§3, §10.1)
 * — and the final pool below them. Retention fractions differ per pool: GA4
 * reaches deepest, Meta shallowest (§10.1).
 */
export const DENTIST_BASINS: BasinSpec[] = [
  { id: 'ga4', label: 'GA4', center: { x: -14, z: 5 }, radius: 4.6, depth: 2.1, rimWidth: 1.5, retentionFrac: 0.3, flow: 0.65, fillFrac: 0.72 },
  { id: 'ads', label: 'Google Ads', center: { x: 0, z: 7 }, radius: 4.2, depth: 1.7, rimWidth: 1.4, retentionFrac: 0.42, flow: 0.65, fillFrac: 0.55 },
  { id: 'meta', label: 'Meta', center: { x: 13, z: 4 }, radius: 4.4, depth: 1.6, rimWidth: 1.4, retentionFrac: 0.55, flow: 0.65, fillFrac: 0.62 },
  { id: 'final', label: 'The pool', center: { x: 0, z: 25 }, radius: 6.4, depth: 2.4, rimWidth: 2.0, retentionFrac: 0.2, flow: 1.0, fillFrac: 0.68 },
];

/**
 * Levelled platforms under each built structure. Oriented rectangles, wide
 * across the flow and narrow along it — a disc wide enough to span the
 * 7.2-unit division lip would swallow its neighbours and flatten away the
 * along-channel fall that makes water move downhill. Angles derive from the
 * channel tangent, same as the sluice gates, so they stay correct if the
 * meander seed changes.
 */
export const DENTIST_PAD_SPECS: PadSpec[] = [
  {
    id: 'headworks',
    center: HEADWORKS,
    angle: tangentAngle(GATED_REACH.pts, HEADWORKS.x, HEADWORKS.z),
    halfWidth: 2.6,
    halfLength: 0.7,
    blend: 1.0,
    carries: { halfWidth: 2.2, halfLength: 0.35, height: 0.6 },
  },
  {
    id: 'sluice-consent',
    center: { x: -0.5, z: -20.5 },
    angle: tangentAngle(GATED_REACH.pts, -0.5, -20.5),
    halfWidth: 1.4,
    halfLength: 0.5,
    blend: 0.7,
    carries: { halfWidth: 1.21, halfLength: 0.21, height: 0.84 },
  },
  {
    id: 'sluice-naming',
    center: { x: 0.35, z: -15.5 },
    angle: tangentAngle(GATED_REACH.pts, 0.35, -15.5),
    halfWidth: 1.4,
    halfLength: 0.5,
    blend: 0.7,
    carries: { halfWidth: 1.21, halfLength: 0.21, height: 0.84 },
  },
  {
    id: 'division-lip',
    center: DIVISION_LIP,
    angle: tangentAngle(GATED_REACH.pts, DIVISION_LIP.x, DIVISION_LIP.z),
    halfWidth: 4.0,
    halfLength: 1.0,
    blend: 1.4,
    carries: { halfWidth: 3.6, halfLength: 0.53, height: 0.44 },
  },
  {
    // Not on a channel — a wall across the boundary. Its angle matches the
    // structure's own PI/2 rotation.
    id: 'client-gate',
    center: CLIENT_GATE,
    angle: Math.PI / 2,
    halfWidth: 6.0,
    halfLength: 0.6,
    blend: 1.5,
    carries: { halfWidth: 5.7, halfLength: 0.28, height: 0.9 },
  },
];

export const DENTIST_PADS = resolvePads(DENTIST_PAD_SPECS, DENTIST_CHANNELS, DENTIST_BASINS);

/**
 * The radius at which a basin's wall actually reaches a given fraction of its
 * depth.
 *
 * `Pools.tsx` used to model this as a straight line from floor to rim, but
 * `carvedGround` blends the floor in with a smoothstep and the hillside is
 * not level across the basin, so the real wall is nowhere near the modelled
 * line — 0.23 outside it on GA4, 0.19 inside it on Meta, 0.17 outside on the
 * final pool, which puts the modelled radius 0.31, 0.52 and 0.23 adrift of
 * the wall in height. Drawn there the retention band hangs in open water, or
 * sinks into the bank, instead of marking the stone — the "horizontal thing
 * at a height" failure §10.1 warns about.
 *
 * Bisection against the real surface, once per basin at module load. Samples
 * `carvedGround`, not `carvedHeight`: the basin wall is excavation, and no pad
 * sits on a basin.
 */
export function basinWallRadius(basin: BasinSpec, heightFrac: number): number {
  const floor = carvedGround(basin.center.x, basin.center.z, DENTIST_CHANNELS, DENTIST_BASINS);
  const target = floor + basin.depth * heightFrac;

  // Measured over bearings and reduced to the median, NOT sampled along one.
  // The basin carve is radially symmetric but the ground it is cut into is
  // not: every basin has channels entering and leaving, and they breach its
  // rim. On Meta the per-bearing radius spans 2.6 units, with the worst
  // bearing running 1.7 past the lip following a channel out. A single probe
  // reads whatever that one bearing happens to cross — a +x probe put Meta's
  // wall 0.18 inside its true line, which is worse than the straight-line
  // model it replaced.
  const bearings = 24;
  const radii: number[] = [];

  for (let k = 0; k < bearings; k++) {
    const angle = (k / bearings) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);

    let lo = 0;
    let hi = basin.radius;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      const h = carvedGround(
        basin.center.x + dx * mid,
        basin.center.z + dz * mid,
        DENTIST_CHANNELS,
        DENTIST_BASINS,
      );
      if (h < target) lo = mid;
      else hi = mid;
    }
    radii.push((lo + hi) / 2);
  }

  radii.sort((a, b) => a - b);
  return (radii[(bearings - 1) >> 1] + radii[bearings >> 1]) / 2;
}

/** Named so the structures standing on them can share their orientation. */
export const HEADWORKS_PAD = DENTIST_PADS.find((p) => p.id === 'headworks')!;
export const DIVISION_LIP_PAD = DENTIST_PADS.find((p) => p.id === 'division-lip')!;
