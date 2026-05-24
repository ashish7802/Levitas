import { create } from 'zustand';
import { physicsEngine } from '../engine/PhysicsEngine';

export type PhysicsObject = {
  id: string;
  mass: number;
  position: [number, number, number];
  velocity: [number, number, number];
  color: string;
  radius: number;
  isStatic?: boolean;
  isBlackHole?: boolean;
};

interface SimulationState {
  objects: PhysicsObject[];
  gravityConstant: number;
  timeScale: number;
  isPlaying: boolean;
  showVectors: boolean;
  
  // Actions
  addObject: (obj: Omit<PhysicsObject, 'id'>) => void;
  updateObject: (id: string, updates: Partial<PhysicsObject>) => void;
  removeObject: (id: string) => void;
  clearObjects: () => void;
  setGravityConstant: (G: number) => void;
  setTimeScale: (scale: number) => void;
  togglePlayback: () => void;
  toggleVectors: () => void;
  resetSimulation: () => void;
}

const INITIAL_OBJECTS: PhysicsObject[] = [
  {
    id: 'central-mass',
    mass: 5000,
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    color: '#ff00ff',
    radius: 2,
    isStatic: true,
  },
  {
    id: 'orbiter-1',
    mass: 10,
    position: [10, 0, 0],
    velocity: [0, 15, 0], // roughly orbital velocity for this mass and G
    color: '#00f0ff',
    radius: 0.5,
  },
];

export const useSimulationStore = create<SimulationState>((set) => ({
  objects: INITIAL_OBJECTS,
  gravityConstant: 0.1,
  timeScale: 1,
  isPlaying: true,
  showVectors: true,

  addObject: (obj) =>
    set((state) => {
      const newObj = { ...obj, id: Math.random().toString(36).substr(2, 9) };
      physicsEngine.addBody(newObj);
      return { objects: [...state.objects, newObj] };
    }),
    
  updateObject: (id, updates) =>
    set((state) => {
      return {
        objects: state.objects.map((obj) =>
          obj.id === id ? { ...obj, ...updates } : obj
        ),
      };
    }),
    
  removeObject: (id) =>
    set((state) => {
      physicsEngine.removeBody(id);
      return { objects: state.objects.filter((obj) => obj.id !== id) };
    }),
    
  clearObjects: () => {
    physicsEngine.setBodies([]);
    set({ objects: [] });
  },
  
  setGravityConstant: (G) => {
    physicsEngine.updateParameters(G, physicsEngine.timeScale);
    set({ gravityConstant: G });
  },
  
  setTimeScale: (scale) => {
    physicsEngine.updateParameters(physicsEngine.gravityConstant, scale);
    set({ timeScale: scale });
  },
  
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  toggleVectors: () => set((state) => ({ showVectors: !state.showVectors })),
  
  resetSimulation: () =>
    set({
      objects: INITIAL_OBJECTS,
      gravityConstant: 0.1,
      timeScale: 1,
      isPlaying: true,
    }),
}));
