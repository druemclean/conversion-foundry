import { useEffect, useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useFocus, useSelection } from '../../state/selection';
import type { StationDatum } from '../../data/stations';
import { ANCHOR_OFFSET } from '../AnchorController';
import { registerLabel } from '../../state/labelRegistry';
import { stationIntroT } from '../../state/intro';

type Props = {
  station: StationDatum;
  labelOffsetY: number;
  haloRadius: number;
  children: ReactNode;
};

const DIM_RATIO = 0.12;

/** The three stations a first-time viewer should anchor on. Only these carry
 *  labels in the idle scene; everything else labels on hover/focus. */
const ANCHOR_LABEL_IDS = new Set(['website', 'gtm', 'gads']);

// Reticle cursor — a tighter, more deliberate hover affordance than the
// browser pointer. Hotspot at (12, 12) centers the cross on the click point.
const RETICLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="1"/><line x1="12" y1="2" x2="12" y2="6" stroke="#fff" stroke-opacity="0.85" stroke-width="1"/><line x1="12" y1="18" x2="12" y2="22" stroke="#fff" stroke-opacity="0.85" stroke-width="1"/><line x1="2" y1="12" x2="6" y2="12" stroke="#fff" stroke-opacity="0.85" stroke-width="1"/><line x1="18" y1="12" x2="22" y2="12" stroke="#fff" stroke-opacity="0.85" stroke-width="1"/><circle cx="12" cy="12" r="1.5" fill="#fff" fill-opacity="0.9"/></svg>`;
const RETICLE_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(RETICLE_SVG)}") 12 12, pointer`;

export default function StationFrame({ station, labelOffsetY, haloRadius, children }: Props) {
  const { state, select, hover } = useSelection();
  const focus = useFocus();
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);

  const isHovered = state.hoveredId === station.id;
  const isSelected = state.selectedId === station.id;
  const isFocusedOne = isHovered || isSelected;
  const isDimmed = focus.active && focus.isStationDimmed(station.id);

  // Station label opacity: focused full, connected neighbors mid, dimmed
  // hidden. Idle scene labels only the three anchor stations — twelve
  // simultaneous labels was most of the perceived clutter.
  const labelOpacity = isFocusedOne
    ? 1.0
    : focus.active
      ? isDimmed
        ? 0
        : 0.65
      : ANCHOR_LABEL_IDS.has(station.id)
        ? 0.55
        : 0;

  // Initial CSS offset before AnchorController takes over on first frame.
  // Static S anchor also mirrors the world Y so the label sits below the
  // geometry rather than far above it.
  const initialAnchor = station.labelAnchor ?? 'N';
  const [initDx, initDy] = ANCHOR_OFFSET[initialAnchor];
  const labelWorldY = station.labelAnchor === 'S' ? -labelOffsetY : labelOffsetY;

  useEffect(() => {
    if (isHovered) document.body.style.cursor = RETICLE_CURSOR;
    return () => {
      document.body.style.cursor = '';
    };
  }, [isHovered]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const introT = stationIntroT(station.id);
    // Subtle scale settle during intro reveal — stations grow into place.
    const introScale = 0.94 + 0.06 * introT;
    const targetScale = station.scale * (isHovered ? 1.04 : 1.0) * introScale;
    g.scale.x = THREE.MathUtils.damp(g.scale.x, targetScale, 8, delta);
    g.scale.y = THREE.MathUtils.damp(g.scale.y, targetScale, 8, delta);
    g.scale.z = THREE.MathUtils.damp(g.scale.z, targetScale, 8, delta);

    const h = haloRef.current;
    if (h) {
      const mat = h.material as THREE.MeshBasicMaterial;
      const base = isHovered ? 0.3 : isSelected ? 0.18 : 0.07;
      const target = (isDimmed ? base * DIM_RATIO : base) * introT;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, target, 6, delta);
    }

    // Label opacity is driven directly through the DOM ref so the intro
    // fade can multiply against the focus-derived opacity without forcing
    // a React re-render every frame.
    if (labelRef.current) {
      labelRef.current.style.opacity = String(labelOpacity * introT);
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

      {/* DimLayer must follow {children} so its useFrame registers AFTER any
          station-internal animations — that's what lets us override emissive
          cleanly during dim without fighting blinks/pulses. */}
      <DimLayer groupRef={groupRef} isDimmed={isDimmed} stationId={station.id} />

      {/* zIndexRange caps below the HUD chrome (z-25) so labels can never
          bleed through plates or panels. */}
      <Html
        position={[0, labelWorldY, 0]}
        center
        zIndexRange={[9, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          ref={(el) => {
            labelRef.current = el;
            registerLabel(station.id, el);
          }}
          className="whitespace-nowrap font-mono uppercase text-ink"
          style={{
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.2em',
            opacity: 0,
            padding: '5px 11px',
            borderRadius: 999,
            background: 'rgba(13, 20, 36, 0.62)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(5px) saturate(125%)',
            WebkitBackdropFilter: 'blur(5px) saturate(125%)',
            textShadow: '0 1px 10px rgba(2,3,10,0.9)',
            transform: `translate(${initDx}px, ${initDy}px)`,
            transition:
              'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease-out',
          }}
        >
          {station.name}
        </div>
      </Html>
    </group>
  );
}

/**
 * Captures each material's initial emissiveIntensity once at mount, then
 * scales it down only while the parent station is dimmed. While not dimming,
 * this layer is a no-op so per-station emissive animations (LED blinks,
 * core pulses) run unaffected.
 */
function DimLayer({
  groupRef,
  isDimmed,
  stationId,
}: {
  groupRef: React.RefObject<THREE.Group>;
  isDimmed: boolean;
  stationId: string;
}) {
  const dimRef = useRef(1);

  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!('material' in mesh) || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        const m = mat as THREE.MeshStandardMaterial;
        if (m.emissiveIntensity === undefined) continue;
        if (m.userData._baseEmissive === undefined) {
          m.userData._baseEmissive = m.emissiveIntensity;
        }
      }
    });
  }, [groupRef]);

  useFrame((_, delta) => {
    dimRef.current = THREE.MathUtils.damp(
      dimRef.current,
      isDimmed ? DIM_RATIO : 1.0,
      7,
      delta,
    );
    const dim = dimRef.current;
    const introT = stationIntroT(stationId);
    const effective = dim * introT;
    // No-op when essentially full — let station animations run freely.
    if (effective > 0.985) return;
    const g = groupRef.current;
    if (!g) return;
    g.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!('material' in mesh) || !mesh.material) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        const m = mat as THREE.MeshStandardMaterial;
        const base = m.userData._baseEmissive;
        if (base === undefined) continue;
        m.emissiveIntensity = base * effective;
      }
    });
  });

  return null;
}
