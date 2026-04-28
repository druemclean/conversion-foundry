import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StationFrame from './StationFrame';
import { getStation } from '../../data/stations';
import { useSelection } from '../../state/selection';

const station = getStation('consent')!;
const ACCENT = station.accent;

const SHELL = '#1a1308';
const SHELL_HI = '#241a0c';

export default function Consent() {
  return (
    <StationFrame station={station} labelOffsetY={2.6} haloRadius={1.5}>
      <Geometry />
    </StationFrame>
  );
}

function Geometry() {
  const { state } = useSelection();
  const isActive = state.hoveredId === station.id || state.selectedId === station.id;

  const beamRef = useRef<THREE.Group>(null);
  const beamMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const shieldRef = useRef<THREE.Group>(null);
  const shieldMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;

    // Gate beam slowly raises and lowers — visualizes consent flipping state.
    if (beamRef.current) {
      const targetY = 0.55 + Math.sin(t * 0.55) * 0.35;
      beamRef.current.position.y = THREE.MathUtils.damp(
        beamRef.current.position.y,
        targetY,
        4,
        delta,
      );
    }
    if (beamMatRef.current) {
      const pulse = 0.85 + (Math.sin(t * 0.55) + 1) * 0.45; // brighter when raised
      beamMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        beamMatRef.current.emissiveIntensity,
        (isActive ? 2.2 : 1.4) * pulse,
        5,
        delta,
      );
    }
    if (shieldRef.current) {
      shieldRef.current.position.y = 2.1 + Math.sin(t * 1.0) * 0.04;
      shieldRef.current.rotation.y = Math.sin(t * 0.4) * 0.1;
    }
    if (shieldMatRef.current) {
      shieldMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        shieldMatRef.current.emissiveIntensity,
        isActive ? 1.6 : 0.95,
        5,
        delta,
      );
    }
  });

  return (
    <group>
      {/* Stone pad */}
      <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.2, 0.08, 0.7]} />
        <meshStandardMaterial color={SHELL} metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Pillar A (left) */}
      <mesh position={[-0.95, 0.95, 0]} castShadow>
        <boxGeometry args={[0.18, 1.7, 0.18]} />
        <meshStandardMaterial color={SHELL_HI} metalness={0.65} roughness={0.32} />
      </mesh>
      {/* Pillar B (right) */}
      <mesh position={[0.95, 0.95, 0]} castShadow>
        <boxGeometry args={[0.18, 1.7, 0.18]} />
        <meshStandardMaterial color={SHELL_HI} metalness={0.65} roughness={0.32} />
      </mesh>

      {/* Top crossbeam (torii lintel — slight overhang) */}
      <mesh position={[0, 1.85, 0]} castShadow>
        <boxGeometry args={[2.4, 0.14, 0.22]} />
        <meshStandardMaterial color={SHELL_HI} metalness={0.65} roughness={0.3} />
      </mesh>
      {/* Lintel cap (decorative) */}
      <mesh position={[0, 1.96, 0]} castShadow>
        <boxGeometry args={[2.55, 0.08, 0.28]} />
        <meshStandardMaterial color={SHELL} metalness={0.6} roughness={0.35} />
      </mesh>

      {/* Animated consent beam */}
      <group ref={beamRef} position={[0, 0.55, 0]}>
        <mesh>
          <boxGeometry args={[1.8, 0.06, 0.06]} />
          <meshStandardMaterial
            ref={beamMatRef}
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={1.4}
            toneMapped={false}
          />
        </mesh>
        {/* Beam glow halo */}
        <mesh>
          <boxGeometry args={[1.84, 0.16, 0.16]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.18} depthWrite={false} />
        </mesh>
      </group>

      {/* Pillar guides (faint vertical tracks the beam slides on) */}
      <mesh position={[-0.95, 0.95, 0.1]}>
        <planeGeometry args={[0.04, 1.5]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={0.35}
          transparent
          opacity={0.35}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.95, 0.95, 0.1]}>
        <planeGeometry args={[0.04, 1.5]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={0.35}
          transparent
          opacity={0.35}
          toneMapped={false}
        />
      </mesh>

      {/* Floating shield icon above */}
      <group ref={shieldRef} position={[0, 2.1, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.15, 0.18, 0.06, 6]} />
          <meshStandardMaterial color={SHELL_HI} metalness={0.8} roughness={0.25} />
        </mesh>
        {/* Shield emissive face */}
        <mesh position={[0, 0.032, 0]}>
          <cylinderGeometry args={[0.105, 0.13, 0.005, 6]} />
          <meshStandardMaterial
            ref={shieldMatRef}
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={1.0}
            toneMapped={false}
          />
        </mesh>
        {/* Tiny check mark sliver */}
        <mesh position={[-0.03, 0.04, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.07, 0.012, 0.01]} />
          <meshStandardMaterial color="#1a1308" />
        </mesh>
        <mesh position={[0.03, 0.04, 0.025]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.1, 0.012, 0.01]} />
          <meshStandardMaterial color="#1a1308" />
        </mesh>
      </group>
    </group>
  );
}
