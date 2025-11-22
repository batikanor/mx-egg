// Trajectory Prediction Utility for Football Game AI
// Predicts ball and player movement paths for strategic decision making

// Constants from game physics
const BASE_FRICTION = 0.94;
const FIELD_WIDTH = 1000;
const FIELD_HEIGHT = 600;

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  t: number; // Time in seconds
  velocity: { vx: number; vy: number };
}

export interface BallTrajectory {
  currentPosition: Position;
  predictedPath: TrajectoryPoint[];
  landingPosition: Position | null; // Where ball will stop
  timeToStop: number; // Seconds until ball stops
  willExitField: boolean;
}

export interface PlayerTrajectory {
  playerId: string;
  currentPosition: Position;
  predictedPath: TrajectoryPoint[];
  canInterceptBall: boolean;
  interceptPoint: Position | null;
  timeToIntercept: number | null;
}

export interface InterceptionAnalysis {
  isPossible: boolean;
  interceptPoint: Position | null;
  timeToReach: number | null;
  requiredSpeed: number | null;
  confidence: number; // 0-1
}

/**
 * Predicts ball trajectory considering friction
 */
export function predictBallTrajectory(
  ballX: number,
  ballY: number,
  ballVx: number,
  ballVy: number,
  predictionTime: number = 3.0, // seconds
  timeStep: number = 0.1 // seconds
): BallTrajectory {
  const path: TrajectoryPoint[] = [];

  let x = ballX;
  let y = ballY;
  let vx = ballVx;
  let vy = ballVy;
  let t = 0;

  // Simulate forward in time
  while (t < predictionTime) {
    // Apply friction
    vx *= BASE_FRICTION;
    vy *= BASE_FRICTION;

    // Update position
    x += vx;
    y += vy;

    // Bounce off walls
    if (x < 0 || x > FIELD_WIDTH) {
      vx *= -0.8; // Energy loss on bounce
      x = Math.max(0, Math.min(FIELD_WIDTH, x));
    }
    if (y < 0 || y > FIELD_HEIGHT) {
      vy *= -0.8;
      y = Math.max(0, Math.min(FIELD_HEIGHT, y));
    }

    // Record position
    path.push({
      x,
      y,
      t: t + timeStep,
      velocity: { vx, vy }
    });

    t += timeStep;

    // Stop if ball has basically stopped moving
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed < 0.5) {
      break;
    }
  }

  const lastPoint = path[path.length - 1] || { x: ballX, y: ballY, t: 0 };
  const willExitField = x < 0 || x > FIELD_WIDTH || y < 0 || y > FIELD_HEIGHT;

  return {
    currentPosition: { x: ballX, y: ballY },
    predictedPath: path,
    landingPosition: { x: lastPoint.x, y: lastPoint.y },
    timeToStop: lastPoint.t,
    willExitField
  };
}

/**
 * Predicts player movement assuming constant velocity
 */
export function predictPlayerTrajectory(
  playerX: number,
  playerY: number,
  playerVx: number,
  playerVy: number,
  predictionTime: number = 2.0,
  timeStep: number = 0.1
): TrajectoryPoint[] {
  const path: TrajectoryPoint[] = [];

  let x = playerX;
  let y = playerY;
  let t = 0;

  while (t < predictionTime) {
    // Assume relatively constant velocity (players can change direction)
    // Apply slight friction
    const vx = playerVx * Math.pow(0.98, t / timeStep);
    const vy = playerVy * Math.pow(0.98, t / timeStep);

    x += vx;
    y += vy;

    // Keep in bounds
    x = Math.max(0, Math.min(FIELD_WIDTH, x));
    y = Math.max(0, Math.min(FIELD_HEIGHT, y));

    path.push({
      x,
      y,
      t: t + timeStep,
      velocity: { vx, vy }
    });

    t += timeStep;
  }

  return path;
}

/**
 * Analyzes if a player can intercept the ball
 */
