import { Grid } from '@react-three/drei';

export default function Ground() {
  return (
    <group>
      {/* Base disc — extends far enough that its edge is always inside dense
          fog, so it dissolves into the backdrop's bottom stop seamlessly */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.001, 0]}>
        <circleGeometry args={[160, 128]} />
        <meshStandardMaterial
          color="#0a1020"
          roughness={0.92}
          metalness={0.05}
          envMapIntensity={0.22}
        />
      </mesh>

      <Grid
        args={[120, 120]}
        position={[0, 0.004, 0]}
        cellSize={1}
        cellThickness={0.55}
        cellColor="#1c2742"
        sectionSize={5}
        sectionThickness={1.1}
        sectionColor="#36507e"
        fadeDistance={90}
        fadeStrength={2.2}
        fadeFrom={1}
        followCamera={false}
        infiniteGrid={false}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[28, 28.18, 128]} />
        <meshBasicMaterial color="#5fd4ff" transparent opacity={0.07} />
      </mesh>
    </group>
  );
}
