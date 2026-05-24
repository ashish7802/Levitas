import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Grid, Stats } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { PhysicsWorld } from './PhysicsWorld';
import { Entity } from './Entity';
import { GravityFieldRenderer } from './GravityFieldRenderer';
import { useSimulationStore } from '../../store/useSimulationStore';
import * as THREE from 'three';

export const CanvasLab: React.FC = () => {
  const { objects, addObject } = useSimulationStore();

  const handleCanvasClick = (e: any) => {
    // Only spawn if click was on the background, not panning the camera
    if (e.delta > 2) return; 

    // Find intersection with the z=0 plane to spawn object
    const vec = new THREE.Vector3();
    const pos = new THREE.Vector3();
    
    vec.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1,
      0.5
    );

    vec.unproject(e.camera);
    vec.sub(e.camera.position).normalize();

    const distance = -e.camera.position.z / vec.z;
    pos.copy(e.camera.position).add(vec.multiplyScalar(distance));

    // Spawn a random asteroid
    addObject({
      mass: Math.random() * 5 + 1,
      position: [pos.x, pos.y, 0], // Start at z=0 plane
      velocity: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 0],
      color: '#00f0ff',
      radius: Math.random() * 0.5 + 0.2,
    });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}>
      <Canvas camera={{ position: [0, 0, 40], fov: 45 }} onPointerUp={handleCanvasClick}>
        <color attach="background" args={['#050810']} />
        
        {/* Environment & Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 0]} intensity={2} color="#ff00ff" />
        
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        
        <Grid
          infiniteGrid
          fadeDistance={50}
          sectionColor="#004488"
          cellColor="#002244"
          cellSize={2}
          sectionSize={10}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, -5]}
        />

        {/* Physics Engine */}
        <PhysicsWorld />

        {/* Gravity Potential Field Visualizer */}
        <GravityFieldRenderer />

        {/* Render Entities */}
        <Suspense fallback={null}>
          {objects.map((obj) => (
            <Entity key={obj.id} obj={obj} />
          ))}
        </Suspense>

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

        {/* Post-Processing for Sci-Fi Glow */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={1.5} />
        </EffectComposer>
      </Canvas>
      <Stats className="fps-monitor" />
    </div>
  );
};
