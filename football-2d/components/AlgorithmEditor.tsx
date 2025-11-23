'use client';

import { useState } from 'react';
import { CustomAlgorithmDefinition, SAMPLE_ALGORITHM, validateAlgorithm } from '@/types/customAlgorithm';

interface AlgorithmEditorProps {
  onAlgorithmSubmit: (algorithm: CustomAlgorithmDefinition) => void;
  currentAlgorithm: CustomAlgorithmDefinition | null;
}

export default function AlgorithmEditor({ onAlgorithmSubmit, currentAlgorithm }: AlgorithmEditorProps) {
  const [jsonText, setJsonText] = useState(
    currentAlgorithm ? JSON.stringify(currentAlgorithm, null, 2) : JSON.stringify(SAMPLE_ALGORITHM, null, 2)
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = () => {
    setErrors([]);
    setSuccessMessage('');

    try {
      const parsed = JSON.parse(jsonText);
      const validation = validateAlgorithm(parsed);

      if (!validation.valid) {
        setErrors(validation.errors);
        return;
      }

      onAlgorithmSubmit(parsed as CustomAlgorithmDefinition);
      setSuccessMessage(`✅ Algorithm "${parsed.name}" loaded successfully!`);
    } catch (e: any) {
      setErrors([`JSON Parse Error: ${e.message}`]);
    }
  };

  const loadSampleTemplate = () => {
    setJsonText(JSON.stringify(SAMPLE_ALGORITHM, null, 2));
    setErrors([]);
    setSuccessMessage('');
  };

  const loadDefaultAlgorithm = () => {
    const defaultAlgorithm: CustomAlgorithmDefinition = {
      name: "Default Physics Model",
      version: "1.0.0",
      author: "Game Engine",
      description: "Standard friction-based physics matching the original game engine",
      parameters: {
        friction: 0.94,
        timeStep: 0.1,
        maxPredictionTime: 3.0,
        bounceEnergyLoss: 0.8,
        stopThreshold: 0.5
      },
      metadata: {
        dateCreated: new Date().toISOString(),
        tags: ['default', 'baseline']
      }
    };
    setJsonText(JSON.stringify(defaultAlgorithm, null, 2));
    setErrors([]);
    setSuccessMessage('');
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          🔬 Custom Algorithm Editor
        </h2>
        <div className="flex gap-2">
          <button
            onClick={loadDefaultAlgorithm}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            Load Default
          </button>
          <button
            onClick={loadSampleTemplate}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
          >
            Load Sample
          </button>
        </div>
      </div>

      <p className="text-zinc-400 text-sm mb-4">
        Sports science researchers: Import custom trajectory prediction algorithms to test against the default model.
        Edit the JSON below and click Submit to activate your algorithm.
      </p>

      {/* JSON Editor */}
      <div className="mb-4">
        <label className="block text-zinc-300 text-sm font-medium mb-2">
          Algorithm Configuration (JSON)
        </label>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="w-full h-96 bg-zinc-800 text-zinc-100 border border-zinc-600 rounded p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Paste your algorithm JSON here..."
          spellCheck={false}
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded">
          <h3 className="text-red-400 font-semibold mb-2">❌ Validation Errors:</h3>
          <ul className="list-disc list-inside text-red-300 text-sm space-y-1">
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded">
          <p className="text-green-400 font-semibold">{successMessage}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
      >
        🚀 Submit & Activate Algorithm
      </button>

      {/* Current Algorithm Info */}
      {currentAlgorithm && (
        <div className="mt-4 p-4 bg-zinc-800 border border-zinc-600 rounded">
          <h3 className="text-zinc-300 font-semibold mb-2">Currently Active Algorithm:</h3>
          <div className="text-sm text-zinc-400 space-y-1">
            <p><span className="font-medium text-zinc-300">Name:</span> {currentAlgorithm.name}</p>
            <p><span className="font-medium text-zinc-300">Version:</span> {currentAlgorithm.version}</p>
            <p><span className="font-medium text-zinc-300">Author:</span> {currentAlgorithm.author}</p>
            <p><span className="font-medium text-zinc-300">Friction:</span> {currentAlgorithm.parameters.friction}</p>
            <p><span className="font-medium text-zinc-300">Time Step:</span> {currentAlgorithm.parameters.timeStep}s</p>
            {currentAlgorithm.customFriction && (
              <p><span className="font-medium text-zinc-300">Custom Friction:</span> {currentAlgorithm.customFriction.type}</p>
            )}
          </div>
        </div>
      )}

      {/* Documentation */}
      <details className="mt-4">
        <summary className="text-zinc-400 text-sm cursor-pointer hover:text-zinc-300">
          📖 View Schema Documentation
        </summary>
        <div className="mt-2 p-4 bg-zinc-800 border border-zinc-600 rounded text-xs text-zinc-400 font-mono overflow-x-auto">
          <pre>{`{
  name: string,              // Algorithm name
  version: string,           // Semantic version
  author: string,            // Your name/lab
  description: string,       // What makes your algorithm unique

  parameters: {
    friction: 0-1,           // Base friction coefficient
    timeStep: number,        // Simulation step (seconds)
    maxPredictionTime: num,  // Max lookahead time
    bounceEnergyLoss: 0-1,   // Energy lost on wall bounce
    stopThreshold: number    // Min speed before stopping
  },

  customFriction?: {
    type: 'linear' | 'quadratic' | 'exponential' | 'piecewise',
    coefficients: number[],
    description: string
  },

  environment?: {
    windEnabled: boolean,
    windVx?: number,
    windVy?: number,
    surfaceFrictionZones?: [...] // Define field zones
  },

  metadata: {
    dateCreated: ISO date,
    tags: string[],
    expectedAccuracy?: number,
    benchmarkScore?: number
  }
}`}</pre>
        </div>
      </details>
    </div>
  );
}
