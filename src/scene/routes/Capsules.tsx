import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { RouteDatum } from '../../data/routes';
import { useSelection } from '../../state/selection';

const BASE_SPEED = 0.06;
const HERO_SPEED_MUL = 0.7;
const HOVER_SPEED_MUL = 0.3; // per the brief: 30% speed when route is hovered
const HERO_LABEL_MS = 2400;

type CapsulesProps = {
  route: RouteDatum;
  curve: THREE.QuadraticBezierCurve3;
  reverse?: boolean;
};

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function manualVisible(t: number, slotIndex: number, totalSlots: number): boolean {
  const CLUMP = 5;
  const PERIOD = 6.5;
  const cycleTime = t % PERIOD;
  if (cycleTime > 2.5) return false;
  const visibleSlots = Math.floor((cycleTime / 2.5) * CLUMP);
  return slotIndex < Math.min(visibleSlots, CLUMP) && slotIndex < totalSlots;
}

export default function Capsules({ route, curve, reverse = false }: CapsulesProps) {
  const { state } = useSelection();
  const groupRef = useRef<THREE.Group>(null);
  const heroRef = useRef<THREE.Group>(null);
  const heroHaloRef = useRef<THREE.MeshBasicMaterial>(null);
  const heroLabelRef = useRef<HTMLDivElement>(null);
  const capsuleLabelRefs = useRef<Array<HTMLDivElement | null>>([]);

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

  const isRouteHovered = state.hoveredRouteId === route.id;

  useFrame((stateR3) => {
    const t = stateR3.clock.elapsedTime;
    const speedMul = isRouteHovered ? HOVER_SPEED_MUL : 1.0;
    const speed = BASE_SPEED * route.density * speedMul;
    const cycle = (t * speed) % 1;

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

    // Per-capsule hover labels: only set opacity here so React doesn't
    // rerender every frame.
    capsuleLabelRefs.current.forEach((el) => {
      if (!el) return;
      el.style.opacity = isRouteHovered ? '0.95' : '0';
    });

    if (heroRef.current && eventsList.length > 0) {
      const heroSpeed = BASE_SPEED * route.density * HERO_SPEED_MUL * speedMul;
      const heroCycle = (t * heroSpeed) % 1;
      let raw = heroCycle;
      if (reverse) raw = 1 - raw;
      const eased = smoothstep(raw);
      const p = curve.getPointAt(eased);
      heroRef.current.position.set(p.x, p.y, p.z);

      if (heroHaloRef.current) {
        heroHaloRef.current.opacity = 0.18 + Math.sin(t * 2.6) * 0.06;
      }

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
      {/* Standard capsules */}
      <group ref={groupRef}>
        {phases.map((_, i) => {
          // Each capsule has a stable label assignment (cycled across events)
          // so on-hover the route's full schema is visible at a glance.
          const eventLabel = eventsList[i % Math.max(1, eventsList.length)] ?? '';
          return (
            <mesh key={i}>
              <sphereGeometry args={[normalSize, 12, 12]} />
              <meshStandardMaterial
                color={route.color}
                emissive={route.color}
                emissiveIntensity={intensity}
                toneMapped={false}
              />
              {eventLabel && (
                <Html
                  center
                  position={[0, normalSize * 1.7, 0]}
                  distanceFactor={12}
                  zIndexRange={[5, 0]}
                  style={{ pointerEvents: 'none' }}
                >
                  <div
                    ref={(el) => {
                      capsuleLabelRefs.current[i] = el;
                    }}
                    className="whitespace-nowrap font-mono"
                    style={{
                      fontSize: '10px',
                      letterSpacing: '0.04em',
                      color: route.color,
                      textShadow: '0 1px 14px rgba(2,3,10,0.85)',
                      opacity: 0,
                      transition: 'opacity 0.18s ease-out',
                    }}
                  >
                    {eventLabel}
                  </div>
                </Html>
              )}
            </mesh>
          );
        })}
      </group>

      {/* Hero */}
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
