import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { WW_PALETTE } from '../tokens';

/**
 * A two-stop gradient dome rather than drei's <Sky>. Preetham scattering
 * gives a photographic blue that fights the limewash register in §7; this is
 * a painted backdrop, which is what a hand-built hillside wants behind it.
 */
export default function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uHigh: { value: new THREE.Color(WW_PALETTE.skyHigh) },
          uLow: { value: new THREE.Color(WW_PALETTE.skyLow) },
        },
        vertexShader: `
          varying vec3 vWorld;
          void main() {
            vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uHigh;
          uniform vec3 uLow;
          varying vec3 vWorld;
          void main() {
            float t = clamp(vWorld.y / 220.0 + 0.18, 0.0, 1.0);
            gl_FragColor = vec4(mix(uLow, uHigh, pow(t, 0.75)), 1.0);
          }
        `,
      }),
    [],
  );

  // Same reason as Terrain's geometry: R3F only auto-disposes what it attached
  // via JSX, and this material is a prop. The sphereGeometry below is a JSX
  // child and is handled for us.
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh material={material} frustumCulled={false}>
      <sphereGeometry args={[340, 32, 24]} />
    </mesh>
  );
}
