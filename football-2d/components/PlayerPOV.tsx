'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Constants from main game
const FIELD_WIDTH = 1000;
const FIELD_HEIGHT = 600;
const GOAL_TOP = 240;
const GOAL_BOTTOM = 360;

interface Player {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  role: 'GK' | 'FIELD';
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface PlayerKnowledge {
  playerId: string;
  team: 'red' | 'blue';
  currentScore: { red: number; blue: number };
  fovScreenshots: string[];

  // Strategic information
  myCurrentStrategy: string;
  teammateStrategies: { playerId: string; strategy: string }[];

  // Game context
  myGoalSide: 'left' | 'right';
  opponentGoalSide: 'left' | 'right';
  myRole: 'GK' | 'FIELD';

  // Game knowledge
  roleDescriptions: {
    GK: string;
    FIELD: string;
  };
  strategyGuidelines: {
    offensive: string[];
    defensive: string[];
    balanced: string[];
  };
  whenToUseStrategies: {
    winning: string;
    losing: string;
    tied: string;
  };
}

interface PlayerPOVProps {
  player: Player;
  redTeam: Player[];
  blueTeam: Player[];
  ball: Ball;
  isRed: boolean;
  knowledge: PlayerKnowledge;
  onCanvasReady?: (playerId: string, canvas: HTMLCanvasElement) => void;
}

// Convert 2D coordinates to 3D
const to3D = (x: number, y: number, z: number = 0) => {
  return [
    (x - FIELD_WIDTH / 2) / 10,
    z,
    -(y - FIELD_HEIGHT / 2) / 10
  ] as [number, number, number];
};

// Simple 3D Player for POV
const SimplePOVPlayer3D = ({ player, isRed, isSelf }: { player: Player; isRed: boolean; isSelf: boolean }) => {
  if (isSelf) return null; // Don't render the player we're viewing from

  const [x, y, z] = to3D(player.x, player.y, 1.2);
  const color = isRed ? '#dc2626' : '#2563eb';

  return (
    <group position={[x, y, z]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.4, 1.6, 8, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.05} />
      </mesh>
    </group>
  );
};

// Simple Ball for POV
const SimpleBall3D = ({ ball }: { ball: Ball }) => {
  const [x, y, z] = to3D(ball.x, ball.y, 0.4);
  return (
    <mesh position={[x, y, z]} castShadow>
      <sphereGeometry args={[0.4, 32, 32]} />
      <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
    </mesh>
  );
};

// Camera controller component
const CameraController = ({ player, ball }: { player: Player; ball: Ball }) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  useFrame(() => {
    if (cameraRef.current) {
      const [px, py, pz] = to3D(player.x, player.y, 1.8);
      const [bx, by, bz] = to3D(ball.x, ball.y, 0.4);

      // Update camera position
      cameraRef.current.position.set(px, py, pz);

      // Look at the ball
      cameraRef.current.lookAt(bx, by, bz);
    }
  });

  const [px, py, pz] = to3D(player.x, player.y, 1.8);

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={[px, py, pz]}
      fov={90}
    />
  );
};

