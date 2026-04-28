import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';
import Lights from './Lights';
import Ground from './Ground';
import Starfield from './Starfield';
import Effects from './Effects';

export default function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.NoToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      camera={{ position: [14, 9, 16], fov: 38, near: 0.1, far: 200 }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.Fog('#02030a', 28, 110);
        scene.background = null;
      }}
    >
      <Suspense fallback={null}>
        <Environment preset="warehouse" environmentIntensity={0.55} />
        <Lights />
        <Ground />
        <Starfield />
        <Effects />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          minDistance={9}
          maxDistance={42}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI * 0.49}
          autoRotate
          autoRotateSpeed={0.18}
        />
      </Suspense>
    </Canvas>
  );
}
