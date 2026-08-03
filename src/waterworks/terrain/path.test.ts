import { describe, expect, it } from 'vitest';
import { distanceToPolyline, meander, polylineLength, sampleSpline, type Vec2 } from './path';

const STRAIGHT: Vec2[] = [
  { x: 0, z: 0 },
  { x: 0, z: 10 },
  { x: 0, z: 20 },
  { x: 0, z: 30 },
];

describe('sampleSpline', () => {
  it('preserves the first and last waypoint exactly', () => {
    const pts = sampleSpline(STRAIGHT, 8);
    expect(pts[0]).toEqual({ x: 0, z: 0 });
    expect(pts[pts.length - 1]).toEqual({ x: 0, z: 30 });
  });

  it('stays on the line through collinear waypoints', () => {
    for (const p of sampleSpline(STRAIGHT, 8)) {
      expect(Math.abs(p.x)).toBeLessThan(1e-9);
    }
  });

  it('produces a denser polyline than the input', () => {
    expect(sampleSpline(STRAIGHT, 8).length).toBeGreaterThan(STRAIGHT.length);
  });

  it('returns the input unchanged when there is nothing to interpolate', () => {
    expect(sampleSpline([{ x: 1, z: 2 }], 8)).toEqual([{ x: 1, z: 2 }]);
  });
});

describe('meander', () => {
  it('pins both endpoints so channels still meet their structures', () => {
    const pts = sampleSpline(STRAIGHT, 8);
    const wobbled = meander(pts, 3, 7);
    expect(wobbled[0].x).toBeCloseTo(pts[0].x, 6);
    expect(wobbled[0].z).toBeCloseTo(pts[0].z, 6);
    expect(wobbled[wobbled.length - 1].x).toBeCloseTo(pts[pts.length - 1].x, 6);
  });

  it('actually displaces the middle', () => {
    const pts = sampleSpline(STRAIGHT, 8);
    const wobbled = meander(pts, 3, 7);
    const mid = Math.floor(pts.length / 2);
    expect(Math.abs(wobbled[mid].x - pts[mid].x)).toBeGreaterThan(0.05);
  });

  it('respects the amplitude ceiling', () => {
    const pts = sampleSpline(STRAIGHT, 8);
    for (const p of meander(pts, 2, 3)) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(2.0001);
    }
  });
});

describe('distanceToPolyline', () => {
  it('is zero on the line', () => {
    expect(distanceToPolyline(0, 15, STRAIGHT)).toBeCloseTo(0, 6);
  });

  it('measures perpendicular offset', () => {
    expect(distanceToPolyline(4, 15, STRAIGHT)).toBeCloseTo(4, 6);
  });

  it('measures from the endpoint when past the end', () => {
    expect(distanceToPolyline(0, 34, STRAIGHT)).toBeCloseTo(4, 6);
  });
});

describe('polylineLength', () => {
  it('sums the segments', () => {
    expect(polylineLength(STRAIGHT)).toBeCloseTo(30, 6);
  });

  it('is zero for a degenerate polyline', () => {
    expect(polylineLength([{ x: 1, z: 1 }])).toBe(0);
  });
});
