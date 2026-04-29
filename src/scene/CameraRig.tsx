import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
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
const INTRO_POS = new THREE.Vector3(38, 26, 44);

function offsetForStation(pos: [number, number, number]): THREE.Vector3 {
  const v = new THREE.Vector3(...pos);
  // GTM at origin: head-on viewing angle that keeps Google Ads out of frame.
  if (v.length() < 0.5) return new THREE.Vector3(2.5, 4.5, 9.0);
  // For everything else, push the camera radially outward from the origin so
  // off-center stations are framed against open space rather than a neighbor.
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
  const { active: loading } = useProgress();

  const targetPos = useRef(DEFAULT_POS.clone());
  const targetLook = useRef(DEFAULT_TARGET.clone());
  const userInteracted = useRef(false);
  // Intro fly-through only runs once after the first time loading finishes.
  const introDone = useRef(false);
  const introPlaying = useRef(false);

  useEffect(() => {
    if (loading || introDone.current || introPlaying.current) return;
    // Skip the intro when the user landed on a deep link (?station, ?tour) —
    // they want to be at the destination, not watch a fly-through first.
    if (state.selectedId) {
      introDone.current = true;
      return;
    }
    camera.position.copy(INTRO_POS);
    introPlaying.current = true;
  }, [loading, camera, state.selectedId]);

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
    // Slower easing during the intro so it reads as a deliberate cinematic
    // arrival rather than a snap.
    const settleBase = introPlaying.current ? 0.04 : 0.0009;
    const t = 1 - Math.pow(settleBase, delta);

    // Intro: lerp the camera until it's within 0.3u of the default, then
    // hand control back to the standard rig.
    if (introPlaying.current) {
      camera.position.lerp(DEFAULT_POS, t);
      if (camera.position.distanceTo(DEFAULT_POS) < 0.3) {
        introPlaying.current = false;
        introDone.current = true;
      }
    } else if (state.selectedId) {
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
