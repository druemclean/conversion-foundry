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

const DEFAULT_POS = new THREE.Vector3(14, 9, 16);
const DEFAULT_TARGET = new THREE.Vector3(0, 0.8, 0);

function offsetForStation(pos: [number, number, number]): THREE.Vector3 {
  // Camera lands forward and to the right of the station, slightly above it.
  return new THREE.Vector3(pos[0] + 5.0, pos[1] + 3.4, pos[2] + 5.6);
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
      // Don't yank a user who's been orbiting freely.
      // Only reset look-at if camera isn't locked elsewhere.
      targetLook.current.copy(DEFAULT_TARGET);
    } else {
      targetPos.current.copy(DEFAULT_POS);
      targetLook.current.copy(DEFAULT_TARGET);
    }
  }, [state.selectedId, controls]);

  useFrame((_, delta) => {
    // Frame-rate-independent ease-out (~0.6s feel).
    const t = 1 - Math.pow(0.0009, delta);
    if (state.selectedId) {
      camera.position.lerp(targetPos.current, t);
    }
    if (controls) {
      controls.target.lerp(targetLook.current, t);
      controls.update();
    }
  });

  return null;
}
