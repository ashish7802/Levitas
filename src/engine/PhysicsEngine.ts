// src/engine/PhysicsEngine.ts
import { Vector3 } from 'three';
import type { BodyData } from './physics.worker';

// Worker Wrapper
export class PhysicsEngine {
  private worker: Worker;
  
  // High-frequency shared state
  public bodies: Array<{
    id: string; position: Vector3; velocity: Vector3; 
    mass: number; radius: number; isStatic: boolean; isBlackHole: boolean; color: string;
  }> = [];
  
  public telemetry = { ke: 0, pe: 0, cm: [0, 0, 0] };
  public telemetryHistory: Array<{ time: number, ke: number, pe: number }> = [];
  private ticks: number = 0;
  
  public trajectories: Record<string, number[][]> = {};
  public aiEvents: Array<{ type: string, msg: string }> = [];
  
  public gravityConstant = 0.1;
  public timeScale = 1.0;

  constructor() {
    this.worker = new Worker(new URL('./physics.worker.ts', import.meta.url), { type: 'module' });
    
    this.worker.onmessage = (e) => {
      if (e.data.type === 'STATE_UPDATE') {
        const payload = e.data.payload;
        this.telemetry = payload.telemetry;
        this.trajectories = payload.trajectories;
        this.aiEvents = payload.aiEvents || [];
        
        this.ticks++;
        if (this.ticks % 10 === 0) {
          this.telemetryHistory.push({ time: this.ticks, ke: payload.telemetry.ke, pe: payload.telemetry.pe });
          if (this.telemetryHistory.length > 50) this.telemetryHistory.shift();
        }
        
        // Sync payload bodies back to THREE.js objects
        payload.bodies.forEach((bData: BodyData) => {
          const body = this.bodies.find(b => b.id === bData.id);
          if (body) {
            body.position.set(bData.x, bData.y, bData.z);
            body.velocity.set(bData.vx, bData.vy, bData.vz);
          }
        });
      }
    };
  }

  public setBodies(newBodies: any[]) {
    this.bodies = newBodies.map(b => ({
      id: b.id,
      position: new Vector3(...b.position),
      velocity: new Vector3(...b.velocity),
      mass: b.mass,
      radius: b.radius,
      isStatic: !!b.isStatic,
      isBlackHole: !!b.isBlackHole,
      color: b.color
    }));
    this.syncToWorker(true);
  }

  public addBody(b: any) {
    this.bodies.push({
      id: b.id,
      position: new Vector3(...b.position),
      velocity: new Vector3(...b.velocity),
      mass: b.mass,
      radius: b.radius,
      isStatic: !!b.isStatic,
      isBlackHole: !!b.isBlackHole,
      color: b.color
    });
    this.syncToWorker();
  }

  public removeBody(id: string) {
    this.bodies = this.bodies.filter(b => b.id !== id);
    this.syncToWorker();
  }

  private syncToWorker(isInit = false) {
    const payload = this.bodies.map(b => ({
      id: b.id, x: b.position.x, y: b.position.y, z: b.position.z,
      vx: b.velocity.x, vy: b.velocity.y, vz: b.velocity.z,
      mass: b.mass, radius: b.radius, isStatic: b.isStatic, isBlackHole: b.isBlackHole
    }));
    this.worker.postMessage({ type: isInit ? 'INIT' : 'UPDATE_STATE', payload: { bodies: payload, gravityConstant: this.gravityConstant, timeScale: this.timeScale } });
  }

  public step(delta: number) {
    // Send step command to worker
    this.worker.postMessage({ type: 'STEP', payload: { delta } });
  }

  public updateParameters(g: number, ts: number) {
    this.gravityConstant = g;
    this.timeScale = ts;
    this.syncToWorker();
  }
}

export const physicsEngine = new PhysicsEngine();
