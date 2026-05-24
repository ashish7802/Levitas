<div align="center">
  
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/orbit.svg" width="100" height="100" alt="Levitas Logo" />

  <h1>Project Levitas</h1>

  <p><strong>A hardware-accelerated N-Body gravity research platform and aerospace simulation sandbox.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=flat-square&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=three.js&logoColor=white" alt="Three.js" />
    <img src="https://img.shields.io/badge/Web%20Workers-FF5722?style=flat-square&logo=html5&logoColor=white" alt="Web Workers" />
    <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
    <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License" />
  </p>

  <p>
    <a href="#demo">Live Demo</a> •
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#engineering-highlights">Engineering</a> •
    <a href="#installation">Installation</a>
  </p>
</div>

---

## 🚀 Overview

**Project Levitas** is an elite, browser-based physics simulation engine engineered specifically for complex orbital mechanics and high-density gravitational systems. 

Moving beyond traditional rigid-body WebGL demonstrations, Levitas implements a bespoke **Velocity Verlet integrator** and a recursive **Barnes-Hut Octree** optimization algorithm, running entirely within a dedicated Web Worker. This decoupled architecture ensures mathematical determinism and numerical stability across millions of calculation steps without degrading main-thread rendering performance.

## 🌐 Demo

**[Launch Live Simulation]((#))** *(https://project-levitas.vercel.app/)*

<div align="center">
  <img src="https://raw.githubusercontent.com/ashish7802/Levitas/main/assets/levitas-preview.png" alt="Levitas Preview" />
</div>

## ✨ Features

- **Real-Time N-Body Gravity**: Simulates complex multi-body gravitational interactions with strict conservation of momentum.
- **Barnes-Hut Optimization**: Automatically builds an spatial subdivision Octree to compute forces in $O(N \log N)$ time, enabling the simulation of massive particle clouds and galaxy formations.
- **Off-Thread Compute Loop**: Physics integration runs in a dedicated Web Worker, preventing heavy mathematical loads from dropping the UI render framerate.
- **Velocity Verlet Integrator**: Delivers superior energy conservation and numerical stability over long simulation durations compared to standard explicit Euler methods.
- **Black Hole Mechanics**: Render Event Horizons with extreme tidal thresholds (spaghettification proxy) and customizable gravitational lensing visualizations.
- **Real-Time Trajectory Prediction**: The engine performs forward-simulation passes asynchronously to visualize deterministic orbital flight paths.
- **AI Anomaly Detection**: An internal heuristic continuously parses simulation telemetry to automatically log instability warnings and catastrophic capture events.
- **Telemetry Dashboards**: Live data pipelines inject kinetic/potential energy readouts and center-of-mass vectors directly into DOM-layered charts via Recharts.
- **Galaxy Sandbox Preset**: Procedurally generate 150+ body parametric spiral galaxies directly from the command UI.
- **JSON Export / Import**: Fully serialize the simulation vector states to JSON for repeatable experiment analysis.

## 🏗 Architecture

The platform follows a strict, modular separation of concerns designed for high-throughput visualization applications:

- **The Engine Layer (`/src/engine`)**: A pure TypeScript Web Worker environment. Handles matrix allocations, integration steps, Octree traversal, and heuristic evaluations.
- **The Visualizer (`/src/canvas`)**: A React Three Fiber (`@react-three/fiber`) renderer. Consumes state payloads and utilizes `InstancedMesh` alongside `@react-three/postprocessing` (Bloom, Lensing) for hyper-optimized draw calls.
- **The State Pipeline (`/src/store`)**: Managed via Zustand. It acts as the sync boundary, passing serialized `Float32Array` data and telemetry between the Worker and the DOM.
- **The Interface (`/src/ui`)**: Aerospace-inspired holographic control overlays, featuring hardware-accelerated metric graphing bypassing standard React diffing where necessary for performance.

## 🛠 Engineering Highlights

- **$O(N \log N)$ Scaling**: Naive $O(N^2)$ gravity simulations choke the browser beyond ~300 bodies. By clustering distant masses using Center of Mass approximations (Barnes-Hut), Levitas effortlessly handles dense stellar clusters.
- **Deterministic Numerical Stability**: The Velocity Verlet integrator correctly aligns position and acceleration updates, drastically reducing the "energy drift" typical in standard game physics engines, allowing for stable planetary orbits.
- **Zero-Blocking Architecture**: By utilizing Web Workers, the main UI thread operates exclusively as a dumb rendering client. The physics engine can compute thousands of steps per frame without triggering browser lockup.
- **Memory Efficiency**: Heavy object instantiations inside the simulation loop are avoided. Force aggregations utilize pre-allocated `Float32Array` buffers to eliminate runtime garbage collection stutter.

## 💻 Tech Stack

- **Core**: TypeScript, React 18, Web Workers API
- **Rendering**: Three.js, React Three Fiber, React Three Drei
- **Post-Processing**: React Three Postprocessing
- **State & Data**: Zustand, Recharts
- **Build & Tooling**: Vite, ESLint, TypeScript Compiler

## 📊 Performance Benchmark (Target Metrics)

*Benchmarks captured on standard M1/M2 silicon equivalents (Chrome V8).*

| Simulation Scope | Integrator | Force Calc | Render FPS | Worker Compute |
| :--- | :--- | :--- | :--- | :--- |
| **50 Bodies** | Velocity Verlet | Naive $O(N^2)$ | 60 FPS | < 1ms |
| **500 Bodies** | Velocity Verlet | Barnes-Hut | 60 FPS | ~4ms |
| **1500 Bodies** | Velocity Verlet | Barnes-Hut | 50-60 FPS | ~12ms |

## ⚙️ Installation

```bash
# 1. Clone the repository
git clone https://github.com/ashish7802/levitas.git

# 2. Navigate into the directory
cd levitas

# 3. Install dependencies
npm install

# 4. Start the Vite development server
npm run dev
```

## 🕹 Usage

1. Open `http://localhost:5173`.
2. Expand the **Spawner** tab on the left dashboard.
3. Click **Galaxy Sandbox** to initiate a multi-body simulation.
4. Spawn a **Black Hole** to observe trajectory deviations and AI event warnings.
5. Use mouse interactions to Pan/Zoom across the 3D space.

## 📁 Project Structure

```text
levitas/
├── src/
│   ├── canvas/             # R3F Rendering & Shaders
│   │   └── SimulationLab/  # 3D Entities, Particle Grids
│   ├── engine/             # Math & Physics Logic
│   │   ├── PhysicsEngine.ts# Worker Wrapper & Pipeline
│   │   └── physics.worker.ts# Barnes-Hut & Integrator
│   ├── store/              # Zustand State Management
│   ├── ui/                 # DOM Overlays & Dashboards
│   ├── App.tsx             # Root Orchestrator
│   └── main.tsx
├── public/                 # Static Assets
├── index.html
├── vite.config.ts
├── vercel.json             # Deployment Config
└── tsconfig.json
```

## 🗺 Roadmap

- [ ] WebGPU Compute Shader integration for $O(N^2)$ calculations on the GPU.
- [ ] SharedArrayBuffer implementations for zero-copy state transfers.
- [ ] Adaptive timestepping (Runge-Kutta 4) for intense close-encounter scenarios.
- [ ] Dynamic spatial partitioning (Grid vs Octree heuristics).

## 💡 Why This Project?

Project Levitas was engineered as a portfolio piece to demonstrate a deep understanding of full-stack performance optimization, browser architecture, and applied mathematics. It bridges the gap between high-level UI frameworks (React) and low-level performance patterns (Web Workers, Typed Arrays, custom Integrators), proving the capability to architect complex, compute-heavy web applications.

## 🤝 Contributing

Contributions, issues, and feature requests are highly welcome. 
Feel free to check the [issues page](#) if you want to contribute.

## 📄 License

This project is [MIT](LICENSE) licensed.
