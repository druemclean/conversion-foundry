import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StationFrame from './StationFrame';
import { getStation } from '../../data/stations';
import { useSelection } from '../../state/selection';

const station = getStation('gads')!;
const ACCENT = station.accent;

const SHELL = '#0d1828';
const SHELL_HI = '#162338';

export default function GoogleAds() {
  return (
    <StationFrame station={station} labelOffsetY={2.6} haloRadius={1.7}>
      <Geometry />
    </StationFrame>
  );
}

function Geometry() {
  const { state } = useSelection();
  const isActive = state.hoveredId === station.id || state.selectedId === station.id;

  const intakeRingRef = useRef<THREE.MeshStandardMaterial>(null);
  const outflowRingRef = useRef<THREE.MeshStandardMaterial>(null);
  const bullseyeRef = useRef<THREE.Group>(null);
  const idGridRef = useRef<THREE.Group>(null);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;

    // Intake (front) ring pulses on a slightly different rhythm than outflow (back)
    // to make the bidirectionality readable at a glance.
    if (intakeRingRef.current) {
      intakeRingRef.current.emissiveIntensity = THREE.MathUtils.damp(
        intakeRingRef.current.emissiveIntensity,
        (isActive ? 2.4 : 1.7) * (0.85 + Math.sin(t * 1.4) * 0.25),
        5,
        delta,
      );
    }
    if (outflowRingRef.current) {
      outflowRingRef.current.emissiveIntensity = THREE.MathUtils.damp(
        outflowRingRef.current.emissiveIntensity,
        (isActive ? 1.9 : 1.3) * (0.85 + Math.sin(t * 1.4 + Math.PI) * 0.25),
        5,
        delta,
      );
    }
    if (bullseyeRef.current) bullseyeRef.current.rotation.z += delta * 0.18;
    if (idGridRef.current) idGridRef.current.rotation.z -= delta * 0.12;
  });

  // Frame is oriented so its face is roughly toward the camera (in -x direction
  // since station sits at +x of GTM). We rotate the whole group around Y.
  return (
    <group rotation={[0, -Math.PI * 0.35, 0]}>
      {/* Plinth */}
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.0, 1.05, 0.32, 48]} />
        <meshStandardMaterial color={SHELL} metalness={0.78} roughness={0.32} />
      </mesh>
      {/* Plinth top */}
      <mesh position={[0, 0.325, 0]} receiveShadow>
        <cylinderGeometry args={[0.92, 0.92, 0.02, 48]} />
        <meshStandardMaterial color="#08111e" metalness={0.6} roughness={0.55} />
      </mesh>

      {/* Vertical portal frame (a flat disc on its side, like a porthole) */}
      <group position={[0, 1.55, 0]} rotation={[0, Math.PI / 2, 0]}>
        {/* Outer mechanical bezel */}
        <mesh castShadow>
          <torusGeometry args={[0.95, 0.14, 18, 64]} />
          <meshPhysicalMaterial
            color={SHELL_HI}
            metalness={0.9}
            roughness={0.22}
            clearcoat={0.5}
          />
        </mesh>
        {/* Bezel decorative bolts */}
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0]}
              rotation={[0, 0, a]}
            >
              <boxGeometry args={[0.05, 0.05, 0.32]} />
              <meshStandardMaterial color={SHELL_HI} metalness={0.85} roughness={0.3} />
            </mesh>
          );
        })}

        {/* Front face — intake ring (data flowing IN) */}
        <mesh position={[0, 0, 0.16]}>
          <torusGeometry args={[0.78, 0.04, 12, 64]} />
          <meshStandardMaterial
            ref={intakeRingRef}
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={1.7}
            toneMapped={false}
          />
        </mesh>
        {/* Front face — bullseye (concentric flat rings) */}
        <group ref={bullseyeRef} position={[0, 0, 0.165]}>
          {[0.7, 0.5, 0.3].map((r, i) => (
            <mesh key={r}>
              <ringGeometry args={[r - 0.04, r, 64]} />
              <meshStandardMaterial
                color={ACCENT}
                emissive={ACCENT}
                emissiveIntensity={0.9 - i * 0.18}
                transparent
                opacity={0.85}
                toneMapped={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
          {/* Center dot */}
          <mesh>
            <circleGeometry args={[0.09, 32]} />
            <meshStandardMaterial
              color={ACCENT}
              emissive={ACCENT}
              emissiveIntensity={1.6}
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* Back face — outflow ring (gclid / audience flowing BACK) */}
        <mesh position={[0, 0, -0.16]}>
          <torusGeometry args={[0.78, 0.04, 12, 64]} />
          <meshStandardMaterial
            ref={outflowRingRef}
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={1.3}
            toneMapped={false}
          />
        </mesh>
        {/* Back face — click ID grid (5x5 small cubes, slowly rotating) */}
        <group ref={idGridRef} position={[0, 0, -0.165]}>
          {Array.from({ length: 5 }).flatMap((_, i) =>
            Array.from({ length: 5 }).map((__, j) => {
              const x = (i - 2) * 0.18;
              const y = (j - 2) * 0.18;
              const r = Math.sqrt(x * x + y * y);
              if (r > 0.62) return null;
              const lit = (i + j) % 3 === 0;
              return (
                <mesh key={`${i}-${j}`} position={[x, y, 0]}>
                  <boxGeometry args={[0.085, 0.085, 0.03]} />
                  <meshStandardMaterial
                    color={lit ? ACCENT : '#1a3552'}
                    emissive={lit ? ACCENT : '#000'}
                    emissiveIntensity={lit ? 1.2 : 0}
                    metalness={lit ? 0 : 0.7}
                    roughness={lit ? 1 : 0.35}
                    toneMapped={!lit}
                  />
                </mesh>
              );
            }),
          )}
        </group>

        {/* Centerline interior glass */}
        <mesh>
          <circleGeometry args={[0.78, 64]} />
          <meshPhysicalMaterial
            color="#0a1828"
            metalness={0}
            roughness={0.1}
            transmission={0.6}
            transparent
            opacity={0.45}
            ior={1.35}
            thickness={0.2}
          />
        </mesh>
      </group>
    </group>
  );
}
