import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StationFrame from './StationFrame';
import { getStation } from '../../data/stations';
import { useSelection } from '../../state/selection';

const station = getStation('capi')!;
const ACCENT = station.accent;
const SHELL = '#1a0a1f';
const SHELL_HI = '#2a1432';

export default function Capi() {
  return (
    <StationFrame station={station} labelOffsetY={2.8} haloRadius={1.5}>
      <Geometry />
    </StationFrame>
  );
}

function Geometry() {
  const { state } = useSelection();
  const isActive = state.hoveredId === station.id || state.selectedId === station.id;

  const verticalRingRef = useRef<THREE.Mesh>(null);
  const horizontalRingRef = useRef<THREE.Mesh>(null);
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const portRefs = useRef<Array<THREE.MeshStandardMaterial | null>>([]);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;
    if (verticalRingRef.current) verticalRingRef.current.rotation.z += delta * 0.32;
    if (horizontalRingRef.current) horizontalRingRef.current.rotation.y -= delta * 0.42;
    if (coreMatRef.current) {
      coreMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        coreMatRef.current.emissiveIntensity,
        (isActive ? 2.6 : 1.7) * (0.8 + Math.sin(t * 1.3) * 0.3),
        5,
        delta,
      );
    }
    portRefs.current.forEach((m, i) => {
      if (!m) return;
      const phase = i * 0.7;
      m.emissiveIntensity = (isActive ? 1.4 : 0.9) * (0.4 + (Math.sin(t * 1.7 + phase) + 1) * 0.3);
    });
  });

  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.05, 0.32, 48]} />
        <meshStandardMaterial color={SHELL} metalness={0.78} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.325, 0]} receiveShadow>
        <cylinderGeometry args={[0.9, 0.9, 0.02, 48]} />
        <meshStandardMaterial color="#0a0410" metalness={0.6} roughness={0.55} />
      </mesh>

      {/* Pylon body — taller, more substantial than Pixel */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.5, 1.5, 24]} />
        <meshPhysicalMaterial
          color={SHELL_HI}
          metalness={0.9}
          roughness={0.22}
          clearcoat={0.55}
        />
      </mesh>

      {/* Server-port grilles — 6 vertical slots around the pylon */}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 0.41, 1.15, Math.sin(a) * 0.41]} rotation={[0, -a + Math.PI, 0]}>
            <mesh>
              <boxGeometry args={[0.18, 0.6, 0.025]} />
              <meshStandardMaterial color="#020108" metalness={0.4} roughness={0.65} />
            </mesh>
            {/* Tiny port LED */}
            <mesh position={[0, 0.32, 0.014]}>
              <circleGeometry args={[0.018, 12]} />
              <meshStandardMaterial
                ref={(m) => {
                  portRefs.current[i] = m;
                }}
                color={ACCENT}
                emissive={ACCENT}
                emissiveIntensity={0.8}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}

      {/* Glowing core sphere INSIDE the pylon (visible through gaps) */}
      <mesh position={[0, 1.15, 0]}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial
          ref={coreMatRef}
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={1.7}
          toneMapped={false}
        />
      </mesh>

      {/* Primary vertical ring (orbits around the pylon) */}
      <mesh ref={verticalRingRef} position={[0, 1.15, 0]} rotation={[0, 0, 0]} castShadow>
        <torusGeometry args={[0.85, 0.045, 16, 96]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={1.8}
          toneMapped={false}
        />
      </mesh>

      {/* Secondary horizontal ring */}
      <mesh ref={horizontalRingRef} position={[0, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.7, 0.035, 16, 96]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={1.4}
          toneMapped={false}
        />
      </mesh>

      {/* Top finial */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 0.2, 16]} />
        <meshStandardMaterial color={SHELL_HI} metalness={0.9} roughness={0.22} />
      </mesh>
      <mesh position={[0, 2.15, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={2.0}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
