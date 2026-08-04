import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DENTIST_BASINS, DENTIST_CHANNELS, DENTIST_PADS } from '../content/layout';
import { carvedGround, carvedHeight } from '../terrain/heightfield';
import { WATER_SURFACE, buildChannelRibbon } from '../terrain/water';
import { createWaterMaterial } from './waterMaterial';

/**
 * Running water in every cut channel — spec §11.2 Task 2. One merged geometry
 * across all eleven channels so the whole network is a single draw call, with
 * a shared material whose ripple scrolls with real time.
 */
export default function ChannelWater() {
  const geometry = useMemo(() => {
    const height = (x: number, z: number) => carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS, DENTIST_PADS);
    // Excavation only, no structure pads — see buildChannelRibbon's doc
    // comment for why the rim guard needs this rather than `height`.
    const bank = (x: number, z: number) => carvedGround(x, z, DENTIST_CHANNELS, DENTIST_BASINS);

    const positions: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    let vertexOffset = 0;

    for (const cut of DENTIST_CHANNELS) {
      const ribbon = buildChannelRibbon(cut, height, bank);

      positions.push(...ribbon.positions);
      uvs.push(...ribbon.uvs);
      colors.push(...ribbon.colors);
      for (let i = 0; i < ribbon.indices.length; i++) {
        indices.push(ribbon.indices[i] + vertexOffset);
      }

      // Vertex count for this ribbon, not its index count — the running
      // offset the next channel's indices need to land in the merged buffer.
      vertexOffset += ribbon.positions.length / 3;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
    // Linear-space already — buildChannelRibbon's colours go straight into
    // the attribute, matching how Three reads vertex colours.
    geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    geom.computeBoundingSphere();
    return geom;
  }, []);

  const material = useMemo(
    () =>
      createWaterMaterial({
        roughness: WATER_SURFACE.channelRoughness,
        opacity: WATER_SURFACE.channelOpacity,
      }),
    [],
  );

  // R3F only auto-disposes objects it attached itself via JSX children.
  // `geometry` and `material` are built imperatively and handed to the mesh
  // as props, so their GPU resources are ours to release — and the hash
  // route unmounts this whole view whenever the viewer switches explainers.
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state) => {
    material.userData.uTime.value = state.clock.elapsedTime;
  });

  return <mesh geometry={geometry} material={material} />;
}
