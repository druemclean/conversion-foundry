import { useMemo } from 'react';
import * as THREE from 'three';

// Inverted sphere rendered behind everything, with a vertical gradient that
// terminates at the ground in the exact same color as scene.fog. Fog-immune
// so its colors don't get crushed at the horizon. Renders before everything
// else (renderOrder=-100, depthWrite=false) so depth-buffered geometry sits
// on top correctly.
export default function Backdrop() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
      fog: false,
      uniforms: {
        colorTop: { value: new THREE.Color('#0d1424') },
        colorMid: { value: new THREE.Color('#070d1c') },
        colorBottom: { value: new THREE.Color('#02030a') },
      },
      vertexShader: /* glsl */ `
        varying float vY;
        void main() {
          vY = normalize(position).y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 colorTop;
        uniform vec3 colorMid;
        uniform vec3 colorBottom;
        varying float vY;
        void main() {
          // Bottom (-1) -> fog color, mid -> deep navy, top -> brighter navy.
          // Smoothstep gives a gentle horizon band rather than a hard line.
          float toMid = smoothstep(-0.05, 0.45, vY);
          float toTop = smoothstep(0.30, 0.95, vY);
          vec3 c = mix(colorBottom, colorMid, toMid);
          c = mix(c, colorTop, toTop);
          gl_FragColor = vec4(c, 1.0);
        }
      `,
    });
  }, []);

  return (
    <mesh material={material} renderOrder={-100} frustumCulled={false}>
      <sphereGeometry args={[180, 64, 32]} />
    </mesh>
  );
}
