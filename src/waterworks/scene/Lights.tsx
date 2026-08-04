import { WW_PALETTE } from '../tokens';

/**
 * Spec §7: open sky, low warm sun. One key from the west at a shallow angle
 * so channel cuts and weir faces throw long shadows and read as depth, plus
 * a strong sky/ground hemisphere doing the work the Foundry's emissives do.
 * No coloured rim lights — those are the Foundry's signature.
 *
 * Exposure is budgeted, not guessed. The soil albedos are decoded to linear
 * (~0.45 for dry ochre), so total irradiance much above 1.0 pushes the red
 * channel past white and ACES answers by desaturating — which is how the
 * first pass turned warm ochre earth into pale grey. Sun plus hemisphere is
 * held near 1.1 so #b39a70 survives tone mapping as the colour it is.
 */
export default function Lights() {
  return (
    <>
      <hemisphereLight
        args={[WW_PALETTE.skyHigh, WW_PALETTE.hemiGround, 0.6]}
        position={[0, 60, 0]}
      />
      <directionalLight
        position={[-52, 30, 34]}
        intensity={1.6}
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
