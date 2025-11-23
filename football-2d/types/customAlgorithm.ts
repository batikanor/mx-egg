// Custom Algorithm Schema for Sports Science Researchers
// Allows importing trajectory prediction algorithms via JSON

export interface CustomAlgorithmDefinition {
  name: string;
  version: string;
  author: string;
  description: string;

  // Algorithm parameters
  parameters: {
    friction: number;           // Base friction coefficient (0-1)
    timeStep: number;           // Simulation time step in seconds
    maxPredictionTime: number;  // Maximum prediction time in seconds
    bounceEnergyLoss: number;   // Energy loss on wall bounce (0-1)
    stopThreshold: number;      // Speed threshold for stopping
  };

  // Optional: Custom friction function
  // If provided, overrides base friction
  customFriction?: {
    type: 'linear' | 'quadratic' | 'exponential' | 'piecewise';
    coefficients: number[];
    description: string;
  };

  // Optional: Environmental factors
  environment?: {
    windEnabled: boolean;
    windVx?: number;
    windVy?: number;
    surfaceFrictionZones?: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      frictionMultiplier: number;
    }>;
  };

  // Optional: Ball physics modifications
  ballPhysics?: {
    mass: number;              // Ball mass (affects momentum)
    radius: number;            // Ball radius
    spinDecay?: number;        // Spin decay rate
    magnusEffect?: boolean;    // Enable Magnus effect (curved shots)
  };

  // Metadata for tracking
  metadata: {
    dateCreated: string;
    tags: string[];
    expectedAccuracy?: number; // Self-reported accuracy %
    benchmarkScore?: number;   // Score achieved in testing
  };
}

// Sample algorithm template
export const SAMPLE_ALGORITHM: CustomAlgorithmDefinition = {
  name: "Enhanced Friction Model",
  version: "1.0.0",
  author: "Sports Science Lab",
  description: "Quadratic friction model with surface zones for more realistic ball behavior",

  parameters: {
    friction: 0.92,
    timeStep: 0.05,
    maxPredictionTime: 4.0,
    bounceEnergyLoss: 0.75,
    stopThreshold: 0.3
  },

  customFriction: {
    type: 'quadratic',
    coefficients: [0.92, 0.001], // friction = 0.92 - 0.001 * velocity^2
    description: "Friction increases with speed (air resistance)"
  },

  environment: {
    windEnabled: false,
    surfaceFrictionZones: [
      {
        x1: 0,
        y1: 0,
        x2: 200,
        y2: 600,
        frictionMultiplier: 1.1 // Slower near goal (rough patch)
      }
    ]
  },

  metadata: {
    dateCreated: new Date().toISOString(),
    tags: ['realistic', 'quadratic-friction', 'surface-zones'],
    expectedAccuracy: 92
  }
};

// Validation function
export function validateAlgorithm(json: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  if (!json.name || typeof json.name !== 'string') {
    errors.push('Missing or invalid "name" field');
  }
  if (!json.version || typeof json.version !== 'string') {
    errors.push('Missing or invalid "version" field');
  }
  if (!json.author || typeof json.author !== 'string') {
    errors.push('Missing or invalid "author" field');
  }

  // Parameters validation
  if (!json.parameters) {
    errors.push('Missing "parameters" object');
  } else {
    const p = json.parameters;
    if (typeof p.friction !== 'number' || p.friction < 0 || p.friction > 1) {
      errors.push('Invalid friction (must be 0-1)');
    }
    if (typeof p.timeStep !== 'number' || p.timeStep <= 0 || p.timeStep > 1) {
      errors.push('Invalid timeStep (must be 0-1)');
    }
    if (typeof p.maxPredictionTime !== 'number' || p.maxPredictionTime <= 0) {
      errors.push('Invalid maxPredictionTime (must be > 0)');
    }
    if (typeof p.bounceEnergyLoss !== 'number' || p.bounceEnergyLoss < 0 || p.bounceEnergyLoss > 1) {
      errors.push('Invalid bounceEnergyLoss (must be 0-1)');
    }
    if (typeof p.stopThreshold !== 'number' || p.stopThreshold < 0) {
      errors.push('Invalid stopThreshold (must be >= 0)');
    }
  }

  // Metadata validation
  if (!json.metadata) {
    errors.push('Missing "metadata" object');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
