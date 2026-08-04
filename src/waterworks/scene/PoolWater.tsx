import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DENTIST_BASINS, DENTIST_CHANNELS, DENTIST_PADS, type BasinSpec } from '../content/layout';
import { carvedHeight } from '../terrain/heightfield';
import { waterColor } from '../terrain/water';
import { createWaterMaterial, type WaterMaterial } from './waterMaterial';

function floorOf(basin: BasinSpec): number {
  return carvedHeight(basin.center.x, basin.center.z, DENTIST_CHANNELS, DENTIST_BASINS, DENTIST_PADS);
}

type Pool = {
  basin: BasinSpec;
  y: number;
  geometry: THREE.CircleGeometry;
  material: WaterMaterial;
};

/**
 * Standing water in each basin — spec §11.2 Task 3. One flat disc per pool,
 * set at the fill level, tinted as a single material colour rather than
 * vertex colours: a pool is one flat tone, unlike the channels' gradient.
 * Glassier than the running water in `ChannelWater` — still water is what
 * spec §7 asks to reflect.
 */
export default function PoolWater() {
  const pools = useMemo<Pool[]>(() => {
    return DENTIST_BASINS.map((basin) => {
      const floor = floorOf(basin);
      const y = floor + basin.depth * basin.fillFrac;
      const geometry = new THREE.CircleGeometry(basin.radius - basin.rimWidth * 0.5, 48);

      const material = createWaterMaterial({ roughness: 0.08, opacity: 0.9 });
      // A pool is one flat tone — vertex colours are the channel's device,
      // not this one. Turning them off matters: the geometry below carries no
      // 'color' attribute, and leaving vertexColors on would multiply the
      // surface by an unbound (0,0,0,1) attribute and render it black.
      material.vertexColors = false;
      // waterColor returns linear-space values. setRGB's default colour space
      // is the working (linear) space, so this is the correct call — setStyle
      // or a hex string would apply an sRGB decode on top and darken it again.
      const [r, g, b] = waterColor(basin.flow);
      material.color.setRGB(r, g, b);

      return { basin, y, geometry, material };
    });
  }, []);

  // R3F only auto-disposes objects it attached itself via JSX children.
  // Every basin's geometry and material is built imperatively here, so all
  // eight — not just the first pool's — are ours to release on unmount.
  useEffect(() => {
    return () => {
      for (const pool of pools) {
        pool.geometry.dispose();
        pool.material.dispose();
      }
    };
  }, [pools]);

  // One shared frame loop drives every pool's ripple, not one per basin.
  useFrame((state) => {
    for (const pool of pools) {
      pool.material.userData.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group>
      {pools.map((pool) => (
        <mesh
          key={pool.basin.id}
          geometry={pool.geometry}
          material={pool.material}
          position={[pool.basin.center.x, pool.y, pool.basin.center.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      ))}
    </group>
  );
}
