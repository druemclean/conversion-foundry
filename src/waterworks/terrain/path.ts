import { fbm2D } from './noise';

export type Vec2 = { x: number; z: number };

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

/**
 * Catmull-Rom through the waypoints. The curve passes through every control
 * point, which matters because the waypoints are where structures sit — a
 * spline that only approximates them would leave weirs off their channels.
 */
export function sampleSpline(waypoints: Vec2[], samplesPerSegment: number): Vec2[] {
  if (waypoints.length < 2) return waypoints.map((p) => ({ ...p }));

  const pts: Vec2[] = [];
  const n = waypoints.length;

  for (let i = 0; i < n - 1; i++) {
    const p0 = waypoints[Math.max(0, i - 1)];
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const p3 = waypoints[Math.min(n - 1, i + 2)];
    const isLast = i === n - 2;
    const count = isLast ? samplesPerSegment + 1 : samplesPerSegment;

    for (let s = 0; s < count; s++) {
      const t = s / samplesPerSegment;
      pts.push({
        x: catmullRom(p0.x, p1.x, p2.x, p3.x, t),
        z: catmullRom(p0.z, p1.z, p2.z, p3.z, t),
      });
    }
  }

  return pts;
}

/**
 * Push each interior point sideways along its normal by a noise offset,
 * tapered to zero at both ends. Spec §7: channels meander, nothing is
 * CAD-straight — but the ends must stay pinned to their structures.
 */
export function meander(pts: Vec2[], amplitude: number, seed: number): Vec2[] {
  if (pts.length < 3) return pts.map((p) => ({ ...p }));

  const last = pts.length - 1;
  return pts.map((p, i) => {
    if (i === 0 || i === last) return { ...p };

    const prev = pts[i - 1];
    const next = pts[i + 1];
    const dx = next.x - prev.x;
    const dz = next.z - prev.z;
    const len = Math.hypot(dx, dz) || 1;
    // Left-hand normal of the local tangent.
    const nx = -dz / len;
    const nz = dx / len;

    const t = i / last;
    // Sine taper: zero at both ends, one in the middle.
    const taper = Math.sin(Math.PI * t);
    const offset = (fbm2D(p.x * 0.12, p.z * 0.12, seed, 3) - 0.5) * 2 * amplitude * taper;

    return { x: p.x + nx * offset, z: p.z + nz * offset };
  });
}

function distanceToSegment(x: number, z: number, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const lenSq = dx * dx + dz * dz;
  if (lenSq === 0) return Math.hypot(x - a.x, z - a.z);

  let t = ((x - a.x) * dx + (z - a.z) * dz) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(x - (a.x + t * dx), z - (a.z + t * dz));
}

/** Shortest distance from a point to the polyline, in world units. */
export function distanceToPolyline(x: number, z: number, pts: Vec2[]): number {
  if (pts.length === 0) return Infinity;
  if (pts.length === 1) return Math.hypot(x - pts[0].x, z - pts[0].z);

  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distanceToSegment(x, z, pts[i], pts[i + 1]);
    if (d < best) best = d;
  }
  return best;
}

export function polylineLength(pts: Vec2[]): number {
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    total += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].z - pts[i].z);
  }
  return total;
}
