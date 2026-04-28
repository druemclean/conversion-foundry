import { useEffect, useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSelection } from '../../state/selection';
import type { StationDatum } from '../../data/stations';

type Props = {
  station: StationDatum;
  labelOffsetY: number;
  haloRadius: number;
  children: ReactNode;
};

export default function StationFrame({ station, labelOffsetY, haloRadius, children }: Props) {
  const { state, select, hover } = useSelection();
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  const isHovered = state.hoveredId === station.id;
  const isSelected = state.selectedId === station.id;

  useEffect(() => {
    if (isHovered) document.body.style.cursor = 'pointer';
    return () => {
      document.body.style.cursor = '';
    };
  }, [isHovered]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const targetScale = station.scale * (isHovered ? 1.04 : 1.0);
    g.scale.x = THREE.MathUtils.damp(g.scale.x, targetScale, 8, delta);
    g.scale.y = THREE.MathUtils.damp(g.scale.y, targetScale, 8, delta);
    g.scale.z = THREE.MathUtils.damp(g.scale.z, targetScale, 8, delta);

    const h = haloRef.current;
    if (h) {
      const mat = h.material as THREE.MeshBasicMaterial;
      const target = isHovered ? 0.3 : isSelected ? 0.18 : 0.07;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, target, 6, delta);
    }
  });

  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hover(station.id);
  };
  const onPointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hover(null);
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    select(station.id);
  };

  return (
    <group
      ref={groupRef}
      position={station.position}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <mesh
        ref={haloRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        renderOrder={-1}
      >
        <ringGeometry args={[haloRadius * 0.96, haloRadius, 96]} />
        <meshBasicMaterial color={station.accent} transparent opacity={0.07} depthWrite={false} />
      </mesh>

      {children}

      <Html
        position={[0, labelOffsetY, 0]}
        center
        distanceFactor={10}
        zIndexRange={[20, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="whitespace-nowrap font-mono uppercase text-ink-dim transition-opacity duration-200"
          style={{
            fontSize: '11px',
            letterSpacing: '0.18em',
            opacity: isHovered || isSelected ? 1 : 0.45,
            textShadow: '0 1px 14px rgba(2,3,10,0.85)',
          }}
        >
          {station.name}
        </div>
      </Html>
    </group>
  );
}
