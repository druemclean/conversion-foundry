import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { SURROUND, buildSurroundGrid, buildTerrainColors, surroundHeight } from '../terrain/heightfield';

/**
 * The country the hillside sits in.
 *
 * Without it the worked tile reads as a card floating in void: at the
 * overlook's depression angle the frame never reaches above the horizon, so
 * every pixel around the terrain was the sky dome's underside. Coarse on
 * purpose — this is coarse country seen from 200+ units out and mostly
 * dissolved into haze by the fog.
 */
export default function Surround() {
  const geometry = useMemo(() => {
    const { positions, indices } = buildSurroundGrid();
    // Measured against its own surface, not the tile's, or the roll-away
    // would read as one continuous wet stain out to the horizon.
    const colors = buildTerrainColors(positions, (x, z) => surroundHeight(x, z) - SURROUND.drop);

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.setIndex(new THREE.BufferAttribute(indices, 1));
    geom.computeVertexNormals();
    geom.computeBoundingSphere();
    return geom;
  }, []);

  // R3F only auto-disposes objects it attached via JSX; this one is a prop.
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} receiveShadow>
      {/* polygonOffset rather than a height drop: a real 5cm step left a lit
          hairline tracing the tile's outline. This pushes the surround back in
          depth only, so the two surfaces stay coincident in the overlap band
          and the worked tile still wins every pixel. */}
      <meshStandardMaterial
        vertexColors
        roughness={0.97}
        metalness={0}
        envMapIntensity={0.3}
        polygonOffset
        polygonOffsetFactor={4}
        polygonOffsetUnits={8}
      />
    </mesh>
  );
}
