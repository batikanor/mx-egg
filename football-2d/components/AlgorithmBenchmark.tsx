'use client';

import { useState, useEffect } from 'react';
import { CustomAlgorithmDefinition } from '@/types/customAlgorithm';
import { predictBallTrajectoryCustom, benchmarkAlgorithm } from '@/utils/customTrajectoryPredictor';
import { predictBallTrajectory } from '@/utils/trajectoryPredictor';

interface BenchmarkResult {
  algorithmName: string;
  averageError: number;
  maxError: number;
  averageComputeTime: number;
  totalTests: number;
}

interface AlgorithmBenchmarkProps {
  customAlgorithm: CustomAlgorithmDefinition | null;
  gameScore: { red: number; blue: number };
}

export default function AlgorithmBenchmark({ customAlgorithm, gameScore }: AlgorithmBenchmarkProps) {
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runBenchmark = () => {
    setIsRunning(true);

    // Generate test cases (diverse ball positions and velocities)
    const testCases = [
      // Slow rolling balls
      { ballX: 100, ballY: 300, ballVx: 2, ballVy: 1, expectedLanding: { x: 0, y: 0 } },
      { ballX: 500, ballY: 300, ballVx: -1, ballVy: 2, expectedLanding: { x: 0, y: 0 } },
      // Fast shots
      { ballX: 200, ballY: 100, ballVx: 15, ballVy: 5, expectedLanding: { x: 0, y: 0 } },
      { ballX: 800, ballY: 500, ballVx: -10, ballVy: -8, expectedLanding: { x: 0, y: 0 } },
      // Diagonal movements
      { ballX: 300, ballY: 200, ballVx: 5, ballVy: 5, expectedLanding: { x: 0, y: 0 } },
      { ballX: 700, ballY: 400, ballVx: -5, ballVy: -5, expectedLanding: { x: 0, y: 0 } },
      // Corner cases
      { ballX: 50, ballY: 50, ballVx: 3, ballVy: 3, expectedLanding: { x: 0, y: 0 } },
      { ballX: 950, ballY: 550, ballVx: -3, ballVy: -3, expectedLanding: { x: 0, y: 0 } },
      // High velocity bounces
      { ballX: 500, ballY: 300, ballVx: 20, ballVy: 0, expectedLanding: { x: 0, y: 0 } },
      { ballX: 500, ballY: 300, ballVx: 0, ballVy: 15, expectedLanding: { x: 0, y: 0 } },
    ];

    // First, run default algorithm to get "ground truth"
    const defaultResults = testCases.map(tc => {
      const result = predictBallTrajectory(tc.ballX, tc.ballY, tc.ballVx, tc.ballVy);
      return {
        ...tc,
        expectedLanding: result.landingPosition!
      };
    });

    const results: BenchmarkResult[] = [];

    // Benchmark default algorithm
    const defaultAlgo: CustomAlgorithmDefinition = {
      name: "Default Physics",
      version: "1.0.0",
      author: "Game Engine",
      description: "Baseline algorithm",
      parameters: {
        friction: 0.94,
        timeStep: 0.1,
        maxPredictionTime: 3.0,
        bounceEnergyLoss: 0.8,
        stopThreshold: 0.5
      },
      metadata: {
        dateCreated: new Date().toISOString(),
        tags: ['baseline']
      }
    };

    const defaultBenchmark = benchmarkAlgorithm(defaultAlgo, defaultResults);
    results.push({
      algorithmName: "Default Physics (Baseline)",
      ...defaultBenchmark
    });

    // Benchmark custom algorithm if provided
    if (customAlgorithm) {
      const customBenchmark = benchmarkAlgorithm(customAlgorithm, defaultResults);
      results.push({
        algorithmName: customAlgorithm.name,
        ...customBenchmark
      });
    }

    setBenchmarkResults(results);
    setIsRunning(false);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            📊 Algorithm Performance Benchmark
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Compare your custom algorithm against the baseline to see which yields better game scores
          </p>
        </div>
        <button
          onClick={runBenchmark}
          disabled={isRunning}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            isRunning
              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isRunning ? '⏳ Running...' : '▶ Run Benchmark'}
        </button>
      </div>

      {/* Current Game Score */}
      <div className="mb-6 p-4 bg-zinc-800 border border-zinc-600 rounded-lg">
        <h3 className="text-zinc-300 font-semibold mb-2">Current Game Score</h3>
        <div className="flex gap-8">
          <div>
            <span className="text-red-400 font-bold text-2xl">{gameScore.red}</span>
            <span className="text-zinc-500 ml-2">Red (Player FC)</span>
          </div>
          <div>
            <span className="text-blue-400 font-bold text-2xl">{gameScore.blue}</span>
            <span className="text-zinc-500 ml-2">Blue (CPU United)</span>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Test different algorithms and observe which leads to higher scores over multiple games
        </p>
      </div>

      {/* Benchmark Results */}
      {benchmarkResults.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left py-3 px-4 text-zinc-300 font-semibold">Algorithm</th>
                <th className="text-right py-3 px-4 text-zinc-300 font-semibold">Avg Error (px)</th>
                <th className="text-right py-3 px-4 text-zinc-300 font-semibold">Max Error (px)</th>
                <th className="text-right py-3 px-4 text-zinc-300 font-semibold">Avg Time (ms)</th>
                <th className="text-right py-3 px-4 text-zinc-300 font-semibold">Test Cases</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkResults.map((result, idx) => {
                const isBaseline = result.algorithmName.includes('Baseline');
                const isBest = !isBaseline && result.averageError < benchmarkResults[0].averageError;

                return (
                  <tr
                    key={idx}
                    className={`border-b border-zinc-800 ${
                      isBest ? 'bg-green-900/20' : isBaseline ? 'bg-zinc-800/50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-zinc-100">
                      {result.algorithmName}
                      {isBest && <span className="ml-2 text-green-400 text-xs">🏆 Best</span>}
                    </td>
                    <td className="text-right py-3 px-4 text-zinc-300">
                      {result.averageError.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4 text-zinc-300">
                      {result.maxError.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4 text-zinc-300">
                      {result.averageComputeTime.toFixed(3)}
                    </td>
                    <td className="text-right py-3 px-4 text-zinc-400">
                      {result.totalTests}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {benchmarkResults.length === 0 && (
        <div className="text-center py-8 text-zinc-500">
          Click "Run Benchmark" to test algorithm performance
        </div>
      )}

      {/* Explanation */}
      <div className="mt-4 p-4 bg-zinc-800/50 border border-zinc-700 rounded text-xs text-zinc-400">
        <p className="font-semibold text-zinc-300 mb-2">How to use this benchmark:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Load your custom algorithm in the editor above</li>
          <li>Click "Run Benchmark" to compare it against the baseline</li>
          <li>Lower error values indicate better trajectory prediction accuracy</li>
          <li>Play multiple games and observe which algorithm leads to better scores</li>
          <li>Iterate on your algorithm parameters to improve performance</li>
        </ol>
      </div>
    </div>
  );
}
