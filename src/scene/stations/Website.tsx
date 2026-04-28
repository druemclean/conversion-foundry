import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StationFrame from './StationFrame';
import { getStation } from '../../data/stations';
import { useSelection } from '../../state/selection';

const station = getStation('website')!;
const ACCENT = station.accent;

const SHELL = '#0e1424';
const SHELL_HI = '#1a2640';
const SCREEN_BG = '#06101e';

export default function Website() {
  return (
    <StationFrame station={station} labelOffsetY={2.4} haloRadius={1.6}>
      <Geometry />
    </StationFrame>
  );
}

function Geometry() {
  const { state } = useSelection();
  const isActive = state.hoveredId === station.id || state.selectedId === station.id;

  const cursorRef = useRef<THREE.MeshStandardMaterial>(null);
  const urlBarRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;
    if (cursorRef.current) {
      const blink = (Math.sin(t * 1.4) + 1) * 0.5;
      cursorRef.current.emissiveIntensity = THREE.MathUtils.damp(
        cursorRef.current.emissiveIntensity,
        (isActive ? 1.6 : 1.0) * (0.5 + blink * 0.7),
        6,
        delta,
      );
    }
    if (urlBarRef.current) {
      urlBarRef.current.emissiveIntensity = THREE.MathUtils.damp(
        urlBarRef.current.emissiveIntensity,
        isActive ? 1.0 : 0.5,
        4,
        delta,
      );
    }
  });

  return (
    <group>
      {/* Pedestal */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.6, 0.1, 48]} />
        <meshStandardMaterial color={SHELL} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Stand */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.8, 16]} />
        <meshStandardMaterial color={SHELL_HI} metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Stand pivot */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={SHELL_HI} metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Monitor body, slightly tilted forward */}
      <group position={[0, 1.55, 0]} rotation={[-0.08, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.7, 1.05, 0.16]} />
          <meshPhysicalMaterial
            color={SHELL}
            metalness={0.55}
            roughness={0.32}
            clearcoat={0.4}
            envMapIntensity={1.0}
          />
        </mesh>

        {/* Screen recess */}
        <mesh position={[0, 0, 0.082]}>
          <planeGeometry args={[1.55, 0.92]} />
          <meshStandardMaterial color={SCREEN_BG} metalness={0} roughness={0.9} />
        </mesh>

        {/* Browser top bar */}
        <mesh position={[0, 0.36, 0.084]}>
          <planeGeometry args={[1.5, 0.16]} />
          <meshStandardMaterial color="#0c1830" metalness={0} roughness={1} />
        </mesh>
        {/* Traffic lights */}
        {[
          ['#ff5f57', -0.66],
          ['#febc2e', -0.56],
          ['#28c840', -0.46],
        ].map(([c, x]) => (
          <mesh key={c as string} position={[x as number, 0.36, 0.09]}>
            <circleGeometry args={[0.028, 24]} />
            <meshStandardMaterial
              color={c as string}
              emissive={c as string}
              emissiveIntensity={0.55}
              toneMapped={false}
            />
          </mesh>
        ))}

        {/* URL bar */}
        <mesh position={[0.1, 0.36, 0.087]}>
          <planeGeometry args={[1.0, 0.06]} />
          <meshStandardMaterial
            ref={urlBarRef}
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={0.5}
            toneMapped={false}
          />
        </mesh>

        {/* Page content lines */}
        {[0.18, 0.05, -0.08, -0.21].map((y, i) => (
          <mesh key={i} position={[i % 2 === 0 ? -0.2 : -0.05, y, 0.085]}>
            <planeGeometry args={[i === 0 ? 0.9 : 0.7, 0.02]} />
            <meshStandardMaterial color="#384a6a" />
          </mesh>
        ))}

        {/* Cursor blip */}
        <mesh position={[0.32, -0.1, 0.092]}>
          <circleGeometry args={[0.035, 24]} />
          <meshStandardMaterial
            ref={cursorRef}
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={1.0}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
