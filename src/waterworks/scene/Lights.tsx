import { WW_PALETTE } from '../tokens';

/**
 * Spec §7: open sky, low warm sun. One key from the west at a shallow angle
 * so channel cuts and weir faces throw long shadows and read as depth, plus
 * a strong sky/ground hemisphere doing the work the Foundry's emissives do.
 * No coloured rim lights — those are the Foundry's signature.
 */
export default function Lights() {
  return (
    <>
      <hemisphereLight
        args={[WW_PALETTE.skyHigh, WW_PALETTE.hemiGround, 1.35]}
        position={[0, 60, 0]}
      />
      <directionalLight
        position={[-52, 30, 34]}
        intensity={2.2}
        color={WW_PALETTE.sun}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={1}
        shadow-camera-far={220}
        shadow-camera-left={-56}
        shadow-camera-right={56}
        shadow-camera-top={56}
        shadow-camera-bottom={-56}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
      />
    </>
  );
}
