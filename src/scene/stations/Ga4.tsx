import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StationFrame from './StationFrame';
import { getStation } from '../../data/stations';
import { useSelection } from '../../state/selection';

const station = getStation('ga4')!;
const ACCENT = station.accent;

const SHELL = '#0d1828';
const SHELL_HI = '#1a2640';

export default function Ga4() {
  return (
    <StationFrame station={station} labelOffsetY={2.0} haloRadius={1.5}>
      <Geometry />
    </StationFrame>
  );
}

const BAR_HEIGHTS = [0.45, 0.78, 0.6, 0.95, 0.7, 0.55, 0.82];
const BAR_WIDTH = 0.13;

function Geometry() {
  const { state } = useSelection();
  const isActive = state.hoveredId === station.id || state.selectedId === station.id;

  const barRefs = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const heightOffsets = useMemo(
    () => BAR_HEIGHTS.map((_, i) => i * 0.7),
    [],
  );

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;
    barRefs.current.forEach((m, i) => {
      if (!m) return;
      const phase = heightOffsets[i];
      const target =
        (isActive ? 1.6 : 1.0) * (0.55 + (Math.sin(t * 0.85 + phase) + 1) * 0.45);
      m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, target, 4, delta);
    });
  });

  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.95, 1.0, 0.12, 48]} />
        <meshStandardMaterial color={SHELL} metalness={0.55} roughness={0.4} />
      </mesh>

      {/* Inner pad (bars sit on this) */}
      <mesh position={[0, 0.13, 0]} receiveShadow>
        <cylinderGeometry args={[0.85, 0.85, 0.02, 48]} />
        <meshStandardMaterial color="#08111e" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Bar chart inside — 7 vertical emissive bars */}
      <group position={[0, 0.14, 0]}>
        {BAR_HEIGHTS.map((h, i) => {
          const x = (i - (BAR_HEIGHTS.length - 1) / 2) * (BAR_WIDTH + 0.045);
          return (
            <mesh key={i} position={[x, h * 0.5, 0]}>
              <boxGeometry args={[BAR_WIDTH, h, BAR_WIDTH]} />
              <meshStandardMaterial
                ref={(m) => {
                  barRefs.current[i] = m;
                }}
                color={ACCENT}
                emissive={ACCENT}
                emissiveIntensity={1.0}
                toneMapped={false}
              />
            </mesh>
          );
        })}
      </group>

      {/* Glass dome */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <sphereGeometry args={[1.05, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#cfe6ff"
          metalness={0}
          roughness={0.05}
          transmission={0.85}
          transparent
          opacity={0.18}
          ior={1.45}
          thickness={0.4}
          envMapIntensity={1.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Dome rim */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <torusGeometry args={[1.05, 0.025, 12, 80]} />
        <meshStandardMaterial color={SHELL_HI} metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Tiny crown ring at the top of the dome */}
      <mesh position={[0, 1.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.018, 8, 32]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
