import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StationFrame from './StationFrame';
import { getStation } from '../../data/stations';
import { useSelection } from '../../state/selection';

const station = getStation('attribution')!;
const ACCENT = station.accent;

export default function Attribution() {
  return (
    <StationFrame station={station} labelOffsetY={2.0} haloRadius={1.6}>
      <Geometry />
    </StationFrame>
  );
}

function Geometry() {
  const { state } = useSelection();
  const isActive = state.hoveredId === station.id || state.selectedId === station.id;

  const crystalRef = useRef<THREE.Group>(null);
  const innerCoreRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;
    if (crystalRef.current) {
      crystalRef.current.rotation.y += delta * 0.18;
      crystalRef.current.rotation.x = Math.sin(t * 0.3) * 0.06;
    }
    if (innerCoreRef.current) {
      innerCoreRef.current.emissiveIntensity = THREE.MathUtils.damp(
        innerCoreRef.current.emissiveIntensity,
        (isActive ? 2.6 : 1.6) * (0.7 + Math.sin(t * 0.9) * 0.3),
        5,
        delta,
      );
    }
  });

  return (
    <group>
      {/* Geodesic crystal at the summit — the apex of the whole scene */}
      <group ref={crystalRef}>
        {/* Outer faceted shell */}
        <mesh castShadow>
          <icosahedronGeometry args={[0.7, 0]} />
          <meshPhysicalMaterial
            color="#1a2540"
            metalness={0.9}
            roughness={0.18}
            clearcoat={0.7}
            clearcoatRoughness={0.25}
            envMapIntensity={1.6}
          />
        </mesh>
        {/* Wireframe-like outer ring of edges */}
        <mesh>
          <icosahedronGeometry args={[0.72, 0]} />
          <meshBasicMaterial color={ACCENT} wireframe transparent opacity={0.55} />
        </mesh>
        {/* Inner emissive core glowing through facets */}
        <mesh>
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshStandardMaterial
            ref={innerCoreRef}
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
        {/* Equatorial ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.78, 0.014, 12, 80]} />
          <meshStandardMaterial
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={2.0}
            toneMapped={false}
          />
        </mesh>
      </group>

    </group>
  );
}
