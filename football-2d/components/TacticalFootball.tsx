'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield,
  Swords,
  SlidersHorizontal,
  Play,
  Pause,
  FastForward,
  Box,
  SquareDashedBottom
} from 'lucide-react';
import dynamic from 'next/dynamic';
import StrategyPanel from './StrategyPanel';

const Field3D = dynamic(() => import('./Field3D'), { ssr: false });
const PlayerPOV = dynamic(() => import('./PlayerPOV'), { ssr: false });

// --- Constants ---
const FIELD_WIDTH = 1000;
const FIELD_HEIGHT = 600;
const GOAL_TOP = 240;
const GOAL_BOTTOM = 360;

const PLAYER_RADIUS = 12;
const BALL_RADIUS = 8;
const TEAM_SIZE = 4;

// Physics Base Values
const BASE_FRICTION = 0.94;
const DRIBBLE_POWER = 3.5;
const PASS_POWER = 7;
const SHOOT_POWER = 14;
const KICK_COOLDOWN = 15;
const TACTICAL_LOCK_DURATION = 300; // Increased duration slightly for better observation

// Game States
const STATE = {
  PLAYING: 'PLAYING',
  RESETTING: 'RESETTING'
};

const SECTORS = [
  { id: 0, x: 0, y: 0, label: 'Top-Left' },   { id: 1, x: 1, y: 0, label: 'Top-Mid' },   { id: 2, x: 2, y: 0, label: 'Top-Right' },
  { id: 3, x: 0, y: 1, label: 'Mid-Left' },   { id: 4, x: 1, y: 1, label: 'Center' },    { id: 5, x: 2, y: 1, label: 'Mid-Right' },
  { id: 6, x: 0, y: 2, label: 'Bot-Left' },   { id: 7, x: 1, y: 2, label: 'Bot-Mid' },   { id: 8, x: 2, y: 2, label: 'Bot-Right' },
];

const GAME_KNOWLEDGE = {
  roleDescriptions: {
    GK: 'Goalkeeper - Primary defender of your goal. Stay near your goal and block shots.',
    FIELD: 'Field Player - Offensive and defensive duties. Chase ball, pass, shoot, and support teammates.'
  },
  strategyGuidelines: {
    offensive: [
      '⚡ Ball Pressure - Aggressively chase and pressure the ball carrier',
      '🚀 Press Forward - Push toward opponent goal for scoring opportunities',
      '⚔️ Forward Support - Stay upfield to receive passes and create chances',
      '🎨 Playmaker - Position to create passing lanes and control tempo',
      '💨 Counter Attack - Quick transition from defense to attack',
      '🎪 Wing Play - Position wide to stretch opponent defense'
    ],
    defensive: [
      '🛡️ Defensive Cover - Stay between ball and your goal to protect',
      '🔒 Mark Player - Shadow and pressure specific opponent',
      '🏰 Hold Position - Maintain defensive shape and position',
      '🎯 Zone Lock - Control a specific area of the field'
    ],
    balanced: [
      '🔄 Box-to-Box - Dynamically move between attack and defense',
      '⚖️ Balanced - Adapt role based on game flow',
      '⏱️ Possession - Focus on keeping the ball and controlling pace'
    ]
  },
  whenToUseStrategies: {
    winning: 'When ahead: Use defensive strategies (🛡️ Defensive Cover, 🏰 Hold Position) to protect your lead. Maintain possession (⏱️).',
    losing: 'When behind: Use offensive strategies (🚀 Press Forward, ⚡ Ball Pressure, ⚔️ Forward Support) to create scoring chances.',
    tied: 'When tied: Use balanced strategies (🔄 Box-to-Box, ⚖️ Balanced) to adapt to game flow and exploit opportunities.'
  }
};

// --- Helper Functions ---

const isGoal = (x: number, y: number) => {
  if (y > GOAL_TOP && y < GOAL_BOTTOM) {
    if (x < 10) return 'RED';
    if (x > FIELD_WIDTH - 10) return 'BLUE';
  }
  return null;
};

const randRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Linear Interpolation for smooth resets
const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

// --- Types ---
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

interface PlayerKnowledge {
  playerId: string;
  team: 'red' | 'blue';
  currentScore: { red: number; blue: number };
  fovScreenshots: string[]; // Array of base64 image data URLs (last 10)

