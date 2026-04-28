import { Grid } from '@react-three/drei';

export default function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.001, 0]}>
        <circleGeometry args={[60, 96]} />
        <meshStandardMaterial
          color="#0a1020"
          roughness={0.62}
          metalness={0.35}
          envMapIntensity={0.5}
        />
      </mesh>

      <Grid
        args={[80, 80]}
        position={[0, 0.002, 0]}
        cellSize={1}
        cellThickness={0.55}
        cellColor="#1c2742"
        sectionSize={5}
        sectionThickness={1.1}
        sectionColor="#36507e"
        fadeDistance={48}
        fadeStrength={1.6}
        followCamera={false}
        infiniteGrid={false}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0005, 0]}>
        <ringGeometry args={[28, 28.18, 128]} />
        <meshBasicMaterial color="#5fd4ff" transparent opacity={0.07} />
      </mesh>
    </group>
  );
}
