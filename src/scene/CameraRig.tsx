import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSelection } from '../state/selection';
import { getStation } from '../data/stations';

type OrbitLike = {
  target: THREE.Vector3;
  autoRotate: boolean;
  update: () => void;
  addEventListener: (e: string, h: () => void) => void;
  removeEventListener: (e: string, h: () => void) => void;
};

const DEFAULT_POS = new THREE.Vector3(16, 11, 18);
const DEFAULT_TARGET = new THREE.Vector3(0, 2.2, 0);

function offsetForStation(pos: [number, number, number]): THREE.Vector3 {
  const v = new THREE.Vector3(...pos);
  // Stations at the origin (GTM) get a fixed front-right framing.
  if (v.length() < 0.5) return new THREE.Vector3(5.2, 3.6, 6.0);
  // For everything else, push the camera radially outward from the origin so
  // it always views the station against open space rather than the next station.
  const dir = v.clone().normalize();
  return v.clone().add(dir.multiplyScalar(5.5)).setY(pos[1] + 3.0);
}

function lookAtForStation(pos: [number, number, number]): THREE.Vector3 {
  return new THREE.Vector3(pos[0], pos[1] + 1.2, pos[2]);
}

export default function CameraRig() {
  const { camera } = useThree();
  const controls = useThree((s) => s.controls) as unknown as OrbitLike | null;
  const { state } = useSelection();

  const targetPos = useRef(DEFAULT_POS.clone());
  const targetLook = useRef(DEFAULT_TARGET.clone());
  const userInteracted = useRef(false);

  useEffect(() => {
    if (!controls) return;
    const onStart = () => {
      userInteracted.current = true;
      controls.autoRotate = false;
    };
    controls.addEventListener('start', onStart);
    return () => controls.removeEventListener('start', onStart);
  }, [controls]);

  useEffect(() => {
    const station = getStation(state.selectedId);
    if (station) {
      if (controls) controls.autoRotate = false;
      targetPos.current.copy(offsetForStation(station.position));
      targetLook.current.copy(lookAtForStation(station.position));
    } else if (userInteracted.current) {
      targetLook.current.copy(DEFAULT_TARGET);
    } else {
      targetPos.current.copy(DEFAULT_POS);
      targetLook.current.copy(DEFAULT_TARGET);
    }
  }, [state.selectedId, controls]);

  useFrame((_, delta) => {
    const t = 1 - Math.pow(0.0009, delta);
    if (state.selectedId) {
      // Stop lerping once close enough so OrbitControls can take over freely.
      if (camera.position.distanceTo(targetPos.current) > 0.05) {
        camera.position.lerp(targetPos.current, t);
      }
    }
    if (controls) {
      if (controls.target.distanceTo(targetLook.current) > 0.05) {
        controls.target.lerp(targetLook.current, t);
      }
      controls.update();
    }
  });

  return null;
}
