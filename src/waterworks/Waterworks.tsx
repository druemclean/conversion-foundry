import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import * as THREE from 'three';
import { WW_PALETTE } from './tokens';
import Camera, { OVERLOOK } from './scene/Camera';
import Terrain from './scene/Terrain';
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
        camera={{ position: OVERLOOK.position, fov: OVERLOOK.fov, near: 1, far: 400 }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color(WW_PALETTE.skyLow);
        }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={1.2} />
          <Terrain />
          <Camera />
        </Suspense>
      </Canvas>
      <ViewSwitch current="waterworks" />
    </div>
  );
}
