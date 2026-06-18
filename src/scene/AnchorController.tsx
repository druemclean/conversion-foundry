import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { STATIONS, type LabelAnchor } from '../data/stations';
import { getRegisteredLabels } from '../state/labelRegistry';

/**
 * Pixel offsets from the projected label position per compass anchor. Kept
 * in sync with StationFrame's fallback table — single source of truth for
 * how a chosen anchor manifests in the DOM.
 */
export const ANCHOR_OFFSET: Record<LabelAnchor, [number, number]> = {
  N: [0, -2],
  NE: [62, -2],
  NW: [-62, -2],
  E: [88, 12],
  W: [-88, 12],
  SE: [62, 26],
  SW: [-62, 26],
  S: [0, 4],
};

/**
 * Dynamic candidates: every direction except S. S is reserved as a static
 * override because it requires a world-Y mirror (handled in StationFrame),
 * which can't safely flip frame-to-frame.
 */
const DYNAMIC_DIRS: LabelAnchor[] = ['N', 'NE', 'E', 'SE', 'SW', 'W', 'NW'];

const COLLISION_RADIUS_PX = 100;
const HYSTERESIS_MARGIN = 12;

/**
 * Per-frame: project each station to screen, then for each station (with no
 * static anchor) pick the direction with the most empty space relative to
 * nearby station projections. Writes CSS transforms directly to the
 * registered label refs — no React state involved.
 */
export default function AnchorController() {
  const { camera, size } = useThree();
  const lastAnchors = useRef<Map<string, LabelAnchor>>(new Map());
  const tempV = useRef(new THREE.Vector3()).current;

  useFrame(() => {
    const labels = getRegisteredLabels();
    if (labels.size === 0) return;

    // Project each station to screen-pixel space. A small +1.5 world-Y bump
    // approximates "near the station's top" without needing every station's
    // exact labelOffsetY — only the relative positions matter for the
    // empty-space search.
    const projs: Array<{ id: string; x: number; y: number }> = [];
    for (const s of STATIONS) {
      tempV.set(s.position[0], s.position[1] + 1.5, s.position[2]);
      tempV.project(camera);
      const x = (tempV.x * 0.5 + 0.5) * size.width;
      const y = (-tempV.y * 0.5 + 0.5) * size.height;
      projs.push({ id: s.id, x, y });
    }

    for (let i = 0; i < STATIONS.length; i++) {
      const s = STATIONS[i];
      const p = projs[i];

      // Static override wins. Skip computation, just apply.
      if (s.labelAnchor) {
        applyAnchor(labels, s.id, s.labelAnchor);
        lastAnchors.current.set(s.id, s.labelAnchor);
        continue;
      }

      // Score each candidate direction. We want max-min distance to other
      // station projections (empty space), with a mild preference for N (it
      // has the smallest offset, so when nothing collides it's the most
      // grounded choice).
      let bestDir: LabelAnchor = 'N';
      let bestScore = -Infinity;
      const scores: Record<string, number> = {};

      for (const D of DYNAMIC_DIRS) {
        const [ox, oy] = ANCHOR_OFFSET[D];
        const candX = p.x + ox;
        const candY = p.y + oy;

        let minDist = Infinity;
        for (let j = 0; j < projs.length; j++) {
          if (j === i) continue;
          const o = projs[j];
          const d = Math.hypot(candX - o.x, candY - o.y);
          if (d < minDist) minDist = d;
        }

        // Empty-space score: cap at COLLISION_RADIUS_PX so isolated stations
        // don't all tie at +Infinity — once a candidate is "comfortably
        // empty," extra distance doesn't add value.
        const empty = Math.min(minDist, COLLISION_RADIUS_PX);
        const offsetMag = Math.hypot(ox, oy);
        // Prefer smaller offsets (closer to the station geometry) as a
        // tiebreaker among non-colliding candidates.
        const score = empty - offsetMag * 0.18;

        scores[D] = score;
        if (score > bestScore) {
          bestScore = score;
          bestDir = D;
        }
      }

      // Hysteresis: a new direction must beat the current one by a clear
      // margin before switching. Prevents flicker during camera moves.
      const current = lastAnchors.current.get(s.id);
      let chosen: LabelAnchor = bestDir;
      if (current && current !== bestDir && current !== 'S') {
        const currentScore = scores[current] ?? -Infinity;
        if (bestScore < currentScore + HYSTERESIS_MARGIN) {
          chosen = current;
        }
      }
      lastAnchors.current.set(s.id, chosen);
      applyAnchor(labels, s.id, chosen);
    }
  });

  return null;
}

function applyAnchor(
  labels: Map<string, HTMLDivElement>,
  id: string,
  anchor: LabelAnchor,
) {
  const el = labels.get(id);
  if (!el) return;
  const [tx, ty] = ANCHOR_OFFSET[anchor];
  el.style.transform = `translate(${tx}px, ${ty}px)`;
}
