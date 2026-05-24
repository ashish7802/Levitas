import React, { useEffect, useRef, useState } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { physicsEngine } from '../engine/PhysicsEngine';
import { Play, Pause, RotateCcw, Activity, Orbit, AlertTriangle } from 'lucide-react';
import { LineChart, Line, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const {
    gravityConstant,
    setGravityConstant,
    timeScale,
    setTimeScale,
    isPlaying,
    togglePlayback,
    resetSimulation,
    objects,
    addObject,
    showVectors,
    toggleVectors
  } = useSimulationStore();

  const keRef = useRef<HTMLSpanElement>(null);
  const peRef = useRef<HTMLSpanElement>(null);
  const cmRef = useRef<HTMLSpanElement>(null);
  
  const [telemetryData, setTelemetryData] = useState<any[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);

  // High-performance direct DOM mutation for metrics
  useEffect(() => {
    let animationFrameId: number;
    let tickCount = 0;
    
    const updateMetrics = () => {
      if (!keRef.current || !peRef.current || !cmRef.current) return;
      
      keRef.current.innerText = physicsEngine.telemetry.ke.toExponential(2) + ' J';
      peRef.current.innerText = physicsEngine.telemetry.pe.toExponential(2) + ' J';
      
      const cm = physicsEngine.telemetry.cm;
      cmRef.current.innerText = `[${cm[0].toFixed(1)}, ${cm[1].toFixed(1)}, ${cm[2].toFixed(1)}]`;
      
      // Update React state less frequently for charts and logs
      tickCount++;
      if (tickCount % 30 === 0) {
        setTelemetryData([...physicsEngine.telemetryHistory]);
        setAiLogs([...physicsEngine.aiEvents]);
      }

      animationFrameId = requestAnimationFrame(updateMetrics);
    };

    animationFrameId = requestAnimationFrame(updateMetrics);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="dashboard-overlay pointer-events-none">
      
      {/* Top Header */}
      <header className="dashboard-header glass-panel pointer-events-auto">
        <div className="header-title">
          <Orbit className="icon-cyan" size={24} />
          <h1 className="neon-text mono-text">PROJECT LEVITAS</h1>
        </div>
        <div className="header-status">
          <span className="status-indicator"></span>
          <span className="mono-text">SYSTEM ONLINE</span>
        </div>
      </header>

      {/* Left Panel: Control Panel */}
      <aside className="control-panel glass-panel pointer-events-auto">
        <h2 className="panel-title mono-text"><Activity size={18} /> Environment Controls</h2>
        
        <div className="control-group">
          <label>Gravity Constant (G)</label>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={gravityConstant}
            onChange={(e) => setGravityConstant(parseFloat(e.target.value))}
            className="sci-fi-slider"
          />
          <span className="value-display">{gravityConstant.toFixed(2)}</span>
        </div>

        <div className="control-group">
          <label>Time Scale</label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={timeScale}
            onChange={(e) => setTimeScale(parseFloat(e.target.value))}
            className="sci-fi-slider"
          />
          <span className="value-display">{timeScale.toFixed(1)}x</span>
        </div>

        <div className="button-group">
          <button className="sci-fi-button" onClick={toggleVectors}>
            {showVectors ? 'Hide Vectors' : 'Show Vectors'}
          </button>
        </div>

        <h3 className="panel-title mono-text" style={{marginTop: '12px'}}><Orbit size={14}/> Spawner</h3>
        <div className="button-group">
          <button className="sci-fi-button" onClick={() => addObject({
            mass: 10,
            position: [Math.random()*10 - 5, Math.random()*10 - 5, 0],
            velocity: [Math.random()*20 - 10, Math.random()*20 - 10, 0],
            color: '#00f0ff',
            radius: 0.5
          })}>Asteroid</button>
          <button className="sci-fi-button" onClick={() => addObject({
            mass: -500, // Negative mass repulsor
            position: [Math.random()*20 - 10, Math.random()*20 - 10, 0],
            velocity: [0, 0, 0],
            color: '#ff0000',
            radius: 1.5,
            isStatic: true
          })}>Repulsor</button>
          <button className="sci-fi-button" style={{borderColor: '#888', color: '#fff'}} onClick={() => addObject({
            mass: 50000,
            position: [Math.random()*20 - 10, Math.random()*20 - 10, 0],
            velocity: [0, 0, 0],
            color: '#000000',
            radius: 3.0,
            isStatic: true,
            isBlackHole: true
          })}>Black Hole</button>
        </div>

        <div className="button-group" style={{marginTop: '8px'}}>
          <button className="sci-fi-button" style={{color: '#ff00ff', borderColor: '#ff00ff'}} onClick={() => {
            // Galaxy Template
            for(let i=0; i<150; i++) {
              const angle = Math.random() * Math.PI * 2;
              const dist = Math.random() * 15 + 5;
              const vMag = Math.sqrt(0.1 * 5000 / dist);
              addObject({
                mass: Math.random() * 2 + 0.1,
                position: [Math.cos(angle)*dist, Math.sin(angle)*dist, (Math.random()-0.5)*2],
                velocity: [-Math.sin(angle)*vMag, Math.cos(angle)*vMag, 0],
                color: `hsl(${Math.random()*60 + 180}, 100%, 70%)`,
                radius: 0.2
              });
            }
          }}>Galaxy Sandbox</button>
          <button className="sci-fi-button" onClick={() => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(physicsEngine.bodies));
            const a = document.createElement('a');
            a.href = dataStr;
            a.download = "levitas_simulation.json";
            a.click();
          }}>Export JSON</button>
        </div>
      </aside>

      {/* Bottom Panel: Playback Controls */}
      <footer className="playback-controls glass-panel pointer-events-auto">
        <button className="sci-fi-button icon-btn" onClick={togglePlayback} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button className="sci-fi-button icon-btn" onClick={resetSimulation} title="Reset">
          <RotateCcw size={20} />
        </button>
      </footer>

      {/* Right Panel: Metrics & Objects */}
      <aside className="metrics-panel glass-panel pointer-events-auto">
        <h2 className="panel-title mono-text">Energy Metrics</h2>
        <div className="metrics-list">
          <div className="metric-item">
            <span>Kinetic Energy:</span>
            <span ref={keRef} className="mono-text neon-text">0.0 J</span>
          </div>
          <div className="metric-item">
            <span>Potential Energy:</span>
            <span ref={peRef} className="mono-text neon-text" style={{color: 'var(--accent-magenta)'}}>0.0e0 J</span>
          </div>
          <div className="metric-item">
            <span>Center of Mass:</span>
            <span ref={cmRef} className="mono-text neon-text" style={{color: 'var(--text-main)'}}>[0.0, 0.0, 0.0]</span>
          </div>
        </div>

        <h2 className="panel-title mono-text" style={{marginTop: '16px'}}>Diagnostic Logs</h2>
        <div className="metrics-list" style={{maxHeight: '100px', overflowY: 'auto'}}>
          <div className="metric-item" style={{color: 'var(--accent-cyan)'}}>
            <span>&gt; SYSTEM BOOT OPTIMAL</span>
          </div>
          <div className="metric-item" style={{color: 'var(--text-muted)'}}>
            <span>&gt; RK4 WORKER ONLINE</span>
          </div>
          {aiLogs.map((log, i) => (
             <div key={i} className="metric-item" style={{color: log.type === 'CRITICAL' ? '#ff0055' : 'var(--accent-magenta)'}}>
               <span>{log.type === 'CRITICAL' ? <AlertTriangle size={12}/> : '&gt;'} {log.msg}</span>
             </div>
          ))}
        </div>

        <h2 className="panel-title mono-text" style={{marginTop: '16px'}}>Energy Over Time</h2>
        <div style={{width: '100%', height: '80px', marginTop: '8px'}}>
          <ResponsiveContainer>
            <LineChart data={telemetryData}>
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #00f0ff'}} />
              <Line type="monotone" dataKey="ke" stroke="#00f0ff" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <h2 className="panel-title mono-text" style={{marginTop: '16px'}}>Entities ({objects.length})</h2>
        <div className="objects-list">
          {objects.map((obj) => (
            <div key={obj.id} className="object-item">
              <span className="color-dot" style={{ backgroundColor: obj.color }}></span>
              <span className="mono-text obj-id">{obj.id.slice(0, 6)}</span>
              <span className="obj-mass">M: {obj.mass}</span>
            </div>
          ))}
        </div>
      </aside>

    </div>
  );
};
