import * as THREE from 'three';
import {
  DENTIST_BASINS,
  DENTIST_CHANNELS,
  DENTIST_PADS,
  RETENTION_STAIN_HEIGHT,
  type BasinSpec,
} from '../content/layout';
import { carvedHeight } from '../terrain/heightfield';
import { WW_PALETTE } from '../tokens';

function floorOf(basin: BasinSpec): number {
  return carvedHeight(basin.center.x, basin.center.z, DENTIST_CHANNELS, DENTIST_BASINS, DENTIST_PADS);
}

/**
 * A marked timber post standing in the basin — spec §10.1. In §11.2 this is
 * what reads a number that disagrees with the water beside it. Dry, it is
 * just a post with graduations, which is the right amount of promise.
 */
function GaugePost({ basin }: { basin: BasinSpec }) {
  const floor = floorOf(basin);
  // Only enough freeboard to read a full pool. At depth + 1.5 these stood
  // 3.6 units over a 2.1-deep basin and read as flagpoles.
  const height = basin.depth + 0.5;
  const x = basin.center.x + basin.radius * 0.42;
  const z = basin.center.z + basin.radius * 0.3;

  return (
    <group position={[x, floor, z]}>
      {/* A board, not a post — a staff gauge is a flat face you read across,
          and a square section gave nothing to carry the graduations. */}
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[0.3, height, 0.09]} />
        <meshStandardMaterial color={WW_PALETTE.timber} roughness={0.95} metalness={0} />
      </mesh>
      {/* Graduations, coarser near the top — real staff gauges are read from
          a distance and the fine marks are the ones that silt over. */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0, 0.2 + (i * (height - 0.3)) / 8, 0.048]}>
          <boxGeometry args={[i % 2 === 0 ? 0.3 : 0.18, 0.035, 0.012]} />
          <meshStandardMaterial color={WW_PALETTE.timberDark} roughness={0.9} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The retention line — spec §5.4 and §10.1. A stain band on the basin wall
 * marking the lowest point a side channel can reach. Different height per
 * pool, and the asymmetry is the lesson.
 */
function RetentionStain({ basin }: { basin: BasinSpec }) {
  const floor = floorOf(basin);
  const y = floor + basin.depth * basin.retentionFrac;

  // A band ON the wall, not a hoop lying in the basin. §10.1 warned that the
  // four pool-wall marks only survive by differing in Kind — a surface, a
  // standing post, a stain on stone, a deposit on the floor. Built as a flat
  // horizontal ring this read as a second floor hovering above the silt, and
  // two of the three dry marks collapsed into "a horizontal thing at a
  // height". A cone frustum follows the sloping wall instead.
  //
  // The wall climbs `depth` over `rimWidth` of horizontal run, so the radius
  // at any height is (radius - rimWidth) + rimWidth * fraction. Slight outward
  // scale keeps the band clear of the terrain it sits against.
  const wallRadius = basin.radius - basin.rimWidth + basin.rimWidth * basin.retentionFrac;
  const flare = (basin.rimWidth * (RETENTION_STAIN_HEIGHT / 2)) / basin.depth;

  return (
    <mesh position={[basin.center.x, y, basin.center.z]}>
      <cylinderGeometry
        args={[
          (wallRadius + flare) * 1.006,
          (wallRadius - flare) * 1.006,
          RETENTION_STAIN_HEIGHT,
          64,
          1,
          true,
        ]}
      />
      <meshStandardMaterial
        color={WW_PALETTE.retentionStain}
        roughness={1}
        metalness={0}
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** Layered sediment on the basin floor — the immutable record of §5.2. */
function SiltFloor({ basin }: { basin: BasinSpec }) {
  const floor = floorOf(basin);
  const layers = 3;

  return (
    <group position={[basin.center.x, floor, basin.center.z]}>
      {Array.from({ length: layers }, (_, i) => {
        const t = i / layers;
        return (
          <mesh key={i} receiveShadow position={[0, 0.02 + i * 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[(basin.radius - basin.rimWidth) * (1 - t * 0.22), 48]} />
            <meshStandardMaterial
              color={i === 1 ? WW_PALETTE.soilDamp : WW_PALETTE.silt}
              roughness={1}
              metalness={0}
              polygonOffset
              polygonOffsetFactor={-1 - i}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function Pools() {
  return (
    <group>
      {DENTIST_BASINS.map((basin) => (
        <group key={basin.id}>
          <SiltFloor basin={basin} />
          <RetentionStain basin={basin} />
          <GaugePost basin={basin} />
        </group>
      ))}
    </group>
  );
}
