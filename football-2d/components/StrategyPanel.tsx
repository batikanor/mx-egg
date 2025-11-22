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
  onPlayerClick: (playerId: string) => void;
  selectedPlayer: string | null;
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

export const getPlayerStrategy = (
  player: Player,
  isRed: boolean,
  ball: Ball,
  team: Player[],
  lockedPlayers: Map<string, LockInfo>
): { current: string; possible: string[]; icon: string } => {
  const possible = [];

  if (player.role === 'GK') {
    return {
      current: '🥅 Goalkeeper',
      possible: ['🥅 Goalkeeper (fixed role)'],
      icon: '🥅',
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
  let icon = '';
  if (isRed && lock) {
    const sector = SECTORS.find((s) => s.id === lock.targetSector);
    current = `🎯 Zone Lock: ${sector?.label || 'Unknown'}`;
    icon = '🎯';
  } else if (isChaser) {
    current = '⚡ Ball Pressure';
    icon = '⚡';
  } else {
    // Determine support role based on position
    const playerIdx = parseInt(player.id.replace(/[rb]/, ''));
    if (playerIdx === 1) {
      current = '🛡️ Defensive Cover';
      icon = '🛡️';
    } else if (playerIdx === 2) {
      current = '🔄 Box-to-Box';
      icon = '🔄';
    } else {
      current = '⚔️ Forward Support';
      icon = '⚔️';
    }
  }

  // Possible strategies
  if (isRed) {
    // Offensive Strategies
    possible.push('⚡ Ball Pressure - Chase the ball');
    possible.push('🚀 Press Forward - Attack aggressively');
    possible.push('🎨 Playmaker - Create chances');
    possible.push('⚔️ Forward Support - Stay upfield');

    // Defensive Strategies
    possible.push('🛡️ Defensive Cover - Protect goal');
    possible.push('🔒 Mark Player - Shadow opponent');
    possible.push('🏰 Hold Position - Stay in place');

    // Balanced Strategies
    possible.push('🔄 Box-to-Box - Dynamic movement');
    possible.push('⚖️ Balanced - Adapt to play');

    // Zone Strategies
    SECTORS.forEach((s) => {
      possible.push(`🎯 Zone Lock: ${s.label}`);
    });

    // Special Strategies
    possible.push('💨 Counter Attack - Quick breaks');
    possible.push('🎪 Wing Play - Wide positioning');
    possible.push('⏱️ Possession - Keep the ball');
  } else {
    possible.push('⚡ Ball Pressure (AI)');
    possible.push('🛡️ Defensive Cover (AI)');
    possible.push('🔄 Box-to-Box (AI)');
    possible.push('⚔️ Forward Support (AI)');
    possible.push('🚀 Press Forward (AI)');
    possible.push('🤖 Adaptive AI - Auto-adjust');
  }

  return { current, possible, icon };
};

export const StrategyPanel: React.FC<StrategyPanelProps> = ({
  redTeam,
  blueTeam,
  ball,
  lockedPlayers,
  onPlayerClick,
  selectedPlayer,
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
            const { current, possible, icon } = getPlayerStrategy(
              player,
              true,
              ball,
              redTeam,
              lockedPlayers
            );
            const isSelected = selectedPlayer === player.id;
            return (
              <div
                key={player.id}
                className={`bg-zinc-800/50 border rounded-lg p-3 transition-all cursor-pointer hover:border-red-500 ${
                  isSelected ? 'border-red-500 ring-2 ring-red-500/50' : 'border-zinc-700'
                }`}
                onClick={() => onPlayerClick(player.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white relative">
                      {player.id.replace('r', '')}
                      <span className="absolute -top-1 -right-1 text-xs">{icon}</span>
                    </div>
                    <span className={`text-xs font-semibold ${isSelected ? 'text-red-400' : 'text-zinc-300'}`}>
                      Player {player.id.replace('r', '')}
                      {isSelected && ' 📷'}
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
            const { current, possible, icon } = getPlayerStrategy(
              player,
              false,
              ball,
              blueTeam,
              lockedPlayers
            );
            const isSelected = selectedPlayer === player.id;
            return (
              <div
                key={player.id}
                className={`bg-zinc-800/50 border rounded-lg p-3 transition-all cursor-pointer hover:border-blue-500 ${
                  isSelected ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-zinc-700'
                }`}
                onClick={() => onPlayerClick(player.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white relative">
                      {player.id.replace('b', '')}
                      <span className="absolute -top-1 -right-1 text-xs">{icon}</span>
                    </div>
                    <span className={`text-xs font-semibold ${isSelected ? 'text-blue-400' : 'text-zinc-300'}`}>
                      Player {player.id.replace('b', '')}
                      {isSelected && ' 📷'}
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
