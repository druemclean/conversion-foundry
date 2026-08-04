import {
  CLIENT_GATE,
  DENTIST_BASINS,
  DENTIST_CHANNELS,
  DENTIST_PADS,
  DENTIST_SLUICE_GATES,
  DIVISION_LIP,
  HEADWORKS,
} from '../content/layout';
import { carvedHeight } from '../terrain/heightfield';
import { WW_PALETTE } from '../tokens';

function groundAt(x: number, z: number): number {
  return carvedHeight(x, z, DENTIST_CHANNELS, DENTIST_BASINS, DENTIST_PADS);
}

/** A timber board set in stone slots — the sluice of spec §5.1. */
function SluiceGate({ x, z, width, angle }: { x: number; z: number; width: number; angle: number }) {
  const y = groundAt(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, angle, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[width, 0.84, 0.14]} />
        <meshStandardMaterial color={WW_PALETTE.timber} roughness={0.95} metalness={0} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} castShadow receiveShadow position={[(side * width) / 2 + side * 0.13, 0.5, 0]}>
          <boxGeometry args={[0.26, 1.0, 0.42]} />
          <meshStandardMaterial color={WW_PALETTE.rock} roughness={0.9} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Spec §10.1: the weir sorts, it does not share. Built as one level lip with
 * three channel mouths leaving it together — a proportional divider would
 * have been the wrong object.
 */
function DivisionLip() {
  const y = groundAt(DIVISION_LIP.x, DIVISION_LIP.z);
  return (
    <group position={[DIVISION_LIP.x, y, DIVISION_LIP.z]}>
      <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
        <boxGeometry args={[7.2, 0.44, 0.9]} />
        <meshStandardMaterial color={WW_PALETTE.rock} roughness={0.88} metalness={0} />
      </mesh>
      {/* Grates: the admission bars on each destination mouth. */}
      {[-2.5, 0, 2.5].map((offset) => (
        <group key={offset} position={[offset, 0.44, 0.5]}>
          {[-0.22, 0, 0.22].map((bar) => (
            <mesh key={bar} castShadow position={[bar, 0.2, 0]}>
              <boxGeometry args={[0.05, 0.4, 0.05]} />
              <meshStandardMaterial color={WW_PALETTE.timberDark} roughness={0.85} metalness={0.15} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Off-system, on land you do not control — a gate in a boundary wall. */
function ClientGate() {
  const y = groundAt(CLIENT_GATE.x, CLIENT_GATE.z);
  return (
    <group position={[CLIENT_GATE.x, y, CLIENT_GATE.z]} rotation={[0, Math.PI / 2, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[1.6, 1.1, 0.18]} />
        <meshStandardMaterial color={WW_PALETTE.timberDark} roughness={0.96} metalness={0} />
      </mesh>
      {[-3.2, 3.2].map((offset) => (
        <mesh key={offset} castShadow receiveShadow position={[offset, 0.45, 0]}>
          <boxGeometry args={[5, 0.9, 0.55]} />
          <meshStandardMaterial color={WW_PALETTE.rock} roughness={0.94} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

export default function Structures() {
  const intakeY = groundAt(HEADWORKS.x, HEADWORKS.z);

  return (
    <group>
      {/* The intake weir — first thing built, hardest to move later (§3). */}
      <group position={[HEADWORKS.x, intakeY, HEADWORKS.z]}>
        <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
          <boxGeometry args={[4.4, 0.6, 0.7]} />
          <meshStandardMaterial color={WW_PALETTE.rockWet} roughness={0.9} metalness={0} />
        </mesh>
        {/* The notch the whole system depends on. */}
        <mesh castShadow position={[0, 0.62, 0]}>
          <boxGeometry args={[1.1, 0.3, 0.76]} />
          <meshStandardMaterial color={WW_PALETTE.skyLow} roughness={1} metalness={0} />
        </mesh>
      </group>

      {DENTIST_SLUICE_GATES.map((gate) => (
        <SluiceGate key={gate.id} x={gate.at.x} z={gate.at.z} width={gate.width} angle={gate.angle} />
      ))}

      <DivisionLip />
      <ClientGate />
    </group>
  );
}