  // Strategic information
  myCurrentStrategy: string;
  teammateStrategies: { playerId: string; strategy: string }[];

  // Game context
  myGoalSide: 'left' | 'right'; // Which side is my goal
  opponentGoalSide: 'left' | 'right'; // Which side is opponent's goal
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

// --- Components ---

const MainField = ({ redTeam, blueTeam, ball, lockedPlayers, matchState, announcerMsg }: {
  redTeam: Player[];
  blueTeam: Player[];
  ball: Ball;
  lockedPlayers: Map<string, LockInfo>;
  matchState: string;
  announcerMsg: string;
}) => (
  <div
      className="relative bg-emerald-600 rounded-lg overflow-hidden border-4 border-zinc-800 shadow-2xl mb-8 select-none"
      style={{ width: '100%', maxWidth: '700px', aspectRatio: '5/3' }}
  >
      {/* Field Texture */}
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,transparent_49%,rgba(0,0,0,0.1)_50%)] bg-[length:100px_100%]" />

      {/* Lines */}
      <div className="absolute inset-8 border-2 border-white/40 rounded-sm" />
      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/40" />
      <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white/40 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white/60 rounded-full -translate-x-1/2 -translate-y-1/2" />

      {/* Penalty Areas */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 w-32 h-64 border-r-2 border-y-2 border-white/40" />
      <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-64 border-l-2 border-y-2 border-white/40" />

      {/* Goals */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-32 bg-zinc-200/50 border-r-2 border-white/80" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-32 bg-zinc-200/50 border-l-2 border-white/80" />

      {/* Entities */}
      {blueTeam.map(p => (
          <div key={p.id}
              className="absolute w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10"
              style={{ left: `${(p.x/FIELD_WIDTH)*100}%`, top: `${(p.y/FIELD_HEIGHT)*100}%`, transform: 'translate(-50%, -50%)' }}
          >
             <span className="text-[8px] text-white font-bold">{p.id.replace('b','')}</span>
          </div>
      ))}
      {redTeam.map(p => {
          const isLocked = lockedPlayers.has(p.id);
          return (
            <div key={p.id}
                className={`absolute w-5 h-5 rounded-full border-2 shadow-sm flex items-center justify-center z-10
                  ${isLocked ? 'bg-amber-500 border-amber-200' : 'bg-red-600 border-white'}`}
                style={{ left: `${(p.x/FIELD_WIDTH)*100}%`, top: `${(p.y/FIELD_HEIGHT)*100}%`, transform: 'translate(-50%, -50%)' }}
            >
              <span className="text-[8px] text-white font-bold">{p.id.replace('r','')}</span>
              {isLocked && <div className="absolute -top-3 w-2 h-2 border border-amber-400 rounded-full animate-ping" />}
            </div>
          );
      })}

      <div
          className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md z-20 border border-zinc-300"
          style={{ left: `${(ball.x/FIELD_WIDTH)*100}%`, top: `${(ball.y/FIELD_HEIGHT)*100}%`, transform: 'translate(-50%, -50%)' }}
      />

      {/* Announcer Banner (Subtle Top Bar) */}
      {announcerMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
           <div className="bg-zinc-900/90 border border-white/10 px-6 py-2 rounded-full shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">
              <h2 className="text-xl font-black italic text-white tracking-widest uppercase drop-shadow-md text-center flex items-center gap-2">
                {matchState === STATE.RESETTING && <FastForward size={16} className="animate-pulse text-emerald-400"/>}
                {announcerMsg}
              </h2>
           </div>
        </div>
      )}
  </div>
);

