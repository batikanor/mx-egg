// Trajectory Predictor Wrapper
// Automatically uses custom algorithm if available, otherwise falls back to default

import { predictBallTrajectory as predictBallTrajectoryDefault, BallTrajectory } from './trajectoryPredictor';
import { predictBallTrajectoryCustom } from './customTrajectoryPredictor';
import { CustomAlgorithmDefinition } from '@/types/customAlgorithm';

let cachedCustomAlgorithm: CustomAlgorithmDefinition | null = null;
let lastCheck = 0;
const CHECK_INTERVAL = 1000; // Check localStorage every second

/**
 * Get custom algorithm from localStorage with caching
 */
function getCustomAlgorithm(): CustomAlgorithmDefinition | null {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return null;
  }

  const now = Date.now();

  // Only check localStorage once per second to avoid performance hit
  if (now - lastCheck > CHECK_INTERVAL) {
    lastCheck = now;

    try {
      const stored = localStorage.getItem('customAlgorithm');
      if (stored) {
        cachedCustomAlgorithm = JSON.parse(stored);
      } else {
        cachedCustomAlgorithm = null;
      }
    } catch (e) {
      console.error('Failed to load custom algorithm:', e);
      cachedCustomAlgorithm = null;
    }
  }

  return cachedCustomAlgorithm;
}

/**
 * Predict ball trajectory using custom algorithm if available
 * Falls back to default algorithm automatically
 */
export function predictBallTrajectory(
  ballX: number,
  ballY: number,
  ballVx: number,
  ballVy: number,
  predictionTime: number = 3.0,
  timeStep: number = 0.1
): BallTrajectory {
  const customAlgo = getCustomAlgorithm();

  if (customAlgo) {
    try {
      return predictBallTrajectoryCustom(ballX, ballY, ballVx, ballVy, customAlgo);
    } catch (e) {
      console.error('Custom algorithm failed, falling back to default:', e);
      // Fall through to default
    }
  }

  // Use default algorithm
  return predictBallTrajectoryDefault(ballX, ballY, ballVx, ballVy, predictionTime, timeStep);
}

/**
 * Check if a custom algorithm is currently active
 */
export function isCustomAlgorithmActive(): boolean {
  return getCustomAlgorithm() !== null;
}

/**
 * Get the name of the currently active algorithm
 */
export function getActiveAlgorithmName(): string {
  const customAlgo = getCustomAlgorithm();
  return customAlgo ? customAlgo.name : 'Default Physics';
}

/**
 * Clear custom algorithm (revert to default)
 */
export function clearCustomAlgorithm(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('customAlgorithm');
    cachedCustomAlgorithm = null;
  }
}
