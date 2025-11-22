'use client';

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import * as THREE from 'three';
import { getPlayerStrategy } from './StrategyPanel';

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

interface LockInfo {
  targetSector: number;
  timer: number;
}

interface Field3DProps {
  redTeam: Player[];
  blueTeam: Player[];
  ball: Ball;
  lockedPlayers: Map<string, LockInfo>;
  announcerMsg: string;
}

// Convert 2D coordinates to 3D
const to3D = (x: number, y: number, z: number = 0) => {
  return [
    (x - FIELD_WIDTH / 2) / 10,
    z,
    -(y - FIELD_HEIGHT / 2) / 10
  ] as [number, number, number];
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
      {/* Stadium walls/stands - all four sides with better materials and fans */}
      {/* Left stand */}
      <mesh position={[-60, 8, 0]} receiveShadow castShadow>
        <boxGeometry args={[4, 16, 80]} />
        <meshStandardMaterial color="#2d3748" roughness={0.7} metalness={0.2} emissive="#1a202c" emissiveIntensity={0.1} />
      </mesh>
      {generateFans([-58, 8, 0], 15, 80, 'horizontal')}

      {/* Right stand */}
      <mesh position={[60, 8, 0]} receiveShadow castShadow>
        <boxGeometry args={[4, 16, 80]} />
        <meshStandardMaterial color="#2d3748" roughness={0.7} metalness={0.2} emissive="#1a202c" emissiveIntensity={0.1} />
      </mesh>
      {generateFans([58, 8, 0], 15, 80, 'horizontal')}

      {/* Top stand */}
      <mesh position={[0, 8, -40]} receiveShadow castShadow>
        <boxGeometry args={[120, 16, 4]} />
        <meshStandardMaterial color="#2d3748" roughness={0.7} metalness={0.2} emissive="#1a202c" emissiveIntensity={0.1} />
      </mesh>
      {generateFans([0, 8, -38], 15, 100, 'vertical')}

      {/* Bottom stand */}
      <mesh position={[0, 8, 40]} receiveShadow castShadow>
        <boxGeometry args={[120, 16, 4]} />
        <meshStandardMaterial color="#2d3748" roughness={0.7} metalness={0.2} emissive="#1a202c" emissiveIntensity={0.1} />
      </mesh>
      {generateFans([0, 8, 38], 15, 100, 'vertical')}

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
          <pointLight position={[0, 3, 0]} intensity={500} distance={80} color="#fff8e1" castShadow />
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

      {/* Sky/background */}
      <mesh position={[0, 30, 0]}>
        <sphereGeometry args={[150, 32, 32]} />
        <meshBasicMaterial color="#87ceeb" side={THREE.BackSide} />
      </mesh>
    </group>
  );
};

