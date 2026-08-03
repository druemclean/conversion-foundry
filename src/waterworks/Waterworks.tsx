import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import * as THREE from 'three';
import ViewSwitch from './ViewSwitch';

export default function Waterworks() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.NoToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ position: [0, 120, 165], fov: 22, near: 1, far: 400 }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color('#e7dcc7');
        }}
      >
        <Suspense fallback={null} />
      </Canvas>
      <ViewSwitch current="waterworks" />
    </div>
  );
}
