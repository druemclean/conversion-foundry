import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { RouteDatum } from '../../data/routes';

const BASE_SPEED = 0.06; // curve fraction per second at density=1.0
const HERO_SPEED_MUL = 0.7;
const HERO_LABEL_MS = 2400;

type CapsulesProps = {
  route: RouteDatum;
  curve: THREE.QuadraticBezierCurve3;
  /** If true, capsules travel curve in reverse (hybrid platform return signals). */
  reverse?: boolean;
};

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

/**
 * Bursty manual upload cadence: a clump of 5, then a 4-second gap, then
 * another clump. Returns true if a capsule at this slot should be visible
 * right now. Each capsule's "phase" within the burst determines slot.
 */
function manualVisible(t: number, slotIndex: number, totalSlots: number): boolean {
  const CLUMP = 5;
  const PERIOD = 6.5; // 5 capsules over ~2.5s + 4s gap
  const cycleTime = t % PERIOD;
  if (cycleTime > 2.5) return false; // gap
  const visibleSlots = Math.floor((cycleTime / 2.5) * CLUMP);
  return slotIndex < Math.min(visibleSlots, CLUMP) && slotIndex < totalSlots;
}

export default function Capsules({ route, curve, reverse = false }: CapsulesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const heroRef = useRef<THREE.Group>(null);
  const heroHaloRef = useRef<THREE.MeshBasicMaterial>(null);
  const heroLabelRef = useRef<HTMLDivElement>(null);

  // Number of in-flight capsules. ~4 per density unit gives a continuous read.
  const count = Math.max(2, Math.ceil(route.density * 4));
  const phases = useMemo(
    () => Array.from({ length: count }, (_, i) => i / count),
    [count],
  );

  const heroSize = reverse ? 0.13 : 0.18;
  const normalSize = reverse ? 0.07 : 0.10;
  const intensity = reverse ? 0.95 : 1.55;
  const heroIntensity = reverse ? 1.4 : 2.2;

  const eventsList = reverse ? route.returnEvents ?? [] : route.events;
  const heroIndexRef = useRef(0);
  const lastSwapRef = useRef(0);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const speed = BASE_SPEED * route.density;
    const cycle = (t * speed) % 1;

    // Move standard capsules.
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const visible =
          route.style === 'manual' ? manualVisible(t, i, count) : true;
        child.visible = visible;
        if (!visible) return;
        let raw = (cycle + phases[i]) % 1;
        if (reverse) raw = 1 - raw;
        const eased = smoothstep(raw);
        const p = curve.getPointAt(eased);
        child.position.set(p.x, p.y, p.z);
      });
    }

    // Hero capsule — slightly slower so its label hangs around the eye.
    if (heroRef.current && eventsList.length > 0) {
      const heroCycle = (t * speed * HERO_SPEED_MUL) % 1;
      let raw = heroCycle;
      if (reverse) raw = 1 - raw;
      const eased = smoothstep(raw);
      const p = curve.getPointAt(eased);
      heroRef.current.position.set(p.x, p.y, p.z);

      // Halo pulses subtly so the hero reads as the labeled one.
      if (heroHaloRef.current) {
        heroHaloRef.current.opacity = 0.18 + Math.sin(t * 2.6) * 0.06;
      }

      // Cycle the label text at a steady cadence.
      const elapsed = t * 1000 - lastSwapRef.current;
      if (elapsed > HERO_LABEL_MS) {
        heroIndexRef.current = (heroIndexRef.current + 1) % eventsList.length;
        lastSwapRef.current = t * 1000;
        if (heroLabelRef.current) {
          heroLabelRef.current.textContent = eventsList[heroIndexRef.current];
        }
      }
    }
  });

  return (
    <group>
      {/* Standard capsules along the curve */}
      <group ref={groupRef}>
        {phases.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[normalSize, 12, 12]} />
            <meshStandardMaterial
              color={route.color}
              emissive={route.color}
              emissiveIntensity={intensity}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* Hero capsule with billboarded label */}
      {eventsList.length > 0 && (
        <group ref={heroRef}>
          <mesh>
            <sphereGeometry args={[heroSize, 16, 16]} />
            <meshStandardMaterial
              color={route.color}
              emissive={route.color}
              emissiveIntensity={heroIntensity}
              toneMapped={false}
            />
          </mesh>
          {/* Soft halo so the hero is visually distinct */}
          <mesh>
            <sphereGeometry args={[heroSize * 2.2, 16, 16]} />
            <meshBasicMaterial
              ref={heroHaloRef}
              color={route.color}
              transparent
              opacity={0.18}
              depthWrite={false}
            />
          </mesh>
          <Html
            center
            position={[0, heroSize * 1.8, 0]}
            distanceFactor={12}
            zIndexRange={[5, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <div
              ref={heroLabelRef}
              className="whitespace-nowrap font-mono"
              style={{
                fontSize: '11px',
                letterSpacing: '0.04em',
                color: route.color,
                textShadow: '0 1px 14px rgba(2,3,10,0.85)',
                opacity: reverse ? 0.7 : 0.95,
              }}
            >
              {eventsList[0]}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}
