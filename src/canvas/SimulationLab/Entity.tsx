import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Mesh, Vector3, ArrowHelper, BufferGeometry, Float32BufferAttribute } from 'three';
import type { PhysicsObject } from '../../store/useSimulationStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import { physicsEngine } from '../../engine/PhysicsEngine';
import { Trail } from '@react-three/drei';

interface EntityProps {
  obj: PhysicsObject;
}

export const Entity: React.FC<EntityProps> = ({ obj }) => {
  const meshRef = useRef<Mesh>(null);
  const arrowRef = useRef<ArrowHelper>(null);
  const lineRef = useRef<THREE.Line>(null);
  const showVectors = useSimulationStore(state => state.showVectors);

  const arrowDir = useMemo(() => new Vector3(0, 1, 0), []);
  const lineGeometry = useMemo(() => new BufferGeometry(), []);

  // High-performance visual sync from physics data
  useFrame(() => {
    if (!meshRef.current) return;
    const pData = physicsEngine.bodies.find((p) => p.id === obj.id);
    if (pData) {
      meshRef.current.position.copy(pData.position);
      
      if (arrowRef.current && showVectors) {
        arrowRef.current.position.copy(pData.position);
        
        const speed = pData.velocity.length();
        if (speed > 0.01) {
          arrowRef.current.setDirection(pData.velocity.clone().normalize());
          arrowRef.current.setLength(speed * 0.5 + obj.radius, obj.radius * 0.5, obj.radius * 0.2);
          arrowRef.current.visible = true;
        } else {
          arrowRef.current.visible = false;
        }
      } else if (arrowRef.current) {
        arrowRef.current.visible = false;
      }

      // Update trajectory
      if (lineRef.current && physicsEngine.trajectories[obj.id]) {
        const path = physicsEngine.trajectories[obj.id];
        const positions = new Float32Array(path.length * 3);
        for (let i = 0; i < path.length; i++) {
          positions[i*3] = path[i][0];
          positions[i*3+1] = path[i][1];
          positions[i*3+2] = path[i][2];
        }
        lineGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
        lineRef.current.visible = true;
      } else if (lineRef.current) {
        lineRef.current.visible = false;
      }
    }
  });

  return (
    <group>
      {!obj.isStatic && (
        <Trail
          width={obj.radius * 2} // Trial width based on radius
          length={40} // Length of trail
          color={obj.color}
          attenuation={(t) => t * t} // Taper off
        >
          <mesh ref={meshRef}>
            <sphereGeometry args={[obj.radius, 32, 32]} />
            <meshStandardMaterial
              color={obj.color}
              emissive={obj.color}
              emissiveIntensity={0.5}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        </Trail>
      )}

      {obj.isStatic && !obj.isBlackHole && (
        <mesh ref={meshRef}>
          <sphereGeometry args={[obj.radius, 32, 32]} />
          <meshStandardMaterial
            color={obj.color}
            emissive={obj.color}
            emissiveIntensity={0.8}
            wireframe={true} // Sci-fi style for static/gravity wells
          />
        </mesh>
      )}

      {/* Black Hole Event Horizon */}
      {obj.isBlackHole && (
        <mesh ref={meshRef}>
          <sphereGeometry args={[obj.radius, 64, 64]} />
          <meshBasicMaterial color="#000000" />
          {/* Gravitational lensing visual effect ring */}
          <mesh>
            <ringGeometry args={[obj.radius * 1.1, obj.radius * 2.0, 64]} />
            <meshBasicMaterial color="#00f0ff" transparent opacity={0.1} side={2} />
          </mesh>
        </mesh>
      )}

      {/* Velocity Vector Helper */}
      <primitive 
        object={new ArrowHelper(arrowDir, new Vector3(0, 0, 0), 1, 0x00f0ff)} 
        ref={arrowRef} 
        visible={showVectors}
      />

      {/* Trajectory Prediction Line */}
      {lineRef.current && physicsEngine.trajectories[obj.id] && (
        <primitive 
          object={new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: obj.color, opacity: 0.5, transparent: true, linewidth: 2 }))} 
          ref={lineRef} 
        />
      )}
    </group>
  );
};
