export default function Lights() {
  return (
    <>
      <hemisphereLight
        args={['#5fd4ff', '#1b1208', 0.35]}
        position={[0, 30, 0]}
      />

      <directionalLight
        position={[12, 18, 8]}
        intensity={1.6}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />

      <directionalLight
        position={[-14, 8, -10]}
        intensity={0.45}
        color="#5fd4ff"
      />

      <directionalLight
        position={[0, 4, 18]}
        intensity={0.25}
        color="#d96fff"
      />
    </>
  );
}
