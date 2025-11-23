// Custom Trajectory Prediction Engine
// Executes user-defined algorithms from JSON configuration

import { CustomAlgorithmDefinition } from '@/types/customAlgorithm';
import { BallTrajectory, TrajectoryPoint } from './trajectoryPredictor';

const FIELD_WIDTH = 1000;
const FIELD_HEIGHT = 600;

/**
 * Calculate friction based on custom friction function
 */
function calculateCustomFriction(
  velocity: number,
  config: NonNullable<CustomAlgorithmDefinition['customFriction']>
): number {
  const { type, coefficients } = config;

  switch (type) {
    case 'linear':
      // friction = c[0] + c[1] * velocity
      return coefficients[0] + (coefficients[1] || 0) * velocity;

    case 'quadratic':
      // friction = c[0] + c[1] * velocity^2
      return coefficients[0] + (coefficients[1] || 0) * velocity * velocity;

    case 'exponential':
      // friction = c[0] * exp(-c[1] * velocity)
      return coefficients[0] * Math.exp(-(coefficients[1] || 0) * velocity);

    case 'piecewise':
      // Use different friction for different velocity ranges
      // coefficients = [lowFriction, medFriction, highFriction, threshold1, threshold2]
      if (velocity < coefficients[3]) return coefficients[0];
      if (velocity < coefficients[4]) return coefficients[1];
      return coefficients[2];

    default:
      return coefficients[0];
  }
}

/**
 * Get friction multiplier for a position based on surface zones
 */
function getSurfaceFrictionMultiplier(
  x: number,
  y: number,
  zones?: Array<{ x1: number; y1: number; x2: number; y2: number; frictionMultiplier: number }>
): number {
  if (!zones) return 1.0;

  for (const zone of zones) {
    if (x >= zone.x1 && x <= zone.x2 && y >= zone.y1 && y <= zone.y2) {
      return zone.frictionMultiplier;
    }
  }

  return 1.0;
}

/**
 * Execute custom trajectory prediction algorithm
 */
export function predictBallTrajectoryCustom(
  ballX: number,
  ballY: number,
  ballVx: number,
  ballVy: number,
  algorithm: CustomAlgorithmDefinition
): BallTrajectory {
  const {
    parameters,
    customFriction,
    environment,
    ballPhysics
  } = algorithm;

  const path: TrajectoryPoint[] = [];

  let x = ballX;
  let y = ballY;
  let vx = ballVx;
  let vy = ballVy;
  let t = 0;

  const timeStep = parameters.timeStep;
  const maxTime = parameters.maxPredictionTime;
  let willExitField = false;

  // Simulate forward in time
  while (t < maxTime) {
    // Calculate current speed
    const speed = Math.sqrt(vx * vx + vy * vy);

    // Apply friction
    let frictionCoeff: number;
    if (customFriction) {
      frictionCoeff = calculateCustomFriction(speed, customFriction);
    } else {
      frictionCoeff = parameters.friction;
    }

    // Apply surface friction multiplier
    const surfaceMultiplier = getSurfaceFrictionMultiplier(
      x,
      y,
      environment?.surfaceFrictionZones
    );
    frictionCoeff *= surfaceMultiplier;

    // Apply friction to velocity
    vx *= frictionCoeff;
    vy *= frictionCoeff;

    // Apply wind if enabled
    if (environment?.windEnabled && environment.windVx !== undefined && environment.windVy !== undefined) {
      vx += environment.windVx * timeStep;
      vy += environment.windVy * timeStep;
    }

    // Update position
    x += vx;
    y += vy;

    // Bounce off walls with energy loss
    if (x < 0 || x > FIELD_WIDTH) {
      vx *= -parameters.bounceEnergyLoss;
      x = Math.max(0, Math.min(FIELD_WIDTH, x));
      if (x <= 0 || x >= FIELD_WIDTH) {
        willExitField = true;
      }
    }
    if (y < 0 || y > FIELD_HEIGHT) {
      vy *= -parameters.bounceEnergyLoss;
      y = Math.max(0, Math.min(FIELD_HEIGHT, y));
      if (y <= 0 || y >= FIELD_HEIGHT) {
        willExitField = true;
      }
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
    if (speed < parameters.stopThreshold) {
      break;
    }
  }

  const lastPoint = path[path.length - 1] || { x: ballX, y: ballY, t: 0 };

  return {
    currentPosition: { x: ballX, y: ballY },
    predictedPath: path,
    landingPosition: { x: lastPoint.x, y: lastPoint.y },
    timeToStop: lastPoint.t,
    willExitField
  };
}

/**
 * Compare algorithm performance
 * Returns metrics for evaluation
 */
export function benchmarkAlgorithm(
  algorithm: CustomAlgorithmDefinition,
  testCases: Array<{
    ballX: number;
    ballY: number;
    ballVx: number;
    ballVy: number;
    expectedLanding: { x: number; y: number };
  }>
): {
  averageError: number;
  maxError: number;
  averageComputeTime: number;
  totalTests: number;
} {
  let totalError = 0;
  let maxError = 0;
  let totalTime = 0;

  for (const testCase of testCases) {
    const startTime = performance.now();

    const prediction = predictBallTrajectoryCustom(
      testCase.ballX,
      testCase.ballY,
      testCase.ballVx,
      testCase.ballVy,
      algorithm
    );

    const endTime = performance.now();
    totalTime += endTime - startTime;

    // Calculate error (Euclidean distance)
    const error = Math.sqrt(
      Math.pow(prediction.landingPosition!.x - testCase.expectedLanding.x, 2) +
      Math.pow(prediction.landingPosition!.y - testCase.expectedLanding.y, 2)
    );

    totalError += error;
    maxError = Math.max(maxError, error);
  }

  return {
    averageError: totalError / testCases.length,
    maxError,
    averageComputeTime: totalTime / testCases.length,
    totalTests: testCases.length
  };
}
