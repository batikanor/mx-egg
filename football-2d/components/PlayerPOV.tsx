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

interface PlayerPOVProps {
  player: Player;
  redTeam: Player[];
  blueTeam: Player[];
  ball: Ball;
  isRed: boolean;
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
  return (
    <group>
      {/* Stadium walls/stands - all four sides */}
      {/* Left stand */}
      <mesh position={[-60, 8, 0]} receiveShadow>
        <boxGeometry args={[4, 16, 80]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>
      {/* Right stand */}
      <mesh position={[60, 8, 0]} receiveShadow>
        <boxGeometry args={[4, 16, 80]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>
      {/* Top stand */}
      <mesh position={[0, 8, -40]} receiveShadow>
        <boxGeometry args={[120, 16, 4]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>
      {/* Bottom stand */}
      <mesh position={[0, 8, 40]} receiveShadow>
        <boxGeometry args={[120, 16, 4]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>

      {/* Floodlights */}
      {[
        [-55, 20, -35],
        [-55, 20, 35],
        [55, 20, -35],
        [55, 20, 35],
      ].map((pos, idx) => (
        <group key={idx} position={pos as [number, number, number]}>
          <mesh>
            <cylinderGeometry args={[0.3, 0.3, 12, 8]} />
            <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
          </mesh>
          <pointLight position={[0, 2, 0]} intensity={300} distance={60} color="#ffffff" />
        </group>
      ))}

      {/* Advertising boards around field */}
      {[-52, 52].map((x, idx) => (
        <mesh key={`ad-lr-${idx}`} position={[x, 1, 0]} rotation={[0, idx === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <planeGeometry args={[60, 2]} />
          <meshStandardMaterial color="#0066cc" roughness={0.6} />
        </mesh>
      ))}
      {[-32, 32].map((z, idx) => (
        <mesh key={`ad-tb-${idx}`} position={[0, 1, z]} rotation={[0, idx === 0 ? Math.PI : 0, 0]}>
          <planeGeometry args={[100, 2]} />
          <meshStandardMaterial color="#cc0000" roughness={0.6} />
        </mesh>
      ))}
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

      {/* Penalty boxes */}
      {[-FIELD_WIDTH / 20, FIELD_WIDTH / 20].map((x, idx) => (
        <group key={idx}>
          {/* Penalty box outline */}
          <lineSegments position={[x, 0, 0]}>
            <edgesGeometry args={[new THREE.BoxGeometry(13, 0, 26)]} />
            <lineBasicMaterial color="#ffffff" linewidth={2} />
          </lineSegments>
          {/* Goal box */}
          <lineSegments position={[x, 0, 0]}>
            <edgesGeometry args={[new THREE.BoxGeometry(5.5, 0, 11)]} />
            <lineBasicMaterial color="#ffffff" linewidth={2} />
          </lineSegments>
          {/* Penalty spot */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x + (idx === 0 ? 6.5 : -6.5), 0, 0]}>
            <circleGeometry args={[0.2, 32]} />
            <meshBasicMaterial color="#ffffff" opacity={0.9} transparent />
          </mesh>
          {/* Penalty arc */}
          <mesh rotation={[-Math.PI / 2, 0, idx === 0 ? 0 : Math.PI]} position={[x + (idx === 0 ? 6.5 : -6.5), 0, 0]}>
            <ringGeometry args={[9.15, 9.35, 32, 1, Math.PI * 0.37, Math.PI * 0.26]} />
            <meshBasicMaterial color="#ffffff" opacity={0.9} transparent />
          </mesh>
        </group>
      ))}

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
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[20, 40, 20]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <hemisphereLight intensity={0.4} groundColor="#0a3a2a" />

        {/* Stadium features */}
        <Stadium />

        {/* Field */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[FIELD_WIDTH / 10, FIELD_HEIGHT / 10]} />
          <meshStandardMaterial color="#10b981" roughness={0.8} metalness={0.1} />
        </mesh>

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

export const PlayerPOV = ({ player, redTeam, blueTeam, ball, isRed }: PlayerPOVProps) => {
  return (
    <div className="w-full bg-zinc-900/50 border-t-4 border-zinc-800 shadow-2xl p-4">
      <div className="max-w-6xl mx-auto">
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
      </div>
    </div>
  );
};

export default PlayerPOV;
