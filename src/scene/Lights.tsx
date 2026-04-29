import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Lights() {
  const keyRef = useRef<THREE.DirectionalLight>(null);

  // One-time diagnostic so the values are easy to verify in DevTools.
  useEffect(() => {
    const l = keyRef.current;
    if (!l) return;
    const c = l.shadow.camera;
    // eslint-disable-next-line no-console
    console.info(
      '[shadow camera]',
      JSON.stringify(
        {
          left: c.left,
          right: c.right,
          top: c.top,
          bottom: c.bottom,
          near: c.near,
          far: c.far,
          bias: l.shadow.bias,
          normalBias: l.shadow.normalBias,
          mapSize: [l.shadow.mapSize.x, l.shadow.mapSize.y],
        },
        null,
        2,
      ),
    );
  }, []);

  return (
    <>
      <hemisphereLight args={['#7fc8ff', '#241808', 0.65]} position={[0, 30, 0]} />

      {/* Key directional. Frustum must fully contain the visible ground at any
          orbit angle within the polar clamp — at camera distance 42 (max
          orbit), visible ground reaches roughly ±100 units from origin, so
          we go ±120 with margin. Map size 4096 keeps texel density at ~0.06
          units/texel which is plenty for the gentle PCF radius we use. */}
      <directionalLight
        ref={keyRef}
        position={[12, 22, 8]}
        intensity={1.05}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={1}
        shadow-camera-far={260}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-radius={6}
      />

      <directionalLight position={[-14, 8, -10]} intensity={0.55} color="#5fd4ff" />
      <directionalLight position={[0, 4, -16]} intensity={0.35} color="#d96fff" />
      <directionalLight position={[6, 3, 14]} intensity={0.25} color="#ffb054" />
    </>
  );
}
