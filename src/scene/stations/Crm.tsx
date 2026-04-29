import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StationFrame from './StationFrame';
import { getStation } from '../../data/stations';
import { useSelection } from '../../state/selection';

const station = getStation('crm')!;
const ACCENT = station.accent;
const SHELL = '#0d1a14';
const SHELL_HI = '#16271e';

const CARD_COUNT = 7;

export default function Crm() {
  return (
    <StationFrame station={station} labelOffsetY={2.4} haloRadius={1.5}>
      <Geometry />
    </StationFrame>
  );
}

function Geometry() {
  const { state } = useSelection();
  const isActive = state.hoveredId === station.id || state.selectedId === station.id;

  const stackRef = useRef<THREE.Group>(null);
  const ringMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const cardMats = useRef<Array<THREE.MeshStandardMaterial | null>>([]);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;
    if (stackRef.current) stackRef.current.rotation.y += delta * 0.18;
    if (ringMatRef.current) {
      ringMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        ringMatRef.current.emissiveIntensity,
        isActive ? 1.6 : 0.95,
        5,
        delta,
      );
    }
    cardMats.current.forEach((m, i) => {
      if (!m) return;
      const phase = i * 0.5;
      m.emissiveIntensity = (isActive ? 1.0 : 0.65) * (0.4 + (Math.sin(t * 0.9 + phase) + 1) * 0.3);
    });
  });

  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.95, 1.0, 0.24, 48]} />
        <meshStandardMaterial color={SHELL} metalness={0.55} roughness={0.42} />
      </mesh>
      {/* Plinth ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.245, 0]}>
        <ringGeometry args={[0.78, 0.84, 96]} />
        <meshStandardMaterial
          ref={ringMatRef}
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={0.95}
          toneMapped={false}
        />
      </mesh>

      {/* Center spindle */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 16]} />
        <meshStandardMaterial color={SHELL_HI} metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Rolodex card stack — rotates */}
      <group ref={stackRef} position={[0, 1.0, 0]}>
        {Array.from({ length: CARD_COUNT }).map((_, i) => {
          const a = (i / CARD_COUNT) * Math.PI * 2;
          const tilt = Math.sin(i * 0.7) * 0.04;
          return (
            <group key={i} rotation={[tilt, a, 0]}>
              <mesh position={[0.55, 0, 0]} castShadow>
                <boxGeometry args={[1.0, 0.56, 0.02]} />
                <meshStandardMaterial color="#dde8e0" metalness={0} roughness={0.85} />
              </mesh>
              {/* Ledger lines on the card face */}
              {[0.16, 0.06, -0.04, -0.14, -0.22].map((y, j) => (
                <mesh key={j} position={[0.55, y, 0.012]}>
                  <planeGeometry args={[0.78, 0.012]} />
                  <meshStandardMaterial color="#3a4a40" metalness={0} roughness={0.9} />
                </mesh>
              ))}
              {/* Card edge accent */}
              <mesh position={[0.06, 0, 0.011]}>
                <planeGeometry args={[0.04, 0.42]} />
                <meshStandardMaterial
                  ref={(m) => {
                    cardMats.current[i] = m;
                  }}
                  color={ACCENT}
                  emissive={ACCENT}
                  emissiveIntensity={0.7}
                  toneMapped={false}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Top finial */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <coneGeometry args={[0.08, 0.18, 16]} />
        <meshStandardMaterial color={SHELL_HI} metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  );
}
