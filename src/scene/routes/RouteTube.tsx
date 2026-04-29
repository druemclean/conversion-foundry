import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { RouteDatum } from '../../data/routes';
import { useSelection } from '../../state/selection';

type RouteTubeProps = {
  route: RouteDatum;
  curve: THREE.QuadraticBezierCurve3;
};

const CURVE_SEGMENTS = 96;
const TUBE_SEGMENTS = 8;

export default function RouteTube({ route, curve }: RouteTubeProps) {
  const { state, hoverRoute } = useSelection();
  const isHovered = state.hoveredRouteId === route.id;

  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const tubeGeom = useMemo(() => {
    if (route.style === 'alternative' || route.style === 'manual') return null;
    return new THREE.TubeGeometry(curve, CURVE_SEGMENTS, 0.055, TUBE_SEGMENTS, false);
  }, [route.style, curve]);

  const dashedPoints = useMemo(() => {
    if (route.style !== 'alternative' && route.style !== 'manual') return null;
    return curve.getPoints(CURVE_SEGMENTS) as THREE.Vector3[];
  }, [route.style, curve]);

  // Animate emissive bump when this tube is hovered.
  useFrame((_, delta) => {
    if (!matRef.current) return;
    const baseEmissive = route.style === 'import' ? 0.32 : 0.45;
    const baseOpacity = route.style === 'import' ? 0.18 : 0.22;
    matRef.current.emissiveIntensity = THREE.MathUtils.damp(
      matRef.current.emissiveIntensity,
      isHovered ? baseEmissive * 2.4 : baseEmissive,
      6,
      delta,
    );
    matRef.current.opacity = THREE.MathUtils.damp(
      matRef.current.opacity,
      isHovered ? baseOpacity * 2.0 : baseOpacity,
      6,
      delta,
    );
  });

  if (route.style === 'alternative') {
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

  const baseOpacity = route.style === 'import' ? 0.18 : 0.22;
  const baseEmissive = route.style === 'import' ? 0.32 : 0.45;

  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hoverRoute(route.id);
  };
  const onPointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hoverRoute(null);
  };

  return (
    <mesh
      geometry={tubeGeom!}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <meshStandardMaterial
        ref={matRef}
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
