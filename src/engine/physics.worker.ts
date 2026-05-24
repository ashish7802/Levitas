// physics.worker.ts
// Off-thread Physics Engine using Runge-Kutta 4 (Velocity Verlet) and Barnes-Hut Optimization

export interface BodyData {
  id: string;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  mass: number;
  radius: number;
  isStatic: boolean;
  isBlackHole: boolean;
}

let bodies: BodyData[] = [];
let gravityConstant = 0.1;
let timeScale = 1.0;
let softening = 0.5;
let restitution = 0.8;
let useBarnesHut = true;
let theta = 0.5; // Barnes-Hut accuracy parameter

const MAX_PREDICTION_STEPS = 100;
const PREDICTION_DT = 0.5;

// Octree Node for Barnes-Hut
class OctreeNode {
  mass: number = 0;
  cmx: number = 0; cmy: number = 0; cmz: number = 0;
  minX: number; maxX: number;
  minY: number; maxY: number;
  minZ: number; maxZ: number;
  children: OctreeNode[] | null = null;
  body: BodyData | null = null; // Leaf node body

  constructor(minX: number, maxX: number, minY: number, maxY: number, minZ: number, maxZ: number) {
    this.minX = minX; this.maxX = maxX;
    this.minY = minY; this.maxY = maxY;
    this.minZ = minZ; this.maxZ = maxZ;
  }

  insert(b: BodyData) {
    if (this.children === null && this.body === null) {
      this.body = b;
      this.mass = b.mass;
      this.cmx = b.x; this.cmy = b.y; this.cmz = b.z;
      return;
    }

    if (this.children === null) {
      this.subdivide();
      if (this.body) {
        this.insertToChildren(this.body);
        this.body = null;
      }
    }

    this.insertToChildren(b);
    
    // Update center of mass
    const totalMass = this.mass + b.mass;
    this.cmx = (this.cmx * this.mass + b.x * b.mass) / totalMass;
    this.cmy = (this.cmy * this.mass + b.y * b.mass) / totalMass;
    this.cmz = (this.cmz * this.mass + b.z * b.mass) / totalMass;
    this.mass = totalMass;
  }

  private subdivide() {
    const midX = (this.minX + this.maxX) / 2;
    const midY = (this.minY + this.maxY) / 2;
    const midZ = (this.minZ + this.maxZ) / 2;
    this.children = [
      new OctreeNode(this.minX, midX, this.minY, midY, this.minZ, midZ),
      new OctreeNode(midX, this.maxX, this.minY, midY, this.minZ, midZ),
      new OctreeNode(this.minX, midX, midY, this.maxY, this.minZ, midZ),
      new OctreeNode(midX, this.maxX, midY, this.maxY, this.minZ, midZ),
      new OctreeNode(this.minX, midX, this.minY, midY, midZ, this.maxZ),
      new OctreeNode(midX, this.maxX, this.minY, midY, midZ, this.maxZ),
      new OctreeNode(this.minX, midX, midY, this.maxY, midZ, this.maxZ),
      new OctreeNode(midX, this.maxX, midY, this.maxY, midZ, this.maxZ),
    ];
  }