const SectorKey = React.memo(({ sector, onAssign, redTeam, blueTeam, ball, lockedPlayers }: {
  sector: { id: number; x: number; y: number; label: string };
  onAssign: (id: number) => void;
  redTeam: Player[];
  blueTeam: Player[];
  ball: Ball;
  lockedPlayers: Map<string, LockInfo>;
}) => {
  const [flash, setFlash] = useState(false);
  const handleClick = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    onAssign(sector.id);
  };
  const activeLocks = Array.from(lockedPlayers.values()).filter(l => l.targetSector === sector.id).length;

  return (
    <button
      onClick={handleClick}
      className={`
        relative w-full h-full overflow-hidden rounded-xl border-2 transition-all duration-150 group
        active:scale-95 cursor-pointer select-none
        ${flash ? 'border-amber-400 bg-amber-900/50' : activeLocks > 0 ? 'border-red-500/50 bg-zinc-800' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}
      `}
    >
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent)]" />
      <div className="absolute top-0 left-0 w-[300%] h-[300%] pointer-events-none" style={{ transform: `translate(-${sector.x * 33.33}%, -${sector.y * 33.33}%)` }}>
           {blueTeam.map(p => (
              <div key={p.id} className="absolute w-3 h-3 bg-blue-500 rounded-full shadow-sm transform -translate-x-1/2 -translate-y-1/2 opacity-60"
                  style={{ left: `${(p.x/FIELD_WIDTH)*100}%`, top: `${(p.y/FIELD_HEIGHT)*100}%` }} />
           ))}
           {redTeam.map(p => (
              <div key={p.id} className={`absolute w-3 h-3 rounded-full shadow-sm transform -translate-x-1/2 -translate-y-1/2 ring-1 ring-white/50 ${lockedPlayers.has(p.id) ? 'bg-amber-500 scale-125 z-10' : 'bg-red-500 opacity-60'}`}
                  style={{ left: `${(p.x/FIELD_WIDTH)*100}%`, top: `${(p.y/FIELD_HEIGHT)*100}%` }} />
           ))}
           <div className="absolute w-2 h-2 bg-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ left: `${(ball.x/FIELD_WIDTH)*100}%`, top: `${(ball.y/FIELD_HEIGHT)*100}%` }} />
      </div>
      <div className={`absolute bottom-1.5 right-2 text-[9px] font-black uppercase tracking-widest ${activeLocks > 0 ? 'text-amber-500' : 'text-zinc-600 group-hover:text-zinc-500'}`}>{sector.label}</div>
    </button>
  );
});

SectorKey.displayName = 'SectorKey';

