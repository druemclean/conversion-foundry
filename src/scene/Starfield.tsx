import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 1400;
const INNER = 65;
const OUTER = 140;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default function Starfield() {
  const meshRef = useRef<THREE.InstancedMesh | null>(null);

  const { matrices, colors } = useMemo(() => {
    const matrices: THREE.Matrix4[] = [];
    const colors = new Float32Array(COUNT * 3);
    const tmp = new THREE.Object3D();
    const palette = [
      new THREE.Color('#cfe1ff'),
      new THREE.Color('#9fc2ff'),
      new THREE.Color('#ffe6c2'),
      new THREE.Color('#cfd6ff'),
      new THREE.Color('#ffffff'),
    ];

    for (let i = 0; i < COUNT; i++) {
      const r = rand(INNER, OUTER);
      const theta = rand(0, Math.PI * 2);
      const phi = Math.acos(rand(-0.55, 0.95));
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);

      const sizeRoll = Math.random();
      const scale =
        sizeRoll > 0.985 ? rand(0.32, 0.5) :
        sizeRoll > 0.9 ? rand(0.15, 0.25) :
        rand(0.05, 0.11);

      tmp.position.set(x, y, z);
      tmp.scale.setScalar(scale);
      tmp.updateMatrix();
      matrices.push(tmp.matrix.clone());

      const c = palette[Math.floor(Math.random() * palette.length)].clone();
      const dim = rand(0.55, 1.0);
      colors[i * 3 + 0] = c.r * dim;
      colors[i * 3 + 1] = c.g * dim;
      colors[i * 3 + 2] = c.b * dim;
    }
    return { matrices, colors };
  }, []);

  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    for (let i = 0; i < matrices.length; i++) m.setMatrixAt(i, matrices[i]);
    m.instanceMatrix.needsUpdate = true;
    const attr = new THREE.InstancedBufferAttribute(colors, 3);
    m.geometry.setAttribute('instanceColor', attr);
  }, [matrices, colors]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.008;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, COUNT]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={{}}
        vertexShader={`
          attribute vec3 instanceColor;
          varying vec3 vColor;
          void main() {
            vColor = instanceColor;
            vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          void main() {
            gl_FragColor = vec4(vColor, 1.0);
          }
        `}
      />
    </instancedMesh>
  );
}
