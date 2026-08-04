import { OrbitControls } from '@react-three/drei';

/**
 * Spec §9.1: one long-lens perspective camera, not ortho. At this distance a
 * 22° field of view reads as near-orthographic across the whole hillside,
 * which is what the §10.2 overlook wants; moving in gives natural perspective
 * at the water's edge without a projection change.
 */
export const OVERLOOK = {
  position: [0, 120, 165] as [number, number, number],
  target: [0, 4, -4] as [number, number, number],
  fov: 22,
};

/**
 * §11.1 is non-interactive as far as the *system* goes. Look-around is kept
 * because the deliverable is "look at it" and that cannot be judged from one
 * fixed frame. Clamped so the hillside can never be viewed from below.
 */
export default function Camera() {
  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      target={OVERLOOK.target}
      minDistance={30}
      maxDistance={280}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI * 0.47}
    />
  );
}
