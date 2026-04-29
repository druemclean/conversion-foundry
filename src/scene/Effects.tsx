import {
  EffectComposer,
  Bloom,
  SSAO,
  Vignette,
  ChromaticAberration,
  ToneMapping,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import { Vector2 } from 'three';

export default function Effects() {
  return (
    <EffectComposer multisampling={0} enableNormalPass>
      {/* SSAO tuned for top-down + distant orbit angles. Previous settings
          (intensity 18, worldDistanceThreshold 20) produced a hard wedge on
          the ground because the threshold cut occlusion off abruptly across
          the visible ground plane and the high intensity amplified the seam.
          Now: lower intensity for a true subtle ambient effect, much larger
          world distance window so the falloff is gradual, and more samples
          to reduce per-pixel banding on flat surfaces. */}
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={31}
        rings={4}
        radius={0.32}
        intensity={3.2}
        luminanceInfluence={0.5}
        worldDistanceThreshold={120}
        worldDistanceFalloff={40}
        worldProximityThreshold={6}
        worldProximityFalloff={2}
        bias={0.04}
      />
      <Bloom
        intensity={0.75}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.18}
        mipmapBlur
        radius={0.78}
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new Vector2(0.0008, 0.0008)}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.3} darkness={0.4} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
