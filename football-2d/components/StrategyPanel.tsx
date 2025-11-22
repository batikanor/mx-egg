'use client';

import React from 'react';

interface Player {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  role: 'GK' | 'FIELD';
}

interface LockInfo {
  targetSector: number;
  timer: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface StrategyPanelProps {
  redTeam: Player[];
  blueTeam: Player[];
  ball: Ball;
  lockedPlayers: Map<string, LockInfo>;
}

const SECTORS = [
  { id: 0, label: 'Top-Left' },
  { id: 1, label: 'Top-Mid' },
  { id: 2, label: 'Top-Right' },
  { id: 3, label: 'Mid-Left' },
  { id: 4, label: 'Center' },
  { id: 5, label: 'Mid-Right' },
  { id: 6, label: 'Bot-Left' },
  { id: 7, label: 'Bot-Mid' },
  { id: 8, label: 'Bot-Right' },
];

const getPlayerStrategy = (
  player: Player,
  isRed: boolean,
  ball: Ball,
  team: Player[],
  lockedPlayers: Map<string, LockInfo>
): { current: string; possible: string[] } => {
  const possible = [];

  if (player.role === 'GK') {
    return {
      current: '🥅 Goalkeeper',
      possible: ['Goalkeeper (fixed role)'],
    };
  }

  // Check if chaser
  let chaserId: string | null = null;
  let minDist = Infinity;
  team.forEach((p) => {
    if (p.role !== 'GK') {
      const d = Math.hypot(ball.x - p.x, ball.y - p.y);
      if (d < minDist) {
        minDist = d;
        chaserId = p.id;
      }
    }
  });

  const isChaser = player.id === chaserId;
  const lock = lockedPlayers.get(player.id);

  // Current strategy
  let current = '';
  if (isRed && lock) {
    const sector = SECTORS.find((s) => s.id === lock.targetSector);
    current = `🎯 Locked: ${sector?.label || 'Unknown'}`;
  } else if (isChaser) {
    current = '⚡ Chasing Ball';
  } else {
    current = '🛡️ Supporting';
  }

  // Possible strategies
  if (isRed) {
    possible.push('⚡ Ball Chaser (auto)');
    possible.push('🛡️ Support Role (auto)');
    SECTORS.forEach((s) => {
      possible.push(`🎯 Lock to ${s.label}`);
    });
  } else {
    possible.push('⚡ Ball Chaser (AI)');
    possible.push('🛡️ Support Role (AI)');
    possible.push('🤖 AI Controlled');
  }

  return { current, possible };
};

export const StrategyPanel: React.FC<StrategyPanelProps> = ({
  redTeam,
  blueTeam,
  ball,
  lockedPlayers,
}) => {
  return (
    <div className="w-full max-w-6xl grid grid-cols-2 gap-6 mt-8">
      {/* Red Team (Left) */}
      <div className="bg-zinc-900/50 border border-red-900/50 rounded-xl p-4">
        <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-red-600 rounded-full"></span>
          Player FC Strategies
        </h3>
        <div className="space-y-3">
          {redTeam.map((player) => {
            const { current, possible } = getPlayerStrategy(
              player,
              true,
              ball,
              redTeam,
              lockedPlayers
            );
            return (
              <div
                key={player.id}
                className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                      {player.id.replace('r', '')}
                    </div>
                    <span className="text-xs font-semibold text-zinc-300">
                      Player {player.id.replace('r', '')}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-red-400">
                    {current}
                  </span>
                </div>
                <details className="text-[10px] text-zinc-500">
                  <summary className="cursor-pointer hover:text-zinc-400 transition-colors">
                    Available Strategies ({possible.length})
                  </summary>
                  <ul className="mt-2 ml-4 space-y-1">
                    {possible.map((strat, idx) => (
                      <li key={idx} className="text-zinc-400">
                        • {strat}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            );
          })}
        </div>
      </div>

      {/* Blue Team (Right) */}
      <div className="bg-zinc-900/50 border border-blue-900/50 rounded-xl p-4">
        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
          CPU United Strategies
        </h3>
        <div className="space-y-3">
          {blueTeam.map((player) => {
            const { current, possible } = getPlayerStrategy(
              player,
              false,
              ball,
              blueTeam,
              lockedPlayers
            );
            return (
              <div
                key={player.id}
                className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                      {player.id.replace('b', '')}
                    </div>
                    <span className="text-xs font-semibold text-zinc-300">
                      Player {player.id.replace('b', '')}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-blue-400">
                    {current}
                  </span>
                </div>
                <details className="text-[10px] text-zinc-500">
                  <summary className="cursor-pointer hover:text-zinc-400 transition-colors">
                    AI Behavior Modes ({possible.length})
                  </summary>
                  <ul className="mt-2 ml-4 space-y-1">
                    {possible.map((strat, idx) => (
                      <li key={idx} className="text-zinc-400">
                        • {strat}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StrategyPanel;
