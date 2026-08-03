import { meander, sampleSpline, type Vec2 } from '../terrain/path';

export type ChannelCut = {
  id: string;
  pts: Vec2[];
  /** Half-width of the cut at grade, in world units. */
  halfWidth: number;
  /** Incision below surrounding grade, in world units. */
  depth: number;
};

export type BasinSpec = {
  id: string;
  label: string;
  center: Vec2;
  radius: number;
  depth: number;
  /** How far in from the rim the floor flattens out. */
  rimWidth: number;
  /** Retention line height as a fraction of depth, measured from the floor. */
  retentionFrac: number;
};

/** Where the intake weir stands, at the head of the cut network. */
export const HEADWORKS: Vec2 = { x: 0, z: -24 };

/** The level lip that feeds every destination channel at once — spec §10.1. */
export const DIVISION_LIP: Vec2 = { x: 0, z: -9 };

/** Off-system, on land you do not control — spec §3. */
export const CLIENT_GATE: Vec2 = { x: -26, z: -4 };

function cut(id: string, waypoints: Vec2[], halfWidth: number, depth: number, seed: number): ChannelCut {
  return {
    id,
    pts: meander(sampleSpline(waypoints, 10), halfWidth * 0.75, seed),
    halfWidth,
    depth,
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
  cut('rill-west', [{ x: -11, z: -37 }, { x: -7, z: -32 }, { x: -2.5, z: -26.5 }, HEADWORKS], 0.55, 0.5, 11),
  cut('rill-centre', [{ x: 1, z: -38 }, { x: 0.5, z: -32 }, { x: 0.2, z: -27 }, HEADWORKS], 0.55, 0.5, 23),
  cut('rill-east', [{ x: 9, z: -36 }, { x: 6, z: -31 }, { x: 2.5, z: -26.5 }, HEADWORKS], 0.55, 0.5, 37),

  cut('gated-reach', [HEADWORKS, { x: -0.6, z: -19 }, { x: 0.8, z: -14 }, DIVISION_LIP], 1.15, 0.85, 5),

  cut('to-ga4', [DIVISION_LIP, { x: -6, z: -6 }, { x: -12, z: -1 }, { x: -14, z: 3 }], 0.85, 0.7, 41),
  cut('to-ads', [DIVISION_LIP, { x: 0.4, z: -4 }, { x: 0, z: 1 }, { x: 0, z: 5 }], 0.85, 0.7, 53),
  cut('to-meta', [DIVISION_LIP, { x: 6, z: -6 }, { x: 11, z: -2 }, { x: 13, z: 2 }], 0.85, 0.7, 67),

  cut('draw-ga4', [{ x: -14, z: 7 }, { x: -10, z: 13 }, { x: -4, z: 18 }, { x: -1.2, z: 21 }], 0.5, 0.45, 71),
  cut('draw-ads', [{ x: 0, z: 9 }, { x: 0, z: 14 }, { x: 0, z: 18 }, { x: 0, z: 21 }], 0.5, 0.45, 83),
  cut('draw-meta', [{ x: 13, z: 6 }, { x: 9, z: 12 }, { x: 4, z: 18 }, { x: 1.2, z: 21 }], 0.5, 0.45, 97),

  cut('client-gate-run', [CLIENT_GATE, { x: -21, z: -5 }, { x: -16, z: -7 }, { x: -11, z: -8.4 }, { x: -2, z: -9 }], 0.6, 0.5, 103),
];

/**
 * Three platform pools at the same elevation — peers, no hierarchy (§3, §10.1)
 * — and the final pool below them. Retention fractions differ per pool: GA4
 * reaches deepest, Meta shallowest (§10.1).
 */
export const DENTIST_BASINS: BasinSpec[] = [
  { id: 'ga4', label: 'GA4', center: { x: -14, z: 5 }, radius: 4.6, depth: 2.1, rimWidth: 1.5, retentionFrac: 0.12 },
  { id: 'ads', label: 'Google Ads', center: { x: 0, z: 7 }, radius: 4.2, depth: 1.7, rimWidth: 1.4, retentionFrac: 0.42 },
  { id: 'meta', label: 'Meta', center: { x: 13, z: 4 }, radius: 4.4, depth: 1.6, rimWidth: 1.4, retentionFrac: 0.55 },
  { id: 'final', label: 'The pool', center: { x: 0, z: 25 }, radius: 6.4, depth: 2.4, rimWidth: 2.0, retentionFrac: 0.2 },
];