  private insertToChildren(b: BodyData) {
    const midX = (this.minX + this.maxX) / 2;
    const midY = (this.minY + this.maxY) / 2;
    const midZ = (this.minZ + this.maxZ) / 2;
    let idx = 0;
    if (b.x >= midX) idx |= 1;
    if (b.y >= midY) idx |= 2;
    if (b.z >= midZ) idx |= 4;
    this.children![idx].insert(b);
  }
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'INIT' || type === 'UPDATE_STATE') {
    bodies = payload.bodies;
    gravityConstant = payload.gravityConstant ?? gravityConstant;
    timeScale = payload.timeScale ?? timeScale;
  } else if (type === 'STEP') {
    const delta = payload.delta;
    step(delta);
    
    // Telemetry & Analysis AI
    let ke = 0; let pe = 0;
    let cmx = 0, cmy = 0, cmz = 0;
    let totalMass = 0;
    
    // AI Events
    let events: any[] = [];

    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (!b.isStatic) {
        ke += 0.5 * b.mass * (b.vx*b.vx + b.vy*b.vy + b.vz*b.vz);
      }
      totalMass += b.mass;
      cmx += b.x * b.mass; cmy += b.y * b.mass; cmz += b.z * b.mass;
      
      for (let j = i + 1; j < bodies.length; j++) {
        const b2 = bodies[j];
        const dx = b2.x - b.x; const dy = b2.y - b.y; const dz = b2.z - b.z;
        const distSq = dx*dx + dy*dy + dz*dz;
        if (distSq > 0) pe -= (gravityConstant * b.mass * b2.mass) / Math.sqrt(distSq);
      }
      
      // Black hole proximity warning AI
      if (b.isBlackHole) {
        for(let k = 0; k < bodies.length; k++) {
           if(k===i) continue;
           const target = bodies[k];
           const dist = Math.sqrt(Math.pow(target.x - b.x, 2) + Math.pow(target.y - b.y, 2) + Math.pow(target.z - b.z, 2));
           if (dist < b.radius * 5 && !target.isBlackHole) {
             events.push({ type: 'CRITICAL', msg: `Entity ${target.id.substring(0,4)} entering Event Horizon proximity!` });
           }
        }
      }
    }

    if (totalMass > 0) { cmx /= totalMass; cmy /= totalMass; cmz /= totalMass; }

    let trajectories: Record<string, number[][]> = {};
    const target = bodies.find(b => !b.isStatic);
    if (target) {
      trajectories[target.id] = calculateTrajectory(target);
    }

    self.postMessage({
      type: 'STATE_UPDATE',
      payload: {
        bodies,
        telemetry: { ke, pe, cm: [cmx, cmy, cmz], totalMass, activeBodies: bodies.length },
        trajectories,
        aiEvents: events
      }
    });
  }
};

function calculateTrajectory(target: BodyData) {
  let x = target.x, y = target.y, z = target.z;
  let vx = target.vx, vy = target.vy, vz = target.vz;
  const path: number[][] = [[x, y, z]];

  for (let step = 0; step < MAX_PREDICTION_STEPS; step++) {
    let ax = 0, ay = 0, az = 0;
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b.id === target.id) continue;
      const dx = b.x - x; const dy = b.y - y; const dz = b.z - z;
      const distSq = dx*dx + dy*dy + dz*dz;
      const dist = Math.sqrt(distSq);
      const fMag = (gravityConstant * b.mass) / (distSq + softening);
      ax += (dx / dist) * fMag; ay += (dy / dist) * fMag; az += (dz / dist) * fMag;
    }
    vx += ax * PREDICTION_DT; vy += ay * PREDICTION_DT; vz += az * PREDICTION_DT;
    x += vx * PREDICTION_DT; y += vy * PREDICTION_DT; z += vz * PREDICTION_DT;
    path.push([x, y, z]);
  }
  return path;
}

function buildOctree(bodies: BodyData[]) {
  if (bodies.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const b of bodies) {
    if (b.x < minX) minX = b.x; if (b.x > maxX) maxX = b.x;
    if (b.y < minY) minY = b.y; if (b.y > maxY) maxY = b.y;
    if (b.z < minZ) minZ = b.z; if (b.z > maxZ) maxZ = b.z;
  }
  const padding = 1.0;
  const root = new OctreeNode(minX - padding, maxX + padding, minY - padding, maxY + padding, minZ - padding, maxZ + padding);
  for (const b of bodies) root.insert(b);
  return root;
}

function computeForceBarnesHut(node: OctreeNode, b: BodyData): [number, number, number] {
  if (node.mass === 0) return [0, 0, 0];
  
  const dx = node.cmx - b.x; const dy = node.cmy - b.y; const dz = node.cmz - b.z;
  const distSq = dx*dx + dy*dy + dz*dz;
  const dist = Math.sqrt(distSq);

  // If node contains only one body, or is far enough away
  const width = node.maxX - node.minX;
  if (node.body !== null || width / dist < theta) {
    if (node.body && node.body.id === b.id) return [0, 0, 0]; // Self
    
    if (node.body?.isBlackHole && dist < node.body.radius * 2) {
      return [(dx/dist) * 10000, (dy/dist) * 10000, (dz/dist) * 10000];
    }
    
    const fMag = (gravityConstant * node.mass) / (distSq + softening);
    return [(dx/dist)*fMag, (dy/dist)*fMag, (dz/dist)*fMag];
  }

  // Otherwise, traverse children
  let ax = 0, ay = 0, az = 0;
  if (node.children) {
    for (const child of node.children) {
      const [cAx, cAy, cAz] = computeForceBarnesHut(child, b);
      ax += cAx; ay += cAy; az += cAz;
    }
  }
  return [ax, ay, az];
}