// Stadium features component
const Stadium = () => {
  // Generate random fans in stands
  const generateFans = (standPosition: [number, number, number], rows: number, cols: number, direction: 'horizontal' | 'vertical') => {
    const fans = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const colorChoice = Math.random();
        const color = colorChoice < 0.4 ? '#ef4444' : colorChoice < 0.8 ? '#3b82f6' : '#ffffff';

        let x = standPosition[0];
        let y = standPosition[1] + row * 0.8 - (rows * 0.4);
        let z = standPosition[2];

        if (direction === 'horizontal') {
          z += (col - cols / 2) * 0.8 + Math.random() * 0.3;
        } else {
          x += (col - cols / 2) * 0.8 + Math.random() * 0.3;
        }

        fans.push(
          <mesh key={`fan-${row}-${col}`} position={[x, y, z]} castShadow>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.6} emissive={color} emissiveIntensity={0.2} />
          </mesh>
        );
      }
    }
    return fans;
  };

  return (
    <group>
      {/* Stadium walls/stands - all four sides with fewer fans for performance */}
      {/* Left stand */}
      <mesh position={[-60, 8, 0]} receiveShadow castShadow>
        <boxGeometry args={[4, 16, 80]} />
        <meshStandardMaterial color="#2d3748" roughness={0.7} metalness={0.2} emissive="#1a202c" emissiveIntensity={0.1} />
      </mesh>
      {generateFans([-58, 8, 0], 6, 25, 'horizontal')}

      {/* Right stand */}
      <mesh position={[60, 8, 0]} receiveShadow castShadow>
        <boxGeometry args={[4, 16, 80]} />
        <meshStandardMaterial color="#2d3748" roughness={0.7} metalness={0.2} emissive="#1a202c" emissiveIntensity={0.1} />
      </mesh>
      {generateFans([58, 8, 0], 6, 25, 'horizontal')}

      {/* Top stand */}
      <mesh position={[0, 8, -40]} receiveShadow castShadow>
        <boxGeometry args={[120, 16, 4]} />
        <meshStandardMaterial color="#2d3748" roughness={0.7} metalness={0.2} emissive="#1a202c" emissiveIntensity={0.1} />
      </mesh>
      {generateFans([0, 8, -38], 6, 30, 'vertical')}

      {/* Bottom stand */}
      <mesh position={[0, 8, 40]} receiveShadow castShadow>
        <boxGeometry args={[120, 16, 4]} />
        <meshStandardMaterial color="#2d3748" roughness={0.7} metalness={0.2} emissive="#1a202c" emissiveIntensity={0.1} />
      </mesh>
      {generateFans([0, 8, 38], 6, 30, 'vertical')}

      {/* Floodlights with brighter illumination */}
      {[
        [-55, 22, -35],
        [-55, 22, 35],
        [55, 22, -35],
        [55, 22, 35],
      ].map((pos, idx) => (
        <group key={idx} position={pos as [number, number, number]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.4, 0.4, 15, 8]} />
            <meshStandardMaterial color="#4a5568" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Main floodlight */}
          <pointLight position={[0, 3, 0]} intensity={500} distance={80} color="#fff8e1" castShadow />
          {/* Ambient fill light */}
          <pointLight position={[0, 5, 0]} intensity={200} distance={100} color="#ffffff" />
        </group>
      ))}

      {/* Stand lighting to illuminate fans */}
      <pointLight position={[-60, 12, 0]} intensity={400} distance={50} color="#ffffff" />
      <pointLight position={[60, 12, 0]} intensity={400} distance={50} color="#ffffff" />
      <pointLight position={[0, 12, -40]} intensity={400} distance={50} color="#ffffff" />
      <pointLight position={[0, 12, 40]} intensity={400} distance={50} color="#ffffff" />

      {/* Advertising boards with emissive glow */}
      {[-52, 52].map((x, idx) => (
        <mesh key={`ad-lr-${idx}`} position={[x, 1, 0]} rotation={[0, idx === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <planeGeometry args={[60, 2]} />
          <meshStandardMaterial
            color="#1e88e5"
            roughness={0.3}
            metalness={0.4}
            emissive="#1565c0"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
      {[-32, 32].map((z, idx) => (
        <mesh key={`ad-tb-${idx}`} position={[0, 1, z]} rotation={[0, idx === 0 ? Math.PI : 0, 0]}>
          <planeGeometry args={[100, 2]} />
          <meshStandardMaterial
            color="#e53935"
            roughness={0.3}
            metalness={0.4}
            emissive="#c62828"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* Sky/background with gradient effect */}
      <mesh position={[0, 30, 0]}>
        <sphereGeometry args={[150, 32, 32]} />
        <meshBasicMaterial color="#87ceeb" side={THREE.BackSide} />
      </mesh>
    </group>
  );
};

// Enhanced field markings
const FieldMarkings = () => {
  return (
    <group position={[0, 0.02, 0]}>
      {/* Center line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, FIELD_HEIGHT / 10]} />
        <meshBasicMaterial color="#ffffff" opacity={0.9} transparent />
      </mesh>

      {/* Center circle - 9.15m radius */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.15 * (600 / 68) / 10, 9.15 * (600 / 68) / 10 + 0.2, 64]} />
        <meshBasicMaterial color="#ffffff" opacity={0.9} transparent />
      </mesh>

      {/* Center spot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color="#ffffff" opacity={0.9} transparent />
      </mesh>

      {/* Penalty boxes - FIFA standard 16.5m x 40.32m */}
      {[-FIELD_WIDTH / 20, FIELD_WIDTH / 20].map((x, idx) => {
        // FIFA standard dimensions: 105m x 68m pitch -> 1000 x 600 units
        // Conversion: x-axis = meters * (1000/105), z-axis = meters * (600/68)
        const penaltyBoxDepth = 16.5 * (1000 / 105) / 10; // 16.5m from goal line
        const penaltyBoxWidth = 40.32 * (600 / 68) / 10; // 40.32m wide
        const goalBoxDepth = 5.5 * (1000 / 105) / 10; // 5.5m from goal line (6-yard box)
        const goalBoxWidth = 18.32 * (600 / 68) / 10; // 18.32m wide (20 yards)
        const penaltySpotDistance = 11 * (1000 / 105) / 10; // 11m from goal line (12 yards)

        return (
          <group key={idx}>
            {/* Penalty box outline */}
            <lineSegments position={[idx === 0 ? x + penaltyBoxDepth / 2 : x - penaltyBoxDepth / 2, 0, 0]}>
              <edgesGeometry args={[new THREE.BoxGeometry(penaltyBoxDepth, 0, penaltyBoxWidth)]} />
              <lineBasicMaterial color="#ffffff" linewidth={2} />
            </lineSegments>

            {/* Goal box (6-yard box) */}
            <lineSegments position={[idx === 0 ? x + goalBoxDepth / 2 : x - goalBoxDepth / 2, 0, 0]}>
              <edgesGeometry args={[new THREE.BoxGeometry(goalBoxDepth, 0, goalBoxWidth)]} />
              <lineBasicMaterial color="#ffffff" linewidth={2} />
            </lineSegments>

            {/* Penalty spot */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[idx === 0 ? x + penaltySpotDistance : x - penaltySpotDistance, 0, 0]}>
              <circleGeometry args={[0.2, 32]} />
              <meshBasicMaterial color="#ffffff" opacity={0.9} transparent />
            </mesh>
          </group>
        );
      })}

      {/* Corner arcs */}
      {[
        [-FIELD_WIDTH / 20, -FIELD_HEIGHT / 20],
        [-FIELD_WIDTH / 20, FIELD_HEIGHT / 20],
        [FIELD_WIDTH / 20, -FIELD_HEIGHT / 20],
        [FIELD_WIDTH / 20, FIELD_HEIGHT / 20],
      ].map((pos, idx) => (
        <mesh
          key={idx}
          rotation={[-Math.PI / 2, 0, idx * Math.PI / 2]}
          position={[pos[0], 0, pos[1]]}
        >
          <ringGeometry args={[1, 1.2, 16, 1, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#ffffff" opacity={0.9} transparent />
        </mesh>
      ))}
    </group>
  );
};

// POV Scene
const POVScene = ({ player, redTeam, blueTeam, ball, isRed }: PlayerPOVProps) => {
  return (
    <>
      {/* Camera with auto-tracking */}
      <CameraController player={player} ball={ball} />

      <group>
        {/* Lighting - Brighter and more vibrant */}
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[20, 50, 20]}
          intensity={1.8}
          color="#fff8e1"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight
          position={[-20, 30, -20]}
          intensity={0.5}
          color="#ffffff"
        />
        <hemisphereLight intensity={0.6} color="#ffffff" groundColor="#15803d" />

        {/* Stadium features */}
        <Stadium />

        {/* Field - Brighter green with grass-like appearance */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[FIELD_WIDTH / 10, FIELD_HEIGHT / 10]} />
          <meshStandardMaterial
            color="#22c55e"
            roughness={0.9}
            metalness={0.0}
            emissive="#16a34a"
            emissiveIntensity={0.1}
          />
        </mesh>

        {/* Grass pattern stripes for realism */}
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -30 + i * 6]} receiveShadow>
            <planeGeometry args={[FIELD_WIDTH / 10, 6]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#22c55e" : "#16a34a"}
              roughness={0.9}
              metalness={0.0}
              transparent
              opacity={0.3}
            />
          </mesh>
        ))}

        {/* Field border */}
        <lineSegments position={[0, 0.01, 0]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(FIELD_WIDTH / 10, FIELD_HEIGHT / 10)]} />
          <lineBasicMaterial color="#ffffff" opacity={0.9} transparent linewidth={2} />
        </lineSegments>

        {/* Enhanced field markings */}
        <FieldMarkings />

        {/* Goals */}
        {[-FIELD_WIDTH / 20, FIELD_WIDTH / 20].map((x, idx) => {
          const goalHeight = (GOAL_BOTTOM - GOAL_TOP) / 10;
          return (
            <group key={idx} position={[x, 2, 0]}>
              <mesh position={[0, 0, -goalHeight / 2]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, 4, 16]} />
                <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0, goalHeight / 2]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, 4, 16]} />
                <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[0, 2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, goalHeight, 16]} />
                <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          );
        })}

        {/* Other Players */}
        {redTeam.map(p => (
          <SimplePOVPlayer3D key={p.id} player={p} isRed={true} isSelf={p.id === player.id} />
        ))}
        {blueTeam.map(p => (
          <SimplePOVPlayer3D key={p.id} player={p} isRed={false} isSelf={p.id === player.id} />
        ))}

        {/* Ball */}
        <SimpleBall3D ball={ball} />

        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      </group>
    </>
  );
};

