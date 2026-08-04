import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import * as THREE from 'three';
import { WW_PALETTE } from './tokens';
import Camera, { OVERLOOK } from './scene/Camera';
import Terrain from './scene/Terrain';
import Channels from './scene/Channels';
import Structures from './scene/Structures';
import ChannelWater from './scene/ChannelWater';
import PoolWater from './scene/PoolWater';
import Pools from './scene/Pools';
import ViewSwitch from './ViewSwitch';
import Effects from './scene/Effects';
import Lights from './scene/Lights';
import Sky from './scene/Sky';
import Surround from './scene/Surround';

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
        // far has to clear the sky dome, not just the terrain. The camera sits
        // ~204 units from origin inside a 340-radius dome, so the backdrop's
        // far wall is ~544 away — at far=400 the gradient was clipped entirely
        // and all anyone saw was the flat scene.background behind it. near
        // moves out to 5 to buy back the depth precision; the orbit controls
        // never let the camera closer than 30.
        camera={{ position: OVERLOOK.position, fov: OVERLOOK.fov, near: 5, far: 900 }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color(WW_PALETTE.skyLow);
          // Warm haze, not the Foundry's void. The camera sits ~200 units out,
          // and the terrain spans roughly 173-231 units from it, so fog has to
          // start past the near edge or it milks the whole subject instead of
          // just softening the far ridge.
          scene.fog = new THREE.Fog(WW_PALETTE.haze, 205, 430);
        }}
      >
        <Suspense fallback={null}>
          <Sky />
          <Lights />
          <Surround />
          <Terrain />
          <Channels />
          <Structures />
          <ChannelWater />
          <PoolWater />
          <Pools />
          <Effects />
          <Camera />
        </Suspense>
      </Canvas>
      <ViewSwitch current="waterworks" />
    </div>
  );
}