export function analyzeInterception(
  playerX: number,
  playerY: number,
  playerMaxSpeed: number,
  ballTrajectory: BallTrajectory
): InterceptionAnalysis {
  const INTERCEPT_RADIUS = 15; // Player can intercept within this radius

  // Check each point in ball's trajectory
  for (const point of ballTrajectory.predictedPath) {
    const distance = Math.sqrt(
      Math.pow(point.x - playerX, 2) + Math.pow(point.y - playerY, 2)
    );

    const timeAvailable = point.t;
    const requiredSpeed = distance / timeAvailable;

    // Can player reach this point in time?
    if (requiredSpeed <= playerMaxSpeed && distance > INTERCEPT_RADIUS) {
      const confidence = Math.max(0, 1 - requiredSpeed / playerMaxSpeed);

      return {
        isPossible: true,
        interceptPoint: { x: point.x, y: point.y },
        timeToReach: timeAvailable,
        requiredSpeed,
        confidence
      };
    }
  }

  // Check if already close enough to current ball position
  const currentDistance = Math.sqrt(
    Math.pow(ballTrajectory.currentPosition.x - playerX, 2) +
    Math.pow(ballTrajectory.currentPosition.y - playerY, 2)
  );

  if (currentDistance <= INTERCEPT_RADIUS) {
    return {
      isPossible: true,
      interceptPoint: ballTrajectory.currentPosition,
      timeToReach: 0,
      requiredSpeed: 0,
      confidence: 1.0
    };
  }

  return {
    isPossible: false,
    interceptPoint: null,
    timeToReach: null,
    requiredSpeed: null,
    confidence: 0
  };
}

/**
 * Predicts all players' trajectories
 */
export function predictAllPlayerTrajectories(
  players: Array<{ id: string; x: number; y: number; vx: number; vy: number }>,
  predictionTime: number = 2.0
): PlayerTrajectory[] {
  return players.map(player => ({
    playerId: player.id,
    currentPosition: { x: player.x, y: player.y },
    predictedPath: predictPlayerTrajectory(player.x, player.y, player.vx, player.vy, predictionTime),
    canInterceptBall: false, // Will be calculated separately with ball data
    interceptPoint: null,
    timeToIntercept: null
  }));
}

/**
 * Evaluates pass quality based on trajectories
 */
export function evaluatePassQuality(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  passPower: number,
  opponents: Array<{ x: number; y: number; vx: number; vy: number }>,
  teammate: { x: number; y: number; vx: number; vy: number }
): {
  quality: number; // 0-1
  willReachTeammate: boolean;
  interceptionRisk: number; // 0-1
  reason: string;
} {
  // Calculate pass trajectory
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const passVx = (dx / distance) * passPower;
  const passVy = (dy / distance) * passPower;

  const passTrajectory = predictBallTrajectory(fromX, fromY, passVx, passVy, 3.0);

  // Check if teammate can reach ball
  const teammateIntercept = analyzeInterception(
    teammate.x,
    teammate.y,
    5.0, // Assume max speed
    passTrajectory
  );

  // Check opponent interception risks
  let maxOpponentThreat = 0;
  for (const opponent of opponents) {
    const opponentIntercept = analyzeInterception(
      opponent.x,
      opponent.y,
      4.5, // Slightly slower than teammate
      passTrajectory
    );

    if (opponentIntercept.isPossible) {
      maxOpponentThreat = Math.max(maxOpponentThreat, opponentIntercept.confidence);
    }
  }

  const willReach = teammateIntercept.isPossible;
  const interceptionRisk = maxOpponentThreat;

  let quality = 0;
  let reason = '';

  if (!willReach) {
    quality = 0;
    reason = 'Teammate cannot reach pass';
  } else if (interceptionRisk > 0.7) {
    quality = 0.3;
    reason = 'High interception risk';
  } else if (interceptionRisk > 0.4) {
    quality = 0.6;
    reason = 'Moderate interception risk';
  } else {
    quality = 0.9;
    reason = 'Safe pass';
  }

  return {
    quality,
    willReachTeammate: willReach,
    interceptionRisk,
    reason
  };
}

/**
 * Finds optimal interception point for a player
 */
export function findOptimalInterceptPoint(
  playerX: number,
  playerY: number,
  playerMaxSpeed: number,
  ballTrajectory: BallTrajectory
): Position | null {
  let bestPoint: Position | null = null;
  let bestScore = -Infinity;

  for (const point of ballTrajectory.predictedPath) {
    const distance = Math.sqrt(
      Math.pow(point.x - playerX, 2) + Math.pow(point.y - playerY, 2)
    );

    const timeAvailable = point.t;
    const requiredSpeed = distance / timeAvailable;

    if (requiredSpeed <= playerMaxSpeed) {
      // Prefer points that are earlier in time and closer
      const score = (1 / timeAvailable) * (1 / (distance + 1));

      if (score > bestScore) {
        bestScore = score;
        bestPoint = { x: point.x, y: point.y };
      }
    }
  }

  return bestPoint;
}
