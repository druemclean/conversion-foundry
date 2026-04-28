export default function Lights() {
  return (
    <>
      {/* Lifted hemisphere so shadowed sides of stations still read */}
      <hemisphereLight args={['#7fc8ff', '#241808', 0.65]} position={[0, 30, 0]} />

      {/* Soft key — radius gives PCF softness so shadows don't read as a single
          hard diagonal across the ground when stations cluster. */}
      <directionalLight
        position={[12, 22, 8]}
        intensity={1.05}
        color="#fff4e0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
        shadow-radius={6}
      />

      {/* Cyan rim from opposite side */}
      <directionalLight position={[-14, 8, -10]} intensity={0.55} color="#5fd4ff" />

      {/* Magenta back-fill so silhouettes don't vanish when in shadow */}
      <directionalLight position={[0, 4, -16]} intensity={0.35} color="#d96fff" />

      {/* Warm front-fill */}
      <directionalLight position={[6, 3, 14]} intensity={0.25} color="#ffb054" />
    </>
  );
}
