import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StationFrame from './StationFrame';
import { getStation } from '../../data/stations';
import { useSelection } from '../../state/selection';

const station = getStation('gtm')!;
const ACCENT = station.accent;

const SHELL = '#0d1828';
const SHELL_HI = '#162338';
const TOKEN_TINTS = ['#5fd4ff', '#8be3ff', '#5fd4ff', '#bff1ff', '#5fd4ff', '#7ad8ff', '#5fd4ff', '#aee8ff'];

export default function Gtm() {
  return (
    <StationFrame station={station} labelOffsetY={2.8} haloRadius={2.0}>
      <GtmGeometry />
    </StationFrame>
  );
}

function GtmGeometry() {
  const { state } = useSelection();
  const isActive = state.hoveredId === 'gtm' || state.selectedId === 'gtm';

  const coreRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const tokensRef = useRef<THREE.Group>(null);
  const antennaTipMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const coreEmissiveRef = useRef<THREE.MeshStandardMaterial>(null);
  const plinthRingMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Token positions: 8 cubes around a ring
  const tokenAngles = useMemo(
    () => Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2),
    [],
  );

  useFrame((stateR3, delta) => {
    const t = stateR3.clock.elapsedTime;
    if (coreRef.current) coreRef.current.rotation.y += delta * 0.55;
    if (ring1Ref.current) ring1Ref.current.rotation.y -= delta * 0.22;
    if (tokensRef.current) tokensRef.current.rotation.y += delta * 0.12;

    const pulse = 0.85 + Math.sin(t * 1.6) * 0.25;
    if (antennaTipMatRef.current) {
      antennaTipMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        antennaTipMatRef.current.emissiveIntensity,
        (isActive ? 2.6 : 1.6) * pulse,
        6,
        delta,
      );
    }
    if (coreEmissiveRef.current) {
      coreEmissiveRef.current.emissiveIntensity = THREE.MathUtils.damp(
        coreEmissiveRef.current.emissiveIntensity,
        isActive ? 2.2 : 1.4,
        5,
        delta,
      );
    }
    if (plinthRingMatRef.current) {
      plinthRingMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        plinthRingMatRef.current.emissiveIntensity,
        isActive ? 1.8 : 0.95,
        5,
        delta,
      );
    }
  });

  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.4, 1.45, 0.32, 64]} />
        <meshStandardMaterial color={SHELL} metalness={0.78} roughness={0.32} envMapIntensity={1.1} />
      </mesh>
      {/* Plinth top inset */}
      <mesh position={[0, 0.325, 0]} receiveShadow>
        <cylinderGeometry args={[1.28, 1.28, 0.02, 64]} />
        <meshStandardMaterial color="#08111e" metalness={0.6} roughness={0.55} />
      </mesh>
      {/* Plinth emissive ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.337, 0]}>
        <ringGeometry args={[1.18, 1.24, 96]} />
        <meshStandardMaterial
          ref={plinthRingMatRef}
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={0.95}
          metalness={0}
          roughness={1}
          toneMapped={false}
        />
      </mesh>

      {/* Spinning core group */}
      <group ref={coreRef} position={[0, 1.05, 0]}>
        {/* Outer faceted shell */}
        <mesh castShadow>
          <icosahedronGeometry args={[0.5, 1]} />
          <meshPhysicalMaterial
            color={SHELL_HI}
            metalness={0.9}
            roughness={0.22}
            clearcoat={0.6}
            clearcoatRoughness={0.35}
            envMapIntensity={1.4}
          />
        </mesh>
        {/* Inner emissive sphere visible through facets */}
        <mesh>
          <sphereGeometry args={[0.32, 32, 32]} />
          <meshStandardMaterial
            ref={coreEmissiveRef}
            color="#0a1a26"
            emissive={ACCENT}
            emissiveIntensity={1.4}
            roughness={0.5}
            metalness={0}
            toneMapped={false}
          />
        </mesh>
        {/* Equatorial bright ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.012, 12, 96]} />
          <meshStandardMaterial
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={2.2}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Toothed mid-ring */}
      <mesh ref={ring1Ref} position={[0, 1.05, 0]} castShadow>
        <torusGeometry args={[0.92, 0.06, 16, 96]} />
        <meshStandardMaterial color={SHELL_HI} metalness={0.85} roughness={0.28} envMapIntensity={1.2} />
      </mesh>
      {/* Mid-ring teeth (decorative) */}
      <group position={[0, 1.05, 0]}>
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.92, 0, Math.sin(a) * 0.92]}
              rotation={[0, -a, 0]}
            >
              <boxGeometry args={[0.06, 0.05, 0.16]} />
              <meshStandardMaterial color={SHELL_HI} metalness={0.85} roughness={0.3} />
            </mesh>
          );
        })}
      </group>

      {/* Tag tokens orbit ring */}
      <group ref={tokensRef} position={[0, 1.25, 0]}>
        {tokenAngles.map((a, i) => (
          <group key={i} position={[Math.cos(a) * 1.7, 0, Math.sin(a) * 1.7]} rotation={[0, -a, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.22, 0.22, 0.22]} />
              <meshPhysicalMaterial
                color={SHELL}
                metalness={0.78}
                roughness={0.32}
                clearcoat={0.4}
                envMapIntensity={1.2}
              />
            </mesh>
            {/* Emissive accent stripe on the front face */}
            <mesh position={[0.111, 0, 0]}>
              <planeGeometry args={[0.07, 0.18]} />
              <meshStandardMaterial
                color={TOKEN_TINTS[i]}
                emissive={TOKEN_TINTS[i]}
                emissiveIntensity={1.7}
                toneMapped={false}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Faint trailing line back to core */}
            <mesh position={[-0.85, 0, 0]}>
              <boxGeometry args={[1.7, 0.005, 0.005]} />
              <meshStandardMaterial
                color={ACCENT}
                emissive={ACCENT}
                emissiveIntensity={0.5}
                transparent
                opacity={0.35}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Antenna */}
      <mesh position={[0, 1.95, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.04, 1.35, 16]} />
        <meshStandardMaterial color={SHELL_HI} metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, 2.7, 0]}>
        <sphereGeometry args={[0.085, 24, 24]} />
        <meshStandardMaterial
          ref={antennaTipMatRef}
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
      {/* Antenna glow halo */}
      <mesh position={[0, 2.7, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  );
}
