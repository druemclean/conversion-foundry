import * as THREE from 'three';

export type WaterMaterial = THREE.MeshStandardMaterial & { userData: { uTime: { value: number } } };

/**
 * Water as a standard PBR material with a travelling ripple injected into its
 * normal. A custom ShaderMaterial would have to reimplement the lighting and
 * would drift from the rest of the scene; this stays in the same pipeline and
 * only perturbs the surface.
 *
 * The ripple scrolls along V, which `buildChannelRibbon` sets to cumulative
 * distance downstream — so the flow direction is the channel's own direction
 * without anything having to be told which way is downhill.
 */
export function createWaterMaterial(opts: { roughness: number; opacity: number }): WaterMaterial {
  const uTime = { value: 0 };

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: opts.roughness,
    metalness: 0,
    transparent: true,
    opacity: opts.opacity,
    side: THREE.DoubleSide,
  }) as WaterMaterial;

  material.userData = { uTime };

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = `varying vec2 vFlowUv;\n${shader.vertexShader}`.replace(
      '#include <uv_vertex>',
      '#include <uv_vertex>\n  vFlowUv = uv;',
    );
    shader.fragmentShader = `
      uniform float uTime;
      varying vec2 vFlowUv;
      float ripple(vec2 p) {
        return sin(p.y * 3.1 + p.x * 1.7) * 0.5 + sin(p.y * 7.3 - p.x * 2.9) * 0.5;
      }
      ${shader.fragmentShader}
    `.replace(
      '#include <normal_fragment_maps>',
      `#include <normal_fragment_maps>
       vec2 fp = vec2(vFlowUv.x, vFlowUv.y - uTime * 0.55);
       float e = 0.15;
       float dHx = ripple(fp + vec2(e, 0.0)) - ripple(fp - vec2(e, 0.0));
       float dHy = ripple(fp + vec2(0.0, e)) - ripple(fp - vec2(0.0, e));
       normal = normalize(normal + vec3(dHx, 0.0, dHy) * 0.16);`,
    );
  };

  return material;
}