export const PlayerPOV = ({ player, redTeam, blueTeam, ball, isRed, knowledge, onCanvasReady }: PlayerPOVProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current && onCanvasReady) {
      const canvas = canvasRef.current.querySelector('canvas');
      if (canvas) {
        onCanvasReady(player.id, canvas);
      }
    }
  }, [player.id, onCanvasReady]);

  return (
    <div className="w-full bg-zinc-900/50 border-t-4 border-zinc-800 shadow-2xl p-4 flex flex-col items-center">
      <div className="w-full max-w-[700px]">
        {/* Live POV */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <div className={`w-4 h-4 ${isRed ? 'bg-red-600' : 'bg-blue-600'} rounded-full flex items-center justify-center text-[10px] text-white`}>
              {player.id.replace(/[rb]/, '')}
            </div>
            Player {player.id.replace(/[rb]/, '')} - First Person View
          </h3>
          <span className="text-xs text-zinc-500">🎮 POV Camera</span>
        </div>
        <div
          ref={canvasRef}
          className="relative rounded-lg overflow-hidden border-2 border-zinc-700 shadow-xl"
          style={{ width: '100%', aspectRatio: '16/9' }}
        >
          <Canvas shadows gl={{ preserveDrawingBuffer: true }}>
            <POVScene player={player} redTeam={redTeam} blueTeam={blueTeam} ball={ball} isRed={isRed} />
          </Canvas>
        </div>
        <p className="text-xs text-zinc-500 mt-2 text-center">
          Click on a player on the field to switch views
        </p>

        {/* Player Knowledge Base */}
        <div className="mt-6 bg-zinc-800/50 rounded-lg border border-zinc-700 p-4">
          <h4 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            🧠 Player Knowledge Base
          </h4>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/50 rounded p-2">
                <span className="text-[10px] text-zinc-500 uppercase block">Team</span>
                <span className={`text-xs font-bold ${knowledge.team === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                  {knowledge.team === 'red' ? '🔴 Player FC' : '🔵 CPU United'}
                </span>
              </div>
              <div className="bg-zinc-900/50 rounded p-2">
                <span className="text-[10px] text-zinc-500 uppercase block">Role</span>
                <span className="text-xs font-bold text-zinc-300">
                  {knowledge.myRole === 'GK' ? '🥅 Goalkeeper' : '⚽ Field Player'}
                </span>
              </div>
              <div className="bg-zinc-900/50 rounded p-2">
                <span className="text-[10px] text-zinc-500 uppercase block">My Goal</span>
                <span className="text-xs font-bold text-emerald-400">
                  {knowledge.myGoalSide === 'left' ? '← Left Side' : 'Right Side →'}
                </span>
              </div>
              <div className="bg-zinc-900/50 rounded p-2">
                <span className="text-[10px] text-zinc-500 uppercase block">Opponent Goal</span>
                <span className="text-xs font-bold text-orange-400">
                  {knowledge.opponentGoalSide === 'left' ? '← Left Side' : 'Right Side →'}
                </span>
              </div>
            </div>

            {/* Score */}
            <div className="bg-zinc-900/50 rounded p-2 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 uppercase">Current Score</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-red-400">{knowledge.currentScore.red}</span>
                <span className="text-xs text-zinc-500">-</span>
                <span className="text-sm font-bold text-blue-400">{knowledge.currentScore.blue}</span>
              </div>
            </div>

            {/* My Strategy */}
            <div className="bg-zinc-900/50 rounded p-2">
              <span className="text-[10px] text-zinc-500 uppercase block mb-1">My Current Strategy</span>
              <span className="text-xs font-bold text-yellow-400">{knowledge.myCurrentStrategy}</span>
            </div>

            {/* Teammate Strategies */}
            <div className="bg-zinc-900/50 rounded p-2">
              <span className="text-[10px] text-zinc-500 uppercase block mb-2">Teammate Strategies</span>
              <div className="space-y-1">
                {knowledge.teammateStrategies.map((teammate, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Player {teammate.playerId.replace(/[rb]/, '')}</span>
                    <span className="text-zinc-300 font-medium">{teammate.strategy}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* FOV Screenshots */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400">Recent FOV Snapshots (last 10):</span>
                <span className="text-xs text-zinc-500">{knowledge.fovScreenshots.length}/10</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {knowledge.fovScreenshots.map((screenshot, idx) => (
                  <div key={idx} className="relative aspect-video rounded border border-zinc-600 overflow-hidden bg-zinc-900">
                    <img src={screenshot} alt={`FOV ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 right-0 bg-black/70 text-[8px] text-zinc-400 px-1">
                      {idx + 1}
                    </div>
                  </div>
                ))}
                {Array.from({ length: 10 - knowledge.fovScreenshots.length }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="aspect-video rounded border border-zinc-700 border-dashed bg-zinc-900/30 flex items-center justify-center">
                    <span className="text-[10px] text-zinc-600">—</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Game Knowledge */}
            <div className="border-t border-zinc-700 pt-3 mt-2">
              <h5 className="text-xs font-bold text-zinc-400 uppercase mb-2">📚 Game Knowledge</h5>

              {/* Role Descriptions */}
              <div className="bg-zinc-900/50 rounded p-2 mb-2">
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">Role Descriptions</span>
                <div className="space-y-1 text-[11px] text-zinc-400">
                  <div><span className="text-emerald-400 font-medium">GK:</span> {knowledge.roleDescriptions.GK}</div>
                  <div><span className="text-emerald-400 font-medium">FIELD:</span> {knowledge.roleDescriptions.FIELD}</div>
                </div>
              </div>

              {/* Strategy When */}
              <div className="bg-zinc-900/50 rounded p-2 mb-2">
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">Strategy Recommendations</span>
                <div className="space-y-1 text-[11px] text-zinc-400">
                  <div><span className="text-green-400 font-medium">Winning:</span> {knowledge.whenToUseStrategies.winning}</div>
                  <div><span className="text-red-400 font-medium">Losing:</span> {knowledge.whenToUseStrategies.losing}</div>
                  <div><span className="text-yellow-400 font-medium">Tied:</span> {knowledge.whenToUseStrategies.tied}</div>
                </div>
              </div>

              {/* Available Strategies */}
              <details className="bg-zinc-900/50 rounded p-2">
                <summary className="text-[10px] text-zinc-500 uppercase cursor-pointer hover:text-zinc-400">
                  Available Strategies (click to expand)
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="text-[10px] text-red-400 font-bold uppercase block mb-1">Offensive</span>
                    <ul className="space-y-0.5 text-[10px] text-zinc-400 pl-3">
                      {knowledge.strategyGuidelines.offensive.map((strat, idx) => (
                        <li key={idx}>• {strat}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-400 font-bold uppercase block mb-1">Defensive</span>
                    <ul className="space-y-0.5 text-[10px] text-zinc-400 pl-3">
                      {knowledge.strategyGuidelines.defensive.map((strat, idx) => (
                        <li key={idx}>• {strat}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-[10px] text-yellow-400 font-bold uppercase block mb-1">Balanced</span>
                    <ul className="space-y-0.5 text-[10px] text-zinc-400 pl-3">
                      {knowledge.strategyGuidelines.balanced.map((strat, idx) => (
                        <li key={idx}>• {strat}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPOV;
