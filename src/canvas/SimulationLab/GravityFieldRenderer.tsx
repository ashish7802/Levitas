import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3 } from 'three';
import { physicsEngine } from '../../engine/PhysicsEngine';

const GRID_SIZE = 40;
const GRID_STEP = 2;
const FIELD_PARTICLE_COUNT = GRID_SIZE * GRID_SIZE;

export const GravityFieldRenderer: React.FC = () => {
  const meshRef = useRef<InstancedMesh>(null);
  
  // Pre-allocate memory for performance
  const dummy = useMemo(() => new Object3D(), []);
  const basePositions = useMemo(() => {
    const pos = [];
    const offset = (GRID_SIZE * GRID_STEP) / 2;
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        pos.push(new Vector3(i * GRID_STEP - offset, j * GRID_STEP - offset, -5));
      }
    }
    return pos;
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    
    const bodies = physicsEngine.bodies;
    const g = physicsEngine.gravityConstant;

    for (let i = 0; i < FIELD_PARTICLE_COUNT; i++) {
      const basePos = basePositions[i];
      let zOffset = 0;

      // Calculate potential field scalar at this point
      for (let b = 0; b < bodies.length; b++) {
        const body = bodies[b];
        const distSq = basePos.distanceToSquared(body.position);
        if (distSq > 0.1) {
          // Add a z-offset to create a spacetime warping effect
          // Proportional to -G*M/r
          zOffset -= (g * body.mass) / Math.sqrt(distSq) * 0.5; 
        }
      }

      // Clamp Z offset so it doesn't go infinitely deep or pierce through camera
      zOffset = Math.max(zOffset, -20);
      
      dummy.position.set(basePos.x, basePos.y, basePos.z + zOffset);
      
      // Scale particles dynamically based on distortion
      const scale = 1 + Math.abs(zOffset) * 0.2;
      dummy.scale.set(scale, scale, scale);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, FIELD_PARTICLE_COUNT]}
    >
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshBasicMaterial color="#00f0ff" transparent opacity={0.4} />
    </instancedMesh>
  );
};
