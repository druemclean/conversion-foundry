import { useMemo } from 'react';
import * as THREE from 'three';
import { DENTIST_BASINS, DENTIST_CHANNELS } from '../content/layout';
import { buildTerrainColors, buildTerrainGrid, carvedHeight } from '../terrain/heightfield';

export default function Terrain() {
  const geometry = useMemo(() => {
    const { positions, indices } = buildTerrainGrid((x, z) =>
      carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS),
    );
    const colors = buildTerrainColors(positions);

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.setIndex(new THREE.BufferAttribute(indices, 1));
    geom.computeVertexNormals();
    geom.computeBoundingSphere();
    return geom;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial
        vertexColors
        roughness={0.95}
        metalness={0}
        envMapIntensity={0.35}
        flatShading={false}
      />
    </mesh>
  );
}
