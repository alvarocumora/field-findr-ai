import { useRef, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { PlacedObject } from './useParcelaState';

interface GLTFAssetLoaderProps {
  obj: PlacedObject;
  isSelected: boolean;
  onClick: () => void;
}

const GLTFModel = ({ url }: { url: string }) => {
  const { scene } = useGLTF(url);
  const cloned = scene.clone(true);
  
  // Auto-scale to reasonable size and center
  const box = new THREE.Box3().setFromObject(cloned);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = maxDim > 0 ? 3 / maxDim : 1; // normalize to ~3m
  cloned.scale.setScalar(scale);
  
  // Center on ground
  const newBox = new THREE.Box3().setFromObject(cloned);
  cloned.position.y -= newBox.min.y;

  return <primitive object={cloned} />;
};

const FallbackBox = () => (
  <mesh position={[0, 0.5, 0]} castShadow>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#9E9E9E" wireframe />
  </mesh>
);

export const GLTFAssetObject = ({ obj, isSelected, onClick }: GLTFAssetLoaderProps) => {
  const ref = useRef<THREE.Group>(null);

  return (
    <group
      ref={ref}
      position={obj.position}
      rotation={[0, obj.rotation, 0]}
      scale={[obj.scale, obj.scale, obj.scale]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      <Suspense fallback={<FallbackBox />}>
        {obj.modelUrl ? (
          <GLTFModel url={obj.modelUrl} />
        ) : (
          <FallbackBox />
        )}
      </Suspense>
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2, 2.2, 32]} />
          <meshBasicMaterial color="#FFD600" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};