// 3D Player Component
const Player3D = ({
  player,
  isRed,
  isLocked,
  ball,
  team,
  lockedPlayers
}: {
  player: Player;
  isRed: boolean;
  isLocked: boolean;
  ball: Ball;
  team: Player[];
  lockedPlayers: Map<string, LockInfo>;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [x, y, z] = to3D(player.x, player.y, 1.2);

  const color = isLocked ? '#f59e0b' : (isRed ? '#dc2626' : '#2563eb');

  // Get strategy icon
  const { icon } = getPlayerStrategy(player, isRed, ball, team, lockedPlayers);

  return (
    <group position={[x, y, z]}>
      {/* Body */}
      <mesh ref={meshRef} castShadow>
        <capsuleGeometry args={[0.4, 1.6, 8, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>

      {/* Jersey number */}
      <Text
        position={[0, 1.2, 0.42]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {player.id.replace(/[rb]/, '')}
      </Text>

      {/* Strategy Icon - Floating above */}
      <Text
        position={[0, 3.2, 0]}
        fontSize={0.6}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {icon}
      </Text>

      {/* Locked indicator */}
      {isLocked && (
        <mesh position={[0, 2.5, 0]}>
          <ringGeometry args={[0.3, 0.4, 16]} />
          <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

// 3D Ball Component
const Ball3D = ({ ball }: { ball: Ball }) => {
  const [x, y, z] = to3D(ball.x, ball.y, 0.4);

  return (
    <mesh position={[x, y, z]} castShadow>
      <sphereGeometry args={[0.4, 32, 32]} />
      <meshStandardMaterial
        color="#ffffff"
        roughness={0.2}
        metalness={0.1}
      />
    </mesh>
  );
};

// Field markings
const FieldMarkings = () => {
  return (
    <group position={[0, 0.02, 0]}>
      {/* Center line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.2, FIELD_HEIGHT / 10]} />
        <meshBasicMaterial color="#ffffff" opacity={0.9} transparent />
      </mesh>

      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6, 6.2, 64]} />
        <meshBasicMaterial color="#ffffff" opacity={0.9} transparent />
      </mesh>

      {/* Center spot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color="#ffffff" opacity={0.9} transparent />
      </mesh>

      {/* Penalty boxes - FIFA standard 16.5m x 40.32m */}
      {[-FIELD_WIDTH / 20, FIELD_WIDTH / 20].map((x, idx) => {
        const penaltyBoxDepth = 1.65; // 16.5m / 10 = 1.65 units
        const penaltyBoxWidth = 4.032; // 40.32m / 10 = 4.032 units
        const goalBoxDepth = 0.55; // 5.5m / 10 = 0.55 units
        const goalBoxWidth = 1.832; // 18.32m / 10 = 1.832 units
        const penaltySpotDistance = 1.1; // 11m / 10 = 1.1 units from goal line

        return (
          <group key={idx}>
            {/* Penalty box outline - corrected dimensions */}
            <lineSegments position={[idx === 0 ? x + penaltyBoxDepth / 2 : x - penaltyBoxDepth / 2, 0, 0]}>
              <edgesGeometry args={[new THREE.BoxGeometry(penaltyBoxDepth, 0, penaltyBoxWidth * 10)]} />
              <lineBasicMaterial color="#ffffff" linewidth={2} />
            </lineSegments>

            {/* Goal box (6-yard box) */}
            <lineSegments position={[idx === 0 ? x + goalBoxDepth / 2 : x - goalBoxDepth / 2, 0, 0]}>
              <edgesGeometry args={[new THREE.BoxGeometry(goalBoxDepth, 0, goalBoxWidth * 10)]} />
              <lineBasicMaterial color="#ffffff" linewidth={2} />
            </lineSegments>

            {/* Penalty spot - 11m from goal line */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[idx === 0 ? x + penaltySpotDistance : x - penaltySpotDistance, 0, 0]}>
              <circleGeometry args={[0.2, 32]} />
              <meshBasicMaterial color="#ffffff" opacity={0.9} transparent />
            </mesh>

            {/* Penalty arc - 9.15m radius from penalty spot */}
            <mesh
              rotation={[-Math.PI / 2, 0, idx === 0 ? 0 : Math.PI]}
              position={[idx === 0 ? x + penaltySpotDistance : x - penaltySpotDistance, 0, 0]}
            >
              <ringGeometry args={[0.915, 0.935, 64, 1, Math.PI * 0.37, Math.PI * 0.26]} />
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

// Goals
const Goal = ({ isLeft }: { isLeft: boolean }) => {
  const x = isLeft ? -FIELD_WIDTH / 20 : FIELD_WIDTH / 20;
  const goalHeight = (GOAL_BOTTOM - GOAL_TOP) / 10;

  return (
    <group position={[x, 2, 0]}>
      {/* Goal posts */}
      <mesh position={[0, 0, -goalHeight / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 4, 16]} />
        <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, goalHeight / 2]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 4, 16]} />
        <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Crossbar */}
      <mesh position={[0, 2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, goalHeight, 16]} />
        <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Net */}
      <mesh position={[isLeft ? -1 : 1, 1, 0]}>
        <boxGeometry args={[0.1, 4, goalHeight]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>
    </group>
  );
};

// Main Scene
const Scene = ({ redTeam, blueTeam, ball, lockedPlayers }: Field3DProps) => {
  return (
    <>
      {/* Lighting - Brighter and more vibrant */}
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[20, 50, 20]}
        intensity={1.8}
        color="#fff8e1"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
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

      {/* Field border/lines */}
      <lineSegments position={[0, 0.01, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(FIELD_WIDTH / 10, FIELD_HEIGHT / 10)]} />
        <lineBasicMaterial color="#ffffff" opacity={0.6} transparent linewidth={2} />
      </lineSegments>

      <FieldMarkings />
      <Goal isLeft={true} />
      <Goal isLeft={false} />

      {/* Players */}
      {redTeam.map(p => (
        <Player3D
          key={p.id}
          player={p}
          isRed={true}
          isLocked={lockedPlayers.has(p.id)}
          ball={ball}
          team={redTeam}
          lockedPlayers={lockedPlayers}
        />
      ))}
      {blueTeam.map(p => (
        <Player3D
          key={p.id}
          player={p}
          isRed={false}
          isLocked={false}
          ball={ball}
          team={blueTeam}
          lockedPlayers={lockedPlayers}
        />
      ))}

      {/* Ball */}
      <Ball3D ball={ball} />

      {/* Ground plane (darker) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
    </>
  );
};

// Main 3D Field Component
export const Field3D = (props: Field3DProps) => {
  return (
    <div
      className="relative rounded-lg overflow-hidden border-4 border-zinc-800 shadow-2xl mb-8"
      style={{ width: '100%', maxWidth: '700px', aspectRatio: '5/3' }}
    >
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[0, 40, 50]}
          fov={50}
        />
        <OrbitControls
          enablePan={false}
          minDistance={20}
          maxDistance={80}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 0, 0]}
        />
        <Scene {...props} />
      </Canvas>

      {/* Announcer message overlay */}
      {props.announcerMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-zinc-900/90 border border-white/10 px-6 py-2 rounded-full shadow-2xl">
            <h2 className="text-xl font-black italic text-white tracking-widest uppercase drop-shadow-md text-center">
              {props.announcerMsg}
            </h2>
          </div>
        </div>
      )}
    </div>
  );
};

export default Field3D;