export default function TacticalFootball() {
  const [renderBall, setRenderBall] = useState<Ball>({ x: FIELD_WIDTH/2, y: FIELD_HEIGHT/2, vx: 0, vy: 0 });
  const [renderRed, setRenderRed] = useState<Player[]>([]);
  const [renderBlue, setRenderBlue] = useState<Player[]>([]);

  const gameState = useRef({
    ball: { x: FIELD_WIDTH/2, y: FIELD_HEIGHT/2, vx: 0, vy: 0 },
    red: [] as Player[],
    blue: [] as Player[],
    matchState: STATE.PLAYING,
    resetTarget: null as any
  });

  const [lockedPlayersUI, setLockedPlayersUI] = useState(new Map<string, LockInfo>());
  const [announcerMsg, setAnnouncerMsg] = useState("");
  const [score, setScore] = useState({ red: 0, blue: 0 });
  const [simSpeed, setSimSpeed] = useState(0.6);
  const [isPaused, setIsPaused] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [playerKnowledge, setPlayerKnowledge] = useState<Map<string, PlayerKnowledge>>(new Map());
  const [backgroundCapturePlayer, setBackgroundCapturePlayer] = useState<string | null>(null);

  const kickCooldowns = useRef(new Map<string, number>());
  const lockedPlayersRef = useRef(new Map<string, LockInfo>());
  const msgTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reqRef = useRef<number | undefined>(undefined);
  const screenshotTimer = useRef<number | null>(null);
  const currentCaptureIndex = useRef<number>(0);

  useEffect(() => {
    resetMatch();
  }, []);

  const initTeamPositions = (isRed: boolean): Player[] => {
    return Array(TEAM_SIZE).fill(0).map((_, i) => ({
        id: isRed ? `r${i}` : `b${i}`,
        x: isRed ? FIELD_WIDTH * 0.75 + randRange(-30, 30) : FIELD_WIDTH * 0.25 + randRange(-30, 30),
        y: FIELD_HEIGHT * 0.5 + (i === 0 ? 0 : (i % 2 === 0 ? -80 : 80)),
        vx: 0, vy: 0,
        role: i === 0 ? 'GK' : 'FIELD'
    }));
  };

  const resetMatch = () => {
      const startAngle = Math.random() * Math.PI * 2;
      const startSpeed = randRange(2, 4);

      gameState.current.ball = {
          x: FIELD_WIDTH/2, y: FIELD_HEIGHT/2,
          vx: Math.cos(startAngle) * startSpeed, vy: Math.sin(startAngle) * startSpeed
      };
      gameState.current.red = initTeamPositions(true);
      gameState.current.blue = initTeamPositions(false);
      gameState.current.matchState = STATE.PLAYING;

      lockedPlayersRef.current.clear();
      setLockedPlayersUI(new Map());
      kickCooldowns.current.clear();

      // Initialize knowledge base for all players
      const newKnowledge = new Map<string, PlayerKnowledge>();
      const allPlayers = [...gameState.current.red, ...gameState.current.blue];

      allPlayers.forEach(player => {
        const isRed = player.id.startsWith('r');
        const team = isRed ? 'red' : 'blue';
        const teammates = allPlayers.filter(p => p.id !== player.id && p.id.startsWith(player.id[0]));

        newKnowledge.set(player.id, {
          playerId: player.id,
          team,
          currentScore: { red: 0, blue: 0 },
          fovScreenshots: [],

          // Strategic info
          myCurrentStrategy: player.role === 'GK' ? '🥅 Goalkeeper' : '⚖️ Balanced',
          teammateStrategies: teammates.map(t => ({
            playerId: t.id,
            strategy: t.role === 'GK' ? '🥅 Goalkeeper' : '⚖️ Balanced'
          })),

          // Game context
          myGoalSide: isRed ? 'left' : 'right',
          opponentGoalSide: isRed ? 'right' : 'left',
          myRole: player.role,

          // Game knowledge (shared by all players)
          roleDescriptions: GAME_KNOWLEDGE.roleDescriptions,
          strategyGuidelines: GAME_KNOWLEDGE.strategyGuidelines,
          whenToUseStrategies: GAME_KNOWLEDGE.whenToUseStrategies
        });
      });
      setPlayerKnowledge(newKnowledge);
  };

  // Helper to display messages without pausing
  const announce = (msg: string) => {
    setAnnouncerMsg(msg);
    if (msgTimeoutRef.current) clearTimeout(msgTimeoutRef.current);
    msgTimeoutRef.current = setTimeout(() => setAnnouncerMsg(""), 1500);
  };

  // Reset for Goals (Hard Reset)
  const triggerGoal = (team: string) => {
    const newScore = { ...score, [team.toLowerCase()]: score[team.toLowerCase() as 'red' | 'blue'] + 1 };
    setScore(newScore);

    // Update all players' knowledge with new score
    setPlayerKnowledge(prev => {
      const updated = new Map(prev);
      updated.forEach((knowledge, playerId) => {
        updated.set(playerId, {
          ...knowledge,
          currentScore: newScore
        });
      });
      return updated;
    });

    gameState.current.matchState = STATE.RESETTING;
    setAnnouncerMsg(`${team} GOAL!`);

    gameState.current.resetTarget = {
        ball: { x: FIELD_WIDTH/2, y: FIELD_HEIGHT/2 },
        red: initTeamPositions(true),
        blue: initTeamPositions(false),
        resetPlayers: true
    };

    lockedPlayersRef.current.clear();
    setLockedPlayersUI(new Map());
    kickCooldowns.current.clear();

    setTimeout(() => {
        if (gameState.current.matchState === STATE.RESETTING) {
            gameState.current.matchState = STATE.PLAYING;
            setAnnouncerMsg("");
        }
    }, 2000);
  };

  // Handling for Outs (Seamless Transition)
  const triggerOut = (msg: string, bx: number, by: number) => {
    announce(msg);
    // Instant transport ball to restart position
    gameState.current.ball.x = bx;
    gameState.current.ball.y = by;

    // Slight inward nudge to prevent immediate 'out' loop
    let nudgeX = 0;
    let nudgeY = 0;
    if (by < 50) nudgeY = 2; // From Top
    if (by > FIELD_HEIGHT - 50) nudgeY = -2; // From Bottom
    if (bx < 50) nudgeX = 2; // From Left
    if (bx > FIELD_WIDTH - 50) nudgeX = -2; // From Right

    gameState.current.ball.vx = nudgeX;
    gameState.current.ball.vy = nudgeY;

    // Don't reset players, just clear cooldowns so they can interact immediately
    kickCooldowns.current.clear();
  };

  const assignPlayerToSector = useCallback((sectorId: number) => {
    const { red, ball } = gameState.current;
    let chaserId: string | null = null;
    let minDist = Infinity;
    red.forEach(p => {
        if (p.role !== 'GK') {
             const d = Math.hypot(ball.x - p.x, ball.y - p.y);
             if (d < minDist) { minDist = d; chaserId = p.id; }
        }
    });

    // We don't need to calculate a random target anymore
    // We just find the best candidate and lock them to the sector ID
    let candidateId: string | null = null;
    let minSecDist = Infinity;

    // Find candidate closest to sector center
    const sectorW = FIELD_WIDTH / 3;
    const sectorH = FIELD_HEIGHT / 3;
    const col = sectorId % 3;
    const row = Math.floor(sectorId / 3);
    const cx = (col * sectorW) + (sectorW / 2);
    const cy = (row * sectorH) + (sectorH / 2);

    red.forEach(p => {
        if (p.id !== chaserId && p.role !== 'GK' && !lockedPlayersRef.current.has(p.id)) {
            const d = Math.hypot(cx - p.x, cy - p.y);
            if (d < minSecDist) { minSecDist = d; candidateId = p.id; }
        }
    });

    if (candidateId) {
        lockedPlayersRef.current.set(candidateId, {
            targetSector: sectorId,
            timer: TACTICAL_LOCK_DURATION
        });
        setLockedPlayersUI(new Map(lockedPlayersRef.current));
    }
  }, []);

  const update = useCallback(() => {
    if (isPaused) { reqRef.current = requestAnimationFrame(update); return; }

    const state = gameState.current;

    // -- GOAL RESET SEQUENCE (ANIMATED) --
    if (state.matchState === STATE.RESETTING) {
        const alpha = 0.1;
        state.ball.x = lerp(state.ball.x, state.resetTarget.ball.x, alpha);
        state.ball.y = lerp(state.ball.y, state.resetTarget.ball.y, alpha);
        state.ball.vx = 0;
        state.ball.vy = 0;

        ['red', 'blue'].forEach((team: string) => {
            state[team as 'red' | 'blue'].forEach((p: Player, i: number) => {
                if (state.resetTarget.resetPlayers) {
                    p.x = lerp(p.x, state.resetTarget[team][i].x, alpha);
                    p.y = lerp(p.y, state.resetTarget[team][i].y, alpha);
                }
                p.vx = 0;
                p.vy = 0;
            });
        });

        setRenderBall({...state.ball});
        setRenderRed([...state.red]);
        setRenderBlue([...state.blue]);
        reqRef.current = requestAnimationFrame(update);
        return;
    }

    // -- NORMAL PLAY --
    const dt = simSpeed;
    let b = state.ball;
    let nextX = b.x + b.vx * dt;
    let nextY = b.y + b.vy * dt;
    let frictionFactor = Math.pow(BASE_FRICTION, dt);
    let nextVx = b.vx * frictionFactor;
    let nextVy = b.vy * frictionFactor;

    // Bounds Check (REMOVED EARLY RETURNS TO FIX FREEZE)
    if (nextX < 0) {
        if (isGoal(nextX, nextY)) { triggerGoal('RED'); }
        else { triggerOut('CORNER', 20, nextY < FIELD_HEIGHT/2 ? 20 : FIELD_HEIGHT-20); }
    }
    else if (nextX > FIELD_WIDTH) {
        if (isGoal(nextX, nextY)) { triggerGoal('BLUE'); }
        else { triggerOut('GOAL KICK', FIELD_WIDTH-50, FIELD_HEIGHT/2); }
    }
    else if (nextY < 0) {
        triggerOut('THROW IN', b.x, 20);
    }
    else if (nextY > FIELD_HEIGHT) {
        triggerOut('THROW IN', b.x, FIELD_HEIGHT-20);
    }
    else {
        // Apply movement only if safe
        b.x = nextX; b.y = nextY; b.vx = nextVx; b.vy = nextVy;
    }

    const processTeam = (team: Player[], isRed: boolean, opponents: Player[]) => {
       kickCooldowns.current.forEach((val, key) => {
          if (key.startsWith(isRed ? 'r' : 'b')) {
             if (val > 0) kickCooldowns.current.set(key, val - dt);
             else kickCooldowns.current.delete(key);
          }
       });

       let chaserId: string | null = null;
       let minDist = Infinity;
       team.forEach(p => {
         if (p.role !== 'GK') {
           const d = Math.hypot(b.x - p.x, b.y - p.y);
           if (d < minDist) { minDist = d; chaserId = p.id; }
         }
       });

       team.forEach((p) => {
          let tx = p.x, ty = p.y;
          let accel = 0.5;

          if (p.role === 'GK') {
             tx = isRed ? FIELD_WIDTH - 40 : 40;
             ty = Math.max(GOAL_TOP, Math.min(GOAL_BOTTOM, b.y));
             accel = 0.4;
          } else {
             // --- TACTICAL OVERRIDE (RED ONLY) ---
             if (isRed && lockedPlayersRef.current.has(p.id)) {
                 const lock = lockedPlayersRef.current.get(p.id)!;

                 // -- DYNAMIC POSITIONING WITHIN SECTOR --
                 const sectorId = lock.targetSector;
                 const sectorW = FIELD_WIDTH / 3;
                 const sectorH = FIELD_HEIGHT / 3;
                 const col = sectorId % 3;
                 const row = Math.floor(sectorId / 3);

                 // Bounds of the sector
                 const minX = col * sectorW + 10; // +10 Padding
                 const maxX = (col + 1) * sectorW - 10;
                 const minY = row * sectorH + 10;
                 const maxY = (row + 1) * sectorH - 10;

                 // Default Dynamic Logic: Follow Ball projected into this sector
                 // If ball is inside sector -> Go to ball
                 // If ball is outside -> Go to edge closest to ball
                 // If guarding -> Bias towards goal side of sector

                 // 1. Start with ball position
                 let idealX = b.x;
                 let idealY = b.y;

                 // 2. Goal Defense Bias (Stay between ball and our goal if defending)
                 if (b.x > p.x) { // Ball is ahead (we are behind)
                     idealX -= 50; // Stand slightly behind ball line
                 }

                 // 3. Clamp strict to sector
                 tx = Math.max(minX, Math.min(maxX, idealX));
                 ty = Math.max(minY, Math.min(maxY, idealY));

                 // 4. Update Timer
                 lock.timer -= dt;
                 if (lock.timer <= 0) {
                     lockedPlayersRef.current.delete(p.id);
                     if (lockedPlayersRef.current.size === 0) setLockedPlayersUI(new Map());
                 }
                 accel = 0.8; // Active tactical movement
             }
             else if (p.id === chaserId) {
                 tx = b.x; ty = b.y;
                 accel = 0.8;
             }
             else {
                 const dir = isRed ? -1 : 1;
                 const roleIdx = parseInt(p.id.replace(/[rb]/, ''));
                 if (roleIdx === 1) { tx = b.x - (200 * dir); ty = b.y + 40; }
                 else if (roleIdx === 2) { tx = b.x - (50 * dir); ty = b.y - 60; }
                 else { tx = b.x + (100 * dir); ty = b.y + 20; }
                 tx = Math.max(80, Math.min(FIELD_WIDTH-80, tx));
                 ty = Math.max(80, Math.min(FIELD_HEIGHT-80, ty));
             }
          }

          const dx = tx - p.x;
          const dy = ty - p.y;
          const angle = Math.atan2(dy, dx);

          let frictionFactor = Math.pow(BASE_FRICTION, dt);
          p.vx = p.vx * frictionFactor + Math.cos(angle) * accel * dt;
          p.vy = p.vy * frictionFactor + Math.sin(angle) * accel * dt;

          [...team, ...opponents].forEach(other => {
              if (other.id !== p.id) {
                  const d = Math.hypot(p.x - other.x, p.y - other.y);
                  if (d < PLAYER_RADIUS * 2.2) {
                      const pushAng = Math.atan2(p.y - other.y, p.x - other.x);
                      const force = (PLAYER_RADIUS*2.5 - d) * 0.15 * dt;
                      p.vx += Math.cos(pushAng) * force;
                      p.vy += Math.sin(pushAng) * force;
                  }
              }
          });

          p.x += p.vx * dt;
          p.y += p.vy * dt;

          const dBall = Math.hypot(b.x - p.x, b.y - p.y);
          if (dBall < PLAYER_RADIUS + BALL_RADIUS) {
              if (!kickCooldowns.current.has(p.id)) {
                  let kickAng = Math.atan2(b.y - p.y, b.x - p.x);
                  const goalX = isRed ? 0 : FIELD_WIDTH;
                  const distToGoal = Math.abs(p.x - goalX);
                  const isFacingGoal = isRed ? (Math.abs(kickAng) > Math.PI/2) : (Math.abs(kickAng) < Math.PI/2);
                  let power = DRIBBLE_POWER;
                  if (distToGoal < 300 && isFacingGoal) power = SHOOT_POWER;
                  else if (isFacingGoal) power = PASS_POWER;

                  if (b.y < 80 && Math.sin(kickAng) < 0) { kickAng += 0.6; power=DRIBBLE_POWER; }
                  if (b.y > FIELD_HEIGHT - 80 && Math.sin(kickAng) > 0) { kickAng -= 0.6; power=DRIBBLE_POWER; }

                  b.vx += Math.cos(kickAng) * power;
                  b.vy += Math.sin(kickAng) * power;
                  kickCooldowns.current.set(p.id, KICK_COOLDOWN);
              }
          }
       });
    };

    processTeam(state.red, true, state.blue);
    processTeam(state.blue, false, state.red);

    setRenderBall({...b});
    setRenderRed([...state.red]);
    setRenderBlue([...state.blue]);
    if (lockedPlayersRef.current.size !== lockedPlayersUI.size) {
        setLockedPlayersUI(new Map(lockedPlayersRef.current));
    }

    reqRef.current = requestAnimationFrame(update);
  }, [simSpeed, lockedPlayersUI.size, isPaused]);

  useEffect(() => {
    reqRef.current = requestAnimationFrame(update);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [update]);

  // Handle canvas ready for background capture
  const handleBackgroundCanvasReady = useCallback((playerId: string, canvas: HTMLCanvasElement) => {
    // Give the canvas a moment to render before capturing
    setTimeout(() => {
      try {
        const screenshot = canvas.toDataURL('image/jpeg', 0.7);

        // Check if it's not a blank canvas (all black/white)
        if (screenshot && screenshot.length > 1000) {
          setPlayerKnowledge(prev => {
            const updated = new Map(prev);
            const knowledge = updated.get(playerId);
            if (knowledge) {
              const newScreenshots = [...knowledge.fovScreenshots, screenshot];
              // Keep only last 10
              if (newScreenshots.length > 10) {
                newScreenshots.shift();
              }
              updated.set(playerId, {
                ...knowledge,
                fovScreenshots: newScreenshots
              });
            }
            return updated;
          });
        }
      } catch (error) {
        console.error(`Failed to capture screenshot for ${playerId}:`, error);
      }
    }, 100); // Wait 100ms for canvas to render
  }, []);

  // Rotate through all players for background POV capture
  useEffect(() => {
    const allPlayerIds = [...renderRed, ...renderBlue].map(p => p.id);

    if (allPlayerIds.length === 0) return;

    // Start the rotation timer
    if (screenshotTimer.current) {
      clearInterval(screenshotTimer.current);
    }

    screenshotTimer.current = setInterval(() => {
      // Rotate to next player (each player gets captured once per cycle)
      currentCaptureIndex.current = (currentCaptureIndex.current + 1) % allPlayerIds.length;
      setBackgroundCapturePlayer(allPlayerIds[currentCaptureIndex.current]);
    }, 1000 / allPlayerIds.length) as unknown as number; // Divide second by number of players for smooth rotation

    return () => {
      if (screenshotTimer.current) {
        clearInterval(screenshotTimer.current);
        screenshotTimer.current = null;
      }
    };
  }, [renderRed.length, renderBlue.length]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center py-8 px-4 font-sans text-zinc-300">
      {/* Header */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-6 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-4 w-1/3">
            <div className="w-12 h-12 bg-red-900/50 rounded-xl border border-red-700 flex items-center justify-center"><Swords className="text-red-400" size={24} /></div>
            <div className="flex flex-col"><span className="text-[10px] text-red-400 font-bold tracking-widest uppercase">Player FC</span><span className="text-3xl font-black text-white leading-none">{score.red}</span></div>
        </div>
        <div className="flex flex-col items-center w-1/3">
            <div className="bg-black/40 px-4 py-1 rounded-full border border-white/10 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${gameState.current.matchState === STATE.PLAYING ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{gameState.current.matchState === STATE.PLAYING ? 'Live' : 'Stoppage'}</span>
            </div>
        </div>
        <div className="flex items-center gap-4 w-1/3 justify-end">
            <div className="flex flex-col items-end"><span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Cpu United</span><span className="text-3xl font-black text-white leading-none">{score.blue}</span></div>
            <div className="w-12 h-12 bg-blue-900/50 rounded-xl border border-blue-700 flex items-center justify-center"><Shield className="text-blue-400" size={24} /></div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-3xl flex items-center justify-end gap-4 mb-2 pr-2">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
              <SlidersHorizontal size={14} className="text-zinc-500" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Speed: {simSpeed.toFixed(1)}x</span>
              <input type="range" min="0.1" max="1.5" step="0.1" value={simSpeed} onChange={(e) => setSimSpeed(parseFloat(e.target.value))} className="w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
          </div>
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className={`p-1.5 rounded-md transition-all ${is3DMode ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'}`}
            title={is3DMode ? "Switch to 2D View" : "Switch to 3D View"}
          >
            {is3DMode ? <Box size={16} /> : <SquareDashedBottom size={16} />}
          </button>
          <button onClick={() => setIsPaused(!isPaused)} className="p-1.5 bg-zinc-800 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
            {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
          </button>
      </div>

      {is3DMode ? (
        <Field3D redTeam={renderRed} blueTeam={renderBlue} ball={renderBall} lockedPlayers={lockedPlayersUI} announcerMsg={announcerMsg} />
      ) : (
        <MainField redTeam={renderRed} blueTeam={renderBlue} ball={renderBall} lockedPlayers={lockedPlayersUI} matchState={gameState.current.matchState} announcerMsg={announcerMsg} />
      )}

      <div className="flex flex-col items-center gap-4">
        <div className="text-center space-y-1">
            <h2 className="text-xs font-bold text-zinc-500 tracking-[0.2em] uppercase">Tactical Command Unit</h2>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-zinc-700 to-transparent mx-auto" />
        </div>
        <div className="relative p-6 bg-[#18181b] rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] border border-zinc-800/80">
            <div className="absolute inset-0 rounded-[2.5rem] shadow-[inset_0_2px_4px_rgba(255,255,255,0.08)] pointer-events-none" />
            <div className="grid grid-cols-3 gap-4 w-72 h-60">
                {SECTORS.map(sector => (
                    <SectorKey key={sector.id} sector={sector} onAssign={assignPlayerToSector} redTeam={renderRed} blueTeam={renderBlue} ball={renderBall} lockedPlayers={lockedPlayersUI} />
                ))}
            </div>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-1 h-8 bg-zinc-800" />
        </div>
      </div>

      <div className="my-12" />

      <StrategyPanel
        redTeam={renderRed}
        blueTeam={renderBlue}
        ball={renderBall}
        lockedPlayers={lockedPlayersUI}
        onPlayerClick={setSelectedPlayer}
        selectedPlayer={selectedPlayer}
      />

      {/* Background POV Capture (visually hidden but still rendered) */}
      {backgroundCapturePlayer && (() => {
        const allPlayers = [...renderRed, ...renderBlue];
        const player = allPlayers.find(p => p.id === backgroundCapturePlayer);
        const isRed = backgroundCapturePlayer.startsWith('r');
        const knowledge = playerKnowledge.get(backgroundCapturePlayer);
        return player && knowledge ? (
          <div style={{ position: 'absolute', left: '-9999px', width: '320px', height: '180px', pointerEvents: 'none' }}>
            <PlayerPOV
              player={player}
              redTeam={renderRed}
              blueTeam={renderBlue}
              ball={renderBall}
              isRed={isRed}
              knowledge={knowledge}
              onCanvasReady={handleBackgroundCanvasReady}
            />
          </div>
        ) : null;
      })()}

      {/* Player First-Person POV (visible) */}
      {selectedPlayer && (() => {
        const allPlayers = [...renderRed, ...renderBlue];
        const player = allPlayers.find(p => p.id === selectedPlayer);
        const isRed = selectedPlayer.startsWith('r');
        const knowledge = playerKnowledge.get(selectedPlayer);
        return player && knowledge ? (
          <PlayerPOV
            player={player}
            redTeam={renderRed}
            blueTeam={renderBlue}
            ball={renderBall}
            isRed={isRed}
            knowledge={knowledge}
          />
        ) : null;
      })()}
    </div>
  );
}
