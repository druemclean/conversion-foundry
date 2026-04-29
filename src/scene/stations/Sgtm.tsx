import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StationFrame from './StationFrame';
import { getStation } from '../../data/stations';
import { useSelection } from '../../state/selection';

const station = getStation('sgtm')!;
const ACCENT = station.accent;
const SHELL = '#0a1612';
const SHELL_HI = '#152721';

// sGTM is rendered as a "ghost" — alternative architecture. Emissives are at
// 0.4× normal and shells are partially transparent so it reads as not-in-use.
const ALT_DIM = 0.4;
const ALT_OPACITY = 0.65;

const LED_COUNT = 8;

export default function Sgtm() {
  return (
    <StationFrame station={station} labelOffsetY={2.6} haloRadius={1.4}>
      <Geometry />
    </StationFrame>
  );
}

function Geometry() {
  const { state } = useSelection();
  const isActive = state.hoveredId === station.id || state.selectedId === station.id;

  const ledMatsRef = useRef<Array<THREE.MeshStandardMaterial | null>>([]);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;
    ledMatsRef.current.forEach((m, i) => {
      if (!m) return;
      // Each LED blinks at its own offset
      const phase = i * 1.7;
      const blink = (Math.sin(t * 1.4 + phase) + 1) * 0.5;
      const target = (isActive ? 1.4 : 0.9) * ALT_DIM * (0.3 + blink * 0.7);
      m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, target, 8, delta);
    });
  });

  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.2, 1.0]} />
        <meshStandardMaterial color={SHELL} metalness={0.55} roughness={0.4} transparent opacity={ALT_OPACITY} />
      </mesh>

      {/* Server rack body */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[1.3, 1.6, 0.85]} />
        <meshPhysicalMaterial
          color={SHELL_HI}
          metalness={0.7}
          roughness={0.3}
          clearcoat={0.4}
          transparent
          opacity={ALT_OPACITY}
        />
      </mesh>

      {/* Glass front panel */}
      <mesh position={[0, 1.0, 0.43]}>
        <planeGeometry args={[1.18, 1.5]} />
        <meshPhysicalMaterial
          color="#0a1612"
          metalness={0}
          roughness={0.1}
          transmission={0.5}
          transparent
          opacity={0.35}
          ior={1.4}
        />
      </mesh>

      {/* Server rack ribbed slots — 5 horizontal slots */}
      {[0.5, 0.25, 0, -0.25, -0.5].map((y, i) => (
        <group key={i} position={[0, 1.0 + y, 0.434]}>
          <mesh>
            <boxGeometry args={[1.05, 0.18, 0.01]} />
            <meshStandardMaterial
              color="#020806"
              metalness={0.3}
              roughness={0.7}
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* Tiny ribbed lines */}
          {Array.from({ length: 12 }).map((_, j) => (
            <mesh key={j} position={[(j - 5.5) * 0.085, 0, 0.005]}>
              <boxGeometry args={[0.005, 0.13, 0.002]} />
              <meshStandardMaterial color="#1a2920" metalness={0.4} roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Activity LEDs (8 small dots, blinking, dimmer than primary) */}
      {Array.from({ length: LED_COUNT }).map((_, i) => {
        const x = -0.42 + (i % 4) * 0.28;
        const y = 1.7 + Math.floor(i / 4) * 0.06;
        return (
          <mesh key={i} position={[x, y, 0.44]}>
            <circleGeometry args={[0.012, 12]} />
            <meshStandardMaterial
              ref={(m) => {
                ledMatsRef.current[i] = m;
              }}
              color={ACCENT}
              emissive={ACCENT}
              emissiveIntensity={0.5}
              toneMapped={false}
            />
          </mesh>
        );
      })}

      {/* Top vent */}
      <mesh position={[0, 1.85, 0]}>
        <boxGeometry args={[1.32, 0.05, 0.86]} />
        <meshStandardMaterial color={SHELL} metalness={0.7} roughness={0.4} transparent opacity={ALT_OPACITY} />
      </mesh>
    </group>
  );
}
