import { Sparkles } from '@react-three/drei';

/**
 * Slow-drifting volumetric dust at near-mid camera depths. Adds quiet
 * atmospheric weight without dominating the scene. Two layered passes so
 * close-up motes catch the eye and far-back ones thicken the depth read.
 */
export default function Dust() {
  return (
    <>
      <Sparkles
        count={48}
        scale={[40, 18, 40]}
        position={[0, 6, 0]}
        size={2.6}
        speed={0.12}
        opacity={0.22}
        color="#dde6f5"
      />
      <Sparkles
        count={26}
        scale={[28, 12, 28]}
        position={[0, 3, 0]}
        size={1.4}
        speed={0.18}
        opacity={0.32}
        color="#a8c5e8"
      />
    </>
  );
}
