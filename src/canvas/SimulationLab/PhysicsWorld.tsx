import React, { useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSimulationStore } from '../../store/useSimulationStore';
import { physicsEngine } from '../../engine/PhysicsEngine';
import { Vector3 } from 'three';

export const PhysicsWorld: React.FC = () => {
  const { objects, isPlaying } = useSimulationStore();
  
  // Sync initial React objects into the engine
  useEffect(() => {
    // Only set bodies if engine is empty (to respect existing engine state)
    if (physicsEngine.bodies.length === 0) {
      physicsEngine.setBodies(objects.map(obj => ({
        id: obj.id,
        position: new Vector3(...obj.position),
        velocity: new Vector3(...obj.velocity),
        acceleration: new Vector3(0, 0, 0),
        mass: obj.mass,
        radius: obj.radius,
        isStatic: obj.isStatic
      })));
    }
  }, [objects]);

  useFrame((_, delta) => {
    if (!isPlaying) return;
    physicsEngine.step(delta);
  });

  return null;
};
