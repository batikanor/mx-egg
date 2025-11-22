'use client';

import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
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

// 3D Player Component
const Player3D = ({ player, isRed, isLocked }: { player: Player; isRed: boolean; isLocked: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [x, y, z] = to3D(player.x, player.y, 1.2);

  const color = isLocked ? '#f59e0b' : (isRed ? '#dc2626' : '#2563eb');

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
    <group>
      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[6, 6.2, 64]} />
        <meshBasicMaterial color="#ffffff" opacity={0.8} transparent />
      </mesh>

      {/* Center line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.2, FIELD_HEIGHT / 10]} />
        <meshBasicMaterial color="#ffffff" opacity={0.8} transparent />
      </mesh>

      {/* Penalty boxes */}
      {/* Left penalty box */}
      <lineSegments position={[-FIELD_WIDTH / 20, 0.01, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(13, 0, 26)]} />
        <lineBasicMaterial color="#ffffff" opacity={0.8} transparent linewidth={2} />
      </lineSegments>

      {/* Right penalty box */}
      <lineSegments position={[FIELD_WIDTH / 20, 0.01, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(13, 0, 26)]} />
        <lineBasicMaterial color="#ffffff" opacity={0.8} transparent linewidth={2} />
      </lineSegments>
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
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[20, 30, 20]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      <hemisphereLight intensity={0.3} groundColor="#555555" />

      {/* Field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FIELD_WIDTH / 10, FIELD_HEIGHT / 10]} />
        <meshStandardMaterial
          color="#10b981"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

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
        />
      ))}
      {blueTeam.map(p => (
        <Player3D
          key={p.id}
          player={p}
          isRed={false}
          isLocked={false}
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
