import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import * as THREE from 'three';
import { WW_PALETTE } from './tokens';
import Camera, { OVERLOOK } from './scene/Camera';
import Terrain from './scene/Terrain';
import ViewSwitch from './ViewSwitch';
import Effects from './scene/Effects';
import Lights from './scene/Lights';
import Sky from './scene/Sky';

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
          // Warm haze, not the Foundry's void — distance should read as dusty
          // air over a valley, so the far ridge softens instead of vanishing.
          scene.fog = new THREE.Fog(WW_PALETTE.haze, 150, 340);
        }}
      >
        <Suspense fallback={null}>
          <Sky />
          <Lights />
          <Terrain />
          <Effects />
          <Camera />
        </Suspense>
      </Canvas>
      <ViewSwitch current="waterworks" />
    </div>
  );
}
