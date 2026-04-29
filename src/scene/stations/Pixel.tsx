import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StationFrame from './StationFrame';
import { getStation } from '../../data/stations';
import { useSelection } from '../../state/selection';

const station = getStation('pixel')!;
const ACCENT = station.accent;
const SHELL = '#1a0a1f';
const SHELL_HI = '#2a1432';

// 8x8 grid of pixel cells
const GRID = 8;
const CELL = 0.13;

export default function Pixel() {
  return (
    <StationFrame station={station} labelOffsetY={2.4} haloRadius={1.6}>
      <Geometry />
    </StationFrame>
  );
}

function Geometry() {
  const { state } = useSelection();
  const isActive = state.hoveredId === station.id || state.selectedId === station.id;

  const ringFrontRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringBackRef = useRef<THREE.MeshStandardMaterial>(null);
  const cellMats = useRef<Array<THREE.MeshStandardMaterial | null>>([]);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;

    if (ringFrontRef.current) {
      ringFrontRef.current.emissiveIntensity = THREE.MathUtils.damp(
        ringFrontRef.current.emissiveIntensity,
        (isActive ? 2.4 : 1.7) * (0.85 + Math.sin(t * 1.4) * 0.25),
        5,
        delta,
      );
    }
    if (ringBackRef.current) {
      ringBackRef.current.emissiveIntensity = THREE.MathUtils.damp(
        ringBackRef.current.emissiveIntensity,
        (isActive ? 1.9 : 1.3) * (0.85 + Math.sin(t * 1.4 + Math.PI) * 0.25),
        5,
        delta,
      );
    }

    // Pixel cells flicker with a wave pattern so the screen reads as "alive"
    cellMats.current.forEach((m, i) => {
      if (!m) return;
      const x = i % GRID;
      const y = Math.floor(i / GRID);
      const wave = Math.sin(t * 1.6 + x * 0.5 + y * 0.4);
      const lit = wave > -0.2 ? wave * 0.5 + 0.5 : 0.05;
      m.emissiveIntensity = (isActive ? 1.6 : 1.0) * lit;
    });
  });

  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.92, 0.96, 0.28, 48]} />
        <meshStandardMaterial color={SHELL} metalness={0.7} roughness={0.32} />
      </mesh>

      {/* Vertical post */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.6, 16]} />
        <meshStandardMaterial color={SHELL_HI} metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Frame body — slim panel */}
      <group position={[0, 1.45, 0]}>
        {/* Frame */}
        <mesh castShadow>
          <boxGeometry args={[1.45, 1.45, 0.1]} />
          <meshPhysicalMaterial
            color={SHELL_HI}
            metalness={0.85}
            roughness={0.25}
            clearcoat={0.5}
          />
        </mesh>
        {/* Inset recess */}
        <mesh position={[0, 0, 0.052]}>
          <boxGeometry args={[1.28, 1.28, 0.02]} />
          <meshStandardMaterial color="#080510" metalness={0.5} roughness={0.6} />
        </mesh>

        {/* Pixel grid (8x8) on front face */}
        <group position={[0, 0, 0.066]}>
          {Array.from({ length: GRID * GRID }).map((_, i) => {
            const x = (i % GRID) - (GRID - 1) / 2;
            const y = Math.floor(i / GRID) - (GRID - 1) / 2;
            return (
              <mesh key={i} position={[x * CELL, y * CELL, 0]}>
                <planeGeometry args={[CELL * 0.78, CELL * 0.78]} />
                <meshStandardMaterial
                  ref={(m) => {
                    cellMats.current[i] = m;
                  }}
                  color={ACCENT}
                  emissive={ACCENT}
                  emissiveIntensity={0.8}
                  toneMapped={false}
                />
              </mesh>
            );
          })}
        </group>

        {/* Front emissive ring (intake) */}
        <mesh position={[0, 0, 0.054]}>
          <ringGeometry args={[0.78, 0.84, 64]} />
          <meshStandardMaterial
            ref={ringFrontRef}
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={1.7}
            toneMapped={false}
          />
        </mesh>

        {/* Back ring (outflow) */}
        <mesh position={[0, 0, -0.054]} rotation={[0, Math.PI, 0]}>
          <ringGeometry args={[0.78, 0.84, 64]} />
          <meshStandardMaterial
            ref={ringBackRef}
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={1.3}
            toneMapped={false}
          />
        </mesh>

        {/* Frame inner edge highlight */}
        <mesh position={[0, 0, 0.055]}>
          <ringGeometry args={[0.71, 0.715, 64]} />
          <meshStandardMaterial
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={0.4}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
