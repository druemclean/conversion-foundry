import * as THREE from 'three';
import { getStation } from '../../data/stations';
import { CONNECTOR_HEIGHT } from '../../data/routes';

/** Connection point in world space for a given station id. */
export function connectorWorld(stationId: string): THREE.Vector3 {
  const s = getStation(stationId);
  if (!s) throw new Error(`Unknown station: ${stationId}`);
  const yOff = CONNECTOR_HEIGHT[stationId] ?? 1.0;
  return new THREE.Vector3(s.position[0], s.position[1] + yOff, s.position[2]);
}

/**
 * A quadratic bezier between two world points, arched proportionally to the
 * horizontal distance. Vertical hops (e.g. anything to Attribution at the
 * summit) get a smaller arc bonus so the curve doesn't overshoot the summit.
 */
export function routeCurve(from: string, to: string): THREE.QuadraticBezierCurve3 {
  const a = connectorWorld(from);
  const b = connectorWorld(to);
  const horizDist = Math.hypot(b.x - a.x, b.z - a.z);
  const vertDist = Math.abs(b.y - a.y);

  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  // Arc up by ~14% of horizontal distance, attenuated by vertical climb.
  const arc = Math.max(0.4, horizDist * 0.14 - vertDist * 0.18);
  mid.y += arc;
  return new THREE.QuadraticBezierCurve3(a, mid, b);
}
