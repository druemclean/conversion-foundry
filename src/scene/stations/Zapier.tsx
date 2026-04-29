import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StationFrame from './StationFrame';
import { getStation } from '../../data/stations';
import { useSelection } from '../../state/selection';

const station = getStation('zapier')!;
const ACCENT = station.accent;
const SHELL = '#0d1a14';
const SHELL_HI = '#1a2c22';

const PORT_COUNT = 8;
const PORT_RADIUS = 0.78;

export default function Zapier() {
  return (
    <StationFrame station={station} labelOffsetY={2.4} haloRadius={1.5}>
      <Geometry />
    </StationFrame>
  );
}

function Geometry() {
  const { state } = useSelection();
  const isActive = state.hoveredId === station.id || state.selectedId === station.id;

  const portMatsRef = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const boltRef = useRef<THREE.Group>(null);
  const boltMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const gearRef = useRef<THREE.Mesh>(null);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;
    if (gearRef.current) gearRef.current.rotation.y += delta * 0.32;
    if (boltRef.current) {
      boltRef.current.rotation.y = Math.sin(t * 0.4) * 0.08;
    }
    if (boltMatRef.current) {
      // Lightning bolt pulses fast — like a webhook firing
      const pulse = (Math.sin(t * 3.0) + 1) * 0.5;
      boltMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        boltMatRef.current.emissiveIntensity,
        (isActive ? 2.4 : 1.6) * (0.4 + pulse * 0.7),
        7,
        delta,
      );
    }
    portMatsRef.current.forEach((m, i) => {
      if (!m) return;
      // Port LEDs cascade around the ring at a slow pace
      const phase = (i / PORT_COUNT) * Math.PI * 2;
      const wave = Math.sin(t * 1.0 - phase);
      const lit = wave > 0 ? wave : 0.1;
      m.emissiveIntensity = (isActive ? 1.8 : 1.2) * lit;
    });
  });

  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.05, 0.28, 48]} />
        <meshStandardMaterial color={SHELL} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Plinth top inset */}
      <mesh position={[0, 0.285, 0]} receiveShadow>
        <cylinderGeometry args={[0.92, 0.92, 0.02, 48]} />
        <meshStandardMaterial color="#08120e" metalness={0.5} roughness={0.6} />
      </mesh>

      {/* Switchboard hub — central drum with toothed gear pattern */}
      <mesh ref={gearRef} position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.5, 12]} />
        <meshPhysicalMaterial
          color={SHELL_HI}
          metalness={0.85}
          roughness={0.28}
          clearcoat={0.4}
        />
      </mesh>
      {/* Gear teeth */}
      <group position={[0, 0.7, 0]}>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55]}
              rotation={[0, -a, 0]}
              castShadow
            >
              <boxGeometry args={[0.1, 0.5, 0.18]} />
              <meshStandardMaterial color={SHELL_HI} metalness={0.85} roughness={0.3} />
            </mesh>
          );
        })}
      </group>

      {/* Port ring — 8 ports arranged around the gear at slightly larger radius */}
      <group position={[0, 1.1, 0]}>
        {Array.from({ length: PORT_COUNT }).map((_, i) => {
          const a = (i / PORT_COUNT) * Math.PI * 2;
          return (
            <group
              key={i}
              position={[Math.cos(a) * PORT_RADIUS, 0, Math.sin(a) * PORT_RADIUS]}
              rotation={[0, -a + Math.PI / 2, 0]}
            >
              {/* Port socket */}
              <mesh castShadow>
                <boxGeometry args={[0.18, 0.18, 0.14]} />
                <meshStandardMaterial color={SHELL_HI} metalness={0.85} roughness={0.3} />
              </mesh>
              {/* Port LED */}
              <mesh position={[0, 0, 0.071]}>
                <circleGeometry args={[0.05, 16]} />
                <meshStandardMaterial
                  ref={(m) => {
                    portMatsRef.current[i] = m;
                  }}
                  color={ACCENT}
                  emissive={ACCENT}
                  emissiveIntensity={1.4}
                  toneMapped={false}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Lightning bolt threaded through the center — vertical and centered */}
      <group ref={boltRef} position={[0, 1.0, 0]}>
        {/* Bolt is a stylized zigzag — three offset boxes connected */}
        <mesh position={[0, 0.4, 0]} rotation={[0, 0, 0.45]}>
          <boxGeometry args={[0.09, 0.45, 0.05]} />
          <meshStandardMaterial
            ref={boltMatRef}
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={1.8}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0.06, 0, 0]} rotation={[0, 0, -0.45]}>
          <boxGeometry args={[0.09, 0.4, 0.05]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.4, 0]} rotation={[0, 0, 0.45]}>
          <boxGeometry args={[0.09, 0.42, 0.05]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
        {/* Bolt halo */}
        <mesh>
          <sphereGeometry args={[0.45, 16, 16]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.12} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}
