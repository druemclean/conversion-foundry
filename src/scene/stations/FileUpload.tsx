import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StationFrame from './StationFrame';
import { getStation } from '../../data/stations';
import { useSelection } from '../../state/selection';

const station = getStation('fileupload')!;
const ACCENT = station.accent;
const SHELL = '#0d1a14';

const PAGE_COUNT = 5;

export default function FileUpload() {
  return (
    <StationFrame station={station} labelOffsetY={1.6} haloRadius={1.1}>
      <Geometry />
    </StationFrame>
  );
}

function Geometry() {
  const { state } = useSelection();
  const isActive = state.hoveredId === station.id || state.selectedId === station.id;

  const arrowRef = useRef<THREE.Group>(null);
  const arrowMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const rowMats = useRef<Array<THREE.MeshStandardMaterial | null>>([]);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;
    // Upload arrow bobs upward subtly
    if (arrowRef.current) {
      arrowRef.current.position.y = 0.95 + Math.sin(t * 1.4) * 0.06;
    }
    if (arrowMatRef.current) {
      arrowMatRef.current.emissiveIntensity = THREE.MathUtils.damp(
        arrowMatRef.current.emissiveIntensity,
        (isActive ? 2.0 : 1.4) * (0.6 + (Math.sin(t * 1.4) + 1) * 0.3),
        5,
        delta,
      );
    }
    rowMats.current.forEach((m, i) => {
      if (!m) return;
      const phase = i * 0.6;
      m.emissiveIntensity = (isActive ? 1.0 : 0.55) * (0.4 + (Math.sin(t * 0.7 + phase) + 1) * 0.25);
    });
  });

  return (
    <group>
      {/* Small plinth */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.12, 0.7]} />
        <meshStandardMaterial color={SHELL} metalness={0.5} roughness={0.45} />
      </mesh>

      {/* CSV page stack — 5 thin rectangular boxes stacked at slight offsets */}
      {Array.from({ length: PAGE_COUNT }).map((_, i) => {
        const y = 0.18 + i * 0.045;
        const offsetX = (i - (PAGE_COUNT - 1) / 2) * 0.04;
        const offsetZ = Math.sin(i * 0.7) * 0.04;
        return (
          <group key={i} position={[offsetX, y, offsetZ]}>
            <mesh castShadow>
              <boxGeometry args={[0.7, 0.025, 0.55]} />
              <meshStandardMaterial color="#dde8e0" metalness={0} roughness={0.85} />
            </mesh>
            {/* CSV row separator emissive line on the top page */}
            <mesh position={[0, 0.013, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.55, 0.005]} />
              <meshStandardMaterial
                ref={(m) => {
                  rowMats.current[i] = m;
                }}
                color={ACCENT}
                emissive={ACCENT}
                emissiveIntensity={0.55}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}

      {/* Tabular ledger lines on the top page */}
      <group position={[0, 0.42, 0]}>
        {[0.16, 0.08, 0, -0.08, -0.16].map((z, i) => (
          <mesh key={i} position={[0, 0.001, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.6, 0.006]} />
            <meshStandardMaterial color="#3a4a40" metalness={0} roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Floating upload arrow above the stack */}
      <group ref={arrowRef} position={[0, 0.95, 0]}>
        {/* Arrow shaft */}
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 12]} />
          <meshStandardMaterial
            ref={arrowMatRef}
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={1.4}
            toneMapped={false}
          />
        </mesh>
        {/* Arrow head */}
        <mesh position={[0, 0.32, 0]}>
          <coneGeometry args={[0.12, 0.22, 16]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        {/* Arrow halo */}
        <mesh>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.15} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}
