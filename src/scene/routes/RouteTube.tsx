import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { RouteDatum } from '../../data/routes';

type RouteTubeProps = {
  route: RouteDatum;
  curve: THREE.QuadraticBezierCurve3;
};

const CURVE_SEGMENTS = 96;
const TUBE_SEGMENTS = 8;

export default function RouteTube({ route, curve }: RouteTubeProps) {
  const tubeGeom = useMemo(() => {
    if (route.style === 'alternative' || route.style === 'manual') return null;
    return new THREE.TubeGeometry(curve, CURVE_SEGMENTS, 0.055, TUBE_SEGMENTS, false);
  }, [route.style, curve]);

  // Sample points for the dashed Line variants.
  const dashedPoints = useMemo(() => {
    if (route.style !== 'alternative' && route.style !== 'manual') return null;
    return curve.getPoints(CURVE_SEGMENTS) as THREE.Vector3[];
  }, [route.style, curve]);

  if (route.style === 'alternative') {
    // sGTM routes — thin, dashed, very dim, no bloom contribution.
    return (
      <Line
        points={dashedPoints!}
        color={route.color}
        lineWidth={1.4}
        dashed
        dashSize={0.5}
        gapSize={0.5}
        transparent
        opacity={0.18}
      />
    );
  }

  if (route.style === 'manual') {
    // File-upload routes — widely spaced dashes.
    return (
      <Line
        points={dashedPoints!}
        color={route.color}
        lineWidth={1.8}
        dashed
        dashSize={0.7}
        gapSize={0.9}
        transparent
        opacity={0.42}
      />
    );
  }

  // default + import: solid translucent emissive tube
  const baseOpacity = route.style === 'import' ? 0.18 : 0.22;
  const baseEmissive = route.style === 'import' ? 0.32 : 0.45;

  return (
    <mesh geometry={tubeGeom!}>
      <meshStandardMaterial
        color={route.color}
        emissive={route.color}
        emissiveIntensity={baseEmissive}
        transparent
        opacity={baseOpacity}
        toneMapped={false}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
