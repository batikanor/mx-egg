'use client';

import { useState } from 'react';
import { CustomAlgorithmDefinition } from '@/types/customAlgorithm';
import AlgorithmEditor from '@/components/AlgorithmEditor';
import AlgorithmBenchmark from '@/components/AlgorithmBenchmark';
import Link from 'next/link';

export default function AlgorithmLabPage() {
  const [customAlgorithm, setCustomAlgorithm] = useState<CustomAlgorithmDefinition | null>(null);
  const [gameScore, setGameScore] = useState({ red: 0, blue: 0 });

  const handleAlgorithmSubmit = (algorithm: CustomAlgorithmDefinition) => {
    setCustomAlgorithm(algorithm);
    // Store in localStorage so it persists to the game
    localStorage.setItem('customAlgorithm', JSON.stringify(algorithm));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                🧪 Sports Science Algorithm Laboratory
              </h1>
              <p className="text-zinc-400">
                Design, test, and benchmark custom trajectory prediction algorithms
              </p>
            </div>
            <Link
              href="/"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              ← Back to Game
            </Link>
          </div>

          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mt-4">
            <p className="text-yellow-300 text-sm">
              <span className="font-semibold">For Sports Science Researchers:</span> This lab allows you to experiment
              with different trajectory prediction models. Your custom algorithm will be used by the AI players to make
              tactical decisions. Test various friction models, surface zones, and environmental factors to see which
              yields the best game performance.
            </p>
          </div>
        </div>

        {/* Algorithm Editor */}
        <AlgorithmEditor
          onAlgorithmSubmit={handleAlgorithmSubmit}
          currentAlgorithm={customAlgorithm}
        />

        {/* Benchmark */}
        <AlgorithmBenchmark
          customAlgorithm={customAlgorithm}
          gameScore={gameScore}
        />

        {/* Instructions */}
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            📚 How to Use the Algorithm Lab
          </h2>

          <div className="space-y-4 text-sm text-zinc-300">
            <div>
              <h3 className="font-semibold text-white mb-2">1. Design Your Algorithm</h3>
              <p className="text-zinc-400">
                Edit the JSON configuration to define your custom trajectory prediction algorithm. You can modify
                friction coefficients, time steps, bounce behavior, and even add environmental factors like wind
                or surface friction zones.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">2. Run Benchmarks</h3>
              <p className="text-zinc-400">
                Click "Run Benchmark" to test your algorithm's accuracy against the baseline. Lower error values
                indicate better prediction accuracy. The benchmark tests various ball trajectories and measures
                how closely your algorithm matches the ground truth.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">3. Test in Game</h3>
              <p className="text-zinc-400">
                Once you've submitted your algorithm, go back to the game. Your custom algorithm will be used
                for all trajectory predictions. Observe how the AI players perform with your algorithm and track
                the game score over multiple matches.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">4. Iterate and Improve</h3>
              <p className="text-zinc-400">
                Return to the lab to refine your algorithm based on game performance. Try different parameter
                combinations, friction models, or environmental factors to achieve the best results.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-zinc-800 border border-zinc-600 rounded">
            <h3 className="font-semibold text-white mb-2">Research Questions to Explore:</h3>
            <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
              <li>Does quadratic friction (air resistance model) improve prediction accuracy for fast shots?</li>
              <li>How do surface friction zones affect player positioning strategies?</li>
              <li>What's the optimal time step for balancing accuracy and performance?</li>
              <li>Can environmental factors like wind create more dynamic gameplay?</li>
              <li>Which bounce energy loss coefficient produces the most realistic physics?</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-zinc-500 text-sm">
          <p>
            Built for sports science research and AI experimentation.
            <br />
            Your algorithms are stored locally and only affect your browser session.
          </p>
        </div>
      </div>
    </div>
  );
}
