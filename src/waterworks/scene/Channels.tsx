import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { DENTIST_BASINS, DENTIST_CHANNELS } from '../content/layout';
import { carvedHeight } from '../terrain/heightfield';
import { WW_PALETTE } from '../tokens';

/**
 * Stone edging along the cut channels. Not the water — §11.1 is dry. These
 * are the kerb stones that stop a hand-cut channel collapsing, and they are
 * what makes a cut read as *built* rather than eroded.
 */
export default function Channels() {
  const mesh = useMemo(() => {
    const stone = new THREE.BoxGeometry(1, 1, 1);
    const matrices: THREE.Matrix4[] = [];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);

    for (const cut of DENTIST_CHANNELS) {
      // One kerb stone every ~3rd sample, alternating sides, so the edge is
      // irregular — spec §7 forbids CAD-straight everything.
      for (let i = 2; i < cut.pts.length - 2; i += 3) {
        const p = cut.pts[i];
        const prev = cut.pts[i - 1];
        const next = cut.pts[i + 1];
        const dx = next.x - prev.x;
        const dz = next.z - prev.z;
        const len = Math.hypot(dx, dz) || 1;
        const nx = -dz / len;
        const nz = dx / len;
        const angle = Math.atan2(dx, dz);

        for (const side of [-1, 1]) {
          const jitter = ((i * 37 + (side + 1) * 13) % 11) / 11;
          const off = cut.halfWidth * (0.92 + jitter * 0.22);
          const x = p.x + nx * side * off;
          const z = p.z + nz * side * off;
          const y = carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS);

          q.setFromAxisAngle(up, angle + (jitter - 0.5) * 0.4);
          m.compose(
            new THREE.Vector3(x, y + 0.06, z),
            q,
            new THREE.Vector3(
              cut.halfWidth * (0.5 + jitter * 0.3),
              0.22 + jitter * 0.14,
              cut.halfWidth * (0.9 + jitter * 0.5),
            ),
          );
          matrices.push(m.clone());
        }
      }
    }

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(WW_PALETTE.rock),
      roughness: 0.92,
      metalness: 0,
    });

    const instanced = new THREE.InstancedMesh(stone, material, matrices.length);
    matrices.forEach((mat, i) => instanced.setMatrixAt(i, mat));
    instanced.instanceMatrix.needsUpdate = true;
    instanced.castShadow = true;
    instanced.receiveShadow = true;
    instanced.frustumCulled = false;

    return instanced;
  }, []);

  // R3F does not dispose objects rendered through <primitive> — they are ours.
  // An InstancedMesh needs all three: instanceMatrix is a buffer on the mesh
  // itself, not in geometry.attributes, so only mesh.dispose() releases it.
  useEffect(() => {
    return () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      mesh.dispose();
    };
  }, [mesh]);

  return <primitive object={mesh} />;
}
