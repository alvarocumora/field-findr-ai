import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PedestrianCameraProps {
  active: boolean;
}

/**
 * First-person camera controller for walking through the 3D scene.
 * Uses WASD/arrow keys for movement and mouse for looking around.
 */
export const PedestrianCamera = ({ active }: PedestrianCameraProps) => {
  const { camera, gl } = useThree();
  const keys = useRef<Set<string>>(new Set());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isPointerLocked = useRef(false);
  const speed = 0.15;

  useEffect(() => {
    if (!active) return;

    // Set initial camera position for pedestrian view
    camera.position.set(0, 1.7, 10);
    camera.rotation.set(0, 0, 0);

    const onKeyDown = (e: KeyboardEvent) => keys.current.add(e.code);
    const onKeyUp = (e: KeyboardEvent) => keys.current.delete(e.code);
    
    const onMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked.current) return;
      euler.current.setFromQuaternion(camera.quaternion);
      euler.current.y -= e.movementX * 0.002;
      euler.current.x -= e.movementY * 0.002;
      euler.current.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, euler.current.x));
      camera.quaternion.setFromEuler(euler.current);
    };

    const onPointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === gl.domElement;
    };

    const onClick = () => {
      if (!isPointerLocked.current) {
        gl.domElement.requestPointerLock();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);
    gl.domElement.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      gl.domElement.removeEventListener('click', onClick);
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock();
      }
    };
  }, [active, camera, gl]);

  useFrame(() => {
    if (!active) return;

    const direction = new THREE.Vector3();
    const right = new THREE.Vector3();

    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    right.crossVectors(direction, camera.up).normalize();

    if (keys.current.has('KeyW') || keys.current.has('ArrowUp')) {
      camera.position.addScaledVector(direction, speed);
    }
    if (keys.current.has('KeyS') || keys.current.has('ArrowDown')) {
      camera.position.addScaledVector(direction, -speed);
    }
    if (keys.current.has('KeyA') || keys.current.has('ArrowLeft')) {
      camera.position.addScaledVector(right, -speed);
    }
    if (keys.current.has('KeyD') || keys.current.has('ArrowRight')) {
      camera.position.addScaledVector(right, speed);
    }

    // Keep at eye height
    camera.position.y = 1.7;
  });

  return null;
};
