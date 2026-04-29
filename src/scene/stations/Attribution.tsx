import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import StationFrame from './StationFrame';
import { getStation } from '../../data/stations';
import { useSelection } from '../../state/selection';

const station = getStation('attribution')!;
const ACCENT = station.accent;

const CONVERGE_LINES = 6;
const LINE_RADIUS = 5.5;
// Lines start in local space below the summit (y = -8 in local = ground level
// in world since Attribution sits at world y=8) and end at the crystal center.
const LINE_END = new THREE.Vector3(0, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

function lineStart(i: number): THREE.Vector3 {
  const a = (i / CONVERGE_LINES) * Math.PI * 2;
  return new THREE.Vector3(Math.cos(a) * LINE_RADIUS, -8, Math.sin(a) * LINE_RADIUS);
}

type ConvergingLineProps = {
  startWorld: THREE.Vector3;
  endWorld: THREE.Vector3;
  matRef: (m: THREE.MeshStandardMaterial | null) => void;
};

function ConvergingLine({ startWorld, endWorld, matRef }: ConvergingLineProps) {
  // Compute orientation: a Y-axis cylinder rotated so its +Y matches the
  // start->end direction, then positioned at the midpoint.
  const dir = endWorld.clone().sub(startWorld);
  const len = dir.length();
  const mid = startWorld.clone().add(dir.clone().multiplyScalar(0.5));
  const quat = new THREE.Quaternion().setFromUnitVectors(Y_AXIS, dir.clone().normalize());
  const euler = new THREE.Euler().setFromQuaternion(quat);

  return (
    <mesh
      position={mid.toArray()}
      rotation={[euler.x, euler.y, euler.z]}
    >
      <cylinderGeometry args={[0.022, 0.022, len, 8]} />
      <meshStandardMaterial
        ref={matRef}
        color={ACCENT}
        emissive={ACCENT}
        emissiveIntensity={1.0}
        transparent
        opacity={0.75}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function Attribution() {
  return (
    <StationFrame station={station} labelOffsetY={2.0} haloRadius={1.6}>
      <Geometry />
    </StationFrame>
  );
}

function Geometry() {
  const { state } = useSelection();
  const isActive = state.hoveredId === station.id || state.selectedId === station.id;

  const crystalRef = useRef<THREE.Group>(null);
  const innerCoreRef = useRef<THREE.MeshStandardMaterial>(null);
  const lineRefs = useRef<Array<THREE.MeshStandardMaterial | null>>([]);

  useFrame((s, delta) => {
    const t = s.clock.elapsedTime;
    if (crystalRef.current) {
      crystalRef.current.rotation.y += delta * 0.18;
      crystalRef.current.rotation.x = Math.sin(t * 0.3) * 0.06;
    }
    if (innerCoreRef.current) {
      innerCoreRef.current.emissiveIntensity = THREE.MathUtils.damp(
        innerCoreRef.current.emissiveIntensity,
        (isActive ? 2.6 : 1.6) * (0.7 + Math.sin(t * 0.9) * 0.3),
        5,
        delta,
      );
    }
    lineRefs.current.forEach((m, i) => {
      if (!m) return;
      const phase = i * 0.8;
      m.emissiveIntensity = (isActive ? 1.6 : 1.0) * (0.4 + (Math.sin(t * 1.1 + phase) + 1) * 0.3);
    });
  });

  return (
    <group>
      {/* Geodesic crystal at the summit — the apex of the whole scene */}
      <group ref={crystalRef}>
        {/* Outer faceted shell */}
        <mesh castShadow>
          <icosahedronGeometry args={[0.7, 0]} />
          <meshPhysicalMaterial
            color="#1a2540"
            metalness={0.9}
            roughness={0.18}
            clearcoat={0.7}
            clearcoatRoughness={0.25}
            envMapIntensity={1.6}
          />
        </mesh>
        {/* Wireframe-like outer ring of edges */}
        <mesh>
          <icosahedronGeometry args={[0.72, 0]} />
          <meshBasicMaterial color={ACCENT} wireframe transparent opacity={0.55} />
        </mesh>
        {/* Inner emissive core glowing through facets */}
        <mesh>
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshStandardMaterial
            ref={innerCoreRef}
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={1.6}
            toneMapped={false}
          />
        </mesh>
        {/* Equatorial ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.78, 0.014, 12, 80]} />
          <meshStandardMaterial
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={2.0}
            toneMapped={false}
          />
        </mesh>
      </group>

      {Array.from({ length: CONVERGE_LINES }).map((_, i) => (
        <ConvergingLine
          key={i}
          startWorld={lineStart(i)}
          endWorld={LINE_END}
          matRef={(m) => {
            lineRefs.current[i] = m;
          }}
        />
      ))}
    </group>
  );
}
