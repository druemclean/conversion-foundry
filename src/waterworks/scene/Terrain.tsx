import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { DENTIST_BASINS, DENTIST_CHANNELS, DENTIST_PADS } from '../content/layout';
import { buildSkirt, buildTerrainColors, buildTerrainGrid, carvedHeight } from '../terrain/heightfield';

const height = (x: number, z: number) =>
  carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS, DENTIST_PADS);

function toGeometry(positions: Float32Array, indices: Uint32Array): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(buildTerrainColors(positions), 3));
  geom.setIndex(new THREE.BufferAttribute(indices, 1));
  geom.computeVertexNormals();
  geom.computeBoundingSphere();
  return geom;
}

export default function Terrain() {
  const geometry = useMemo(() => {
    const { positions, indices } = buildTerrainGrid(height);
    return toGeometry(positions, indices);
  }, []);

  // The seam curtain. The tile and the surround only share the boundary curve,
  // sampled at different resolutions — sub-sample noise opens backlit slivers
  // along it. The skirt hangs from the tile's edge so those slivers show
  // earth, not sky. Colored by the same dampness ramp: it sits below grade,
  // so it reads as the dark cut face of the worked ground.
  const skirt = useMemo(() => {
    const { positions, indices } = buildSkirt(height);
    return toGeometry(positions, indices);
  }, []);

  // R3F only auto-disposes objects it attached via JSX. These geometries are
  // handed to the meshes as props, so their GPU buffers are ours to release —
  // and the hash route unmounts this whole view every time the viewer
  // switches explainers.
  useEffect(
    () => () => {
      geometry.dispose();
      skirt.dispose();
    },
    [geometry, skirt],
  );

  return (
    <group>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.95}
          metalness={0}
          envMapIntensity={0.35}
          flatShading={false}
        />
      </mesh>
      <mesh geometry={skirt}>
        {/* DoubleSide: the curtain is seen edge-on through hairline cracks
            from either side; winding must never decide whether it shows. No
            shadows — a vertical wall inside a crack only invents banding. */}
        <meshStandardMaterial
          vertexColors
          roughness={0.95}
          metalness={0}
          envMapIntensity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