function computeAccelerations(state: BodyData[], outAcc: Float32Array) {
  if (useBarnesHut && state.length > 50) {
    const root = buildOctree(state);
    if (!root) return;
    for (let i = 0; i < state.length; i++) {
      if (state[i].isStatic) continue;
      const [ax, ay, az] = computeForceBarnesHut(root, state[i]);
      outAcc[i*3] = ax; outAcc[i*3+1] = ay; outAcc[i*3+2] = az;
    }
  } else {
    // Standard O(N^2)
    for (let i = 0; i < state.length; i++) {
      const objA = state[i];
      if (objA.isStatic) continue;
      let ax = 0, ay = 0, az = 0;
      for (let j = 0; j < state.length; j++) {
        if (i === j) continue;
        const objB = state[j];
        const dx = objB.x - objA.x; const dy = objB.y - objA.y; const dz = objB.z - objA.z;
        const distSq = dx*dx + dy*dy + dz*dz;
        const dist = Math.sqrt(distSq);
        if (objB.isBlackHole && dist < objB.radius * 2) {
           ax += (dx/dist) * 10000; ay += (dy/dist) * 10000; az += (dz/dist) * 10000;
        } else {
           const fMag = (gravityConstant * objB.mass) / (distSq + softening);
           ax += (dx / dist) * fMag; ay += (dy / dist) * fMag; az += (dz / dist) * fMag;
        }
      }
      outAcc[i*3] = ax; outAcc[i*3+1] = ay; outAcc[i*3+2] = az;
    }
  }
}

function step(delta: number) {
  if (bodies.length === 0) return;
  const dt = Math.min(delta, 0.1) * timeScale;
  
  const acc = new Float32Array(bodies.length * 3);
  computeAccelerations(bodies, acc);

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (b.isStatic) continue;
    b.x += b.vx * dt + 0.5 * acc[i*3] * dt * dt;
    b.y += b.vy * dt + 0.5 * acc[i*3+1] * dt * dt;
    b.z += b.vz * dt + 0.5 * acc[i*3+2] * dt * dt;
    b.vx += 0.5 * acc[i*3] * dt;
    b.vy += 0.5 * acc[i*3+1] * dt;
    b.vz += 0.5 * acc[i*3+2] * dt;
  }

  const newAcc = new Float32Array(bodies.length * 3);
  computeAccelerations(bodies, newAcc);

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    if (b.isStatic) continue;
    b.vx += 0.5 * newAcc[i*3] * dt;
    b.vy += 0.5 * newAcc[i*3+1] * dt;
    b.vz += 0.5 * newAcc[i*3+2] * dt;
  }

  resolveCollisions();
}

function resolveCollisions() {
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const b1 = bodies[i]; const b2 = bodies[j];
      const dx = b2.x - b1.x; const dy = b2.y - b1.y; const dz = b2.z - b1.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      const minDistance = b1.radius + b2.radius;

      if (dist < minDistance && dist > 0) {
        const nx = dx / dist; const ny = dy / dist; const nz = dz / dist;
        const rvx = b2.vx - b1.vx; const rvy = b2.vy - b1.vy; const rvz = b2.vz - b1.vz;
        const velAlongNormal = rvx*nx + rvy*ny + rvz*nz;

        if (velAlongNormal > 0) continue;
        const invMassA = b1.isStatic ? 0 : 1 / b1.mass;
        const invMassB = b2.isStatic ? 0 : 1 / b2.mass;

        const jImpulse = -(1 + restitution) * velAlongNormal / (invMassA + invMassB);
        const ix = nx * jImpulse; const iy = ny * jImpulse; const iz = nz * jImpulse;

        if (!b1.isStatic) { b1.vx -= ix * invMassA; b1.vy -= iy * invMassA; b1.vz -= iz * invMassA; }
        if (!b2.isStatic) { b2.vx += ix * invMassB; b2.vy += iy * invMassB; b2.vz += iz * invMassB; }

        const percent = 0.2; const slop = 0.01;
        const penetration = minDistance - dist;
        const correctionMag = Math.max(penetration - slop, 0.0) / (invMassA + invMassB) * percent;
        const cx = nx * correctionMag; const cy = ny * correctionMag; const cz = nz * correctionMag;

        if (!b1.isStatic) { b1.x -= cx * invMassA; b1.y -= cy * invMassA; b1.z -= cz * invMassA; }
        if (!b2.isStatic) { b2.x += cx * invMassB; b2.y += cy * invMassB; b2.z += cz * invMassB; }
      }
    }
  }
}
