import { Bloom, EffectComposer, SSAO, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';

/**
 * The Foundry's pipeline, inverted. Same composer, opposite settings:
 * SSAO carries the whole read here, because nothing in this scene is
 * emissive (spec §7 forbids it) and contact shadow between cut earth and
 * timber is the only thing making hand-built forms legible.
 *
 * Bloom is present but effectively inert — threshold above 1.0 means nothing
 * in an ACES-mapped daylight scene ever reaches it. It is kept because the
 * project CLAUDE.md requires the ACES + bloom + SSAO pipeline to be in place;
 * drop it once that rule carries an explicit per-view exception.
 */
export default function Effects() {
  return (
    <EffectComposer multisampling={4} enableNormalPass>
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={31}
        rings={4}
        radius={0.28}
        intensity={6.5}
        luminanceInfluence={0.35}
        worldDistanceThreshold={200}
        worldDistanceFalloff={60}
        worldProximityThreshold={4}
        worldProximityFalloff={1.5}
        bias={0.03}
      />
      <Bloom intensity={0.04} luminanceThreshold={1.05} luminanceSmoothing={0.1} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.34} darkness={0.26} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}
