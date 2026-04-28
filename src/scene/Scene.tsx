import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';
import Lights from './Lights';
import Ground from './Ground';
import Starfield from './Starfield';
import Effects from './Effects';
import CameraRig from './CameraRig';
import Backdrop from './Backdrop';
import Gtm from './stations/Gtm';
import Website from './stations/Website';
import Consent from './stations/Consent';
import GoogleAds from './stations/GoogleAds';
import Ga4 from './stations/Ga4';
import { useSelection } from '../state/selection';

export default function Scene() {
  const { select } = useSelection();

  return (
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
      camera={{ position: [14, 9, 16], fov: 38, near: 0.1, far: 200 }}
      onCreated={({ scene }) => {
        // Fog far must reach to the ground edge so the disc dissolves into
        // the backdrop's bottom stop. Color matches the backdrop's bottom.
        scene.fog = new THREE.Fog('#02030a', 32, 160);
        // Solid clear color matches fog color so any pixel the backdrop
        // doesn't paint also matches — no perceptible seam at any angle.
        scene.background = new THREE.Color('#02030a');
      }}
      onPointerMissed={() => select(null)}
    >
      <Suspense fallback={null}>
        <Backdrop />
        <Environment preset="warehouse" environmentIntensity={0.55} />
        <Lights />
        <Ground />
        <Starfield />

        <Website />
        <Consent />
        <Gtm />
        <GoogleAds />
        <Ga4 />

        <Effects />
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          minDistance={6}
          maxDistance={42}
          minPolarAngle={0.15}
          maxPolarAngle={Math.PI * 0.49}
          autoRotate
          autoRotateSpeed={0.18}
        />
        <CameraRig />
      </Suspense>
    </Canvas>
  );
}
