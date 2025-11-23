# Algorithm Lab Feature

## Overview

The Algorithm Lab allows sports science researchers to design, test, and benchmark custom trajectory prediction algorithms. This feature enables experimentation with different physics models to see which yields better game performance.

## Features

### 1. Custom Algorithm Editor
- **JSON-based configuration**: Define algorithms using a structured JSON schema
- **Live validation**: Immediate feedback on configuration errors
- **Sample templates**: Pre-loaded examples to get started quickly
- **Schema documentation**: Built-in reference for all configuration options

### 2. Algorithm Benchmarking
- **Accuracy testing**: Compare custom algorithms against baseline
- **Performance metrics**: Measure average error, max error, and compute time
- **Visual comparison**: Side-by-side results table
- **Game score tracking**: Observe which algorithm leads to better scores

### 3. Seamless Integration
- **Automatic activation**: Custom algorithms are used immediately after submission
- **Persistent storage**: Algorithms saved in localStorage
- **Visual indicator**: See which algorithm is active in the game UI
- **Easy reset**: One-click return to default algorithm

## How It Works

### JSON Schema

```json
{
  "name": "string",              // Algorithm name
  "version": "string",           // Semantic version
  "author": "string",            // Your name/lab
  "description": "string",       // What makes your algorithm unique

  "parameters": {
    "friction": 0-1,             // Base friction coefficient
    "timeStep": "number",        // Simulation step (seconds)
    "maxPredictionTime": "num",  // Max lookahead time
    "bounceEnergyLoss": 0-1,     // Energy lost on wall bounce
    "stopThreshold": "number"    // Min speed before stopping
  },

  "customFriction": {            // Optional
    "type": "linear | quadratic | exponential | piecewise",
    "coefficients": "number[]",
    "description": "string"
  },

  "environment": {               // Optional
    "windEnabled": "boolean",
    "windVx": "number",
    "windVy": "number",
    "surfaceFrictionZones": [...]
  },

  "metadata": {
    "dateCreated": "ISO date",
    "tags": "string[]",
    "expectedAccuracy": "number",
    "benchmarkScore": "number"
  }
}
```

### Custom Friction Models

#### Linear Friction
```
friction = c[0] + c[1] * velocity
```
Example: `{ type: 'linear', coefficients: [0.94, -0.01] }`

#### Quadratic Friction (Air Resistance)
```
friction = c[0] + c[1] * velocity^2
```
Example: `{ type: 'quadratic', coefficients: [0.92, 0.001] }`

#### Exponential Friction
```
friction = c[0] * exp(-c[1] * velocity)
```
Example: `{ type: 'exponential', coefficients: [0.95, 0.05] }`

#### Piecewise Friction
```
Different friction for velocity ranges
coefficients = [lowFriction, medFriction, highFriction, threshold1, threshold2]
```
Example: `{ type: 'piecewise', coefficients: [0.96, 0.94, 0.90, 5, 10] }`

### Surface Friction Zones

Define areas of the field with different friction:

```json
"surfaceFrictionZones": [
  {
    "x1": 0,
    "y1": 0,
    "x2": 200,
    "y2": 600,
    "frictionMultiplier": 1.2  // 20% more friction (slower)
  }
]
```

### Wind Effects

Add environmental dynamics:

```json
"environment": {
  "windEnabled": true,
  "windVx": 0.5,   // Wind speed in X direction
  "windVy": -0.2   // Wind speed in Y direction
}
```

## Workflow

### 1. Design Phase
1. Navigate to `/algorithm-lab`
2. Edit the JSON configuration
3. Choose from sample templates or load default
4. Validate your configuration

### 2. Testing Phase
1. Submit your algorithm
2. Run benchmark to compare accuracy
3. Observe metrics:
   - Average prediction error (px)
   - Maximum error (px)
   - Computation time (ms)

### 3. Game Integration
1. Return to main game
2. Your algorithm is now active (shown in UI)
3. Play multiple matches
4. Track game scores

### 4. Iteration
1. Return to Algorithm Lab
2. Refine parameters based on results
3. Re-test and compare
4. Find optimal configuration

## Use Cases

### Research Questions

1. **Friction Models**
   - Does quadratic friction improve accuracy for high-speed shots?
   - What's the optimal friction coefficient for realistic gameplay?

2. **Environmental Factors**
   - How does wind affect player positioning strategies?
   - Do surface zones create more dynamic gameplay?

3. **Performance Trade-offs**
   - What's the best balance between accuracy and computation time?
   - How does time step affect prediction quality?

4. **Game Balance**
   - Which friction model produces the highest scoring games?
   - What parameters lead to more strategic AI decisions?

### Example Algorithms

#### High-Accuracy Model
```json
{
  "name": "Precision Physics",
  "parameters": {
    "friction": 0.94,
    "timeStep": 0.05,        // Smaller time step
    "maxPredictionTime": 5.0, // Longer lookahead
    "bounceEnergyLoss": 0.82,
    "stopThreshold": 0.2
  }
}
```

#### Fast-Paced Model
```json
{
  "name": "Arcade Physics",
  "parameters": {
    "friction": 0.90,         // Less friction = faster
    "timeStep": 0.1,
    "maxPredictionTime": 2.0,
    "bounceEnergyLoss": 0.9,  // More bounce
    "stopThreshold": 1.0
  }
}
```

#### Realistic Model
```json
{
  "name": "Real-World Physics",
  "customFriction": {
    "type": "quadratic",
    "coefficients": [0.92, 0.001], // Air resistance
    "description": "Models air resistance at high speeds"
  },
  "parameters": {
    "friction": 0.92,
    "timeStep": 0.05,
    "maxPredictionTime": 4.0,
    "bounceEnergyLoss": 0.75,
    "stopThreshold": 0.3
  }
}
```

## Technical Implementation

### Files Created

1. **`types/customAlgorithm.ts`**: Type definitions and validation
2. **`utils/customTrajectoryPredictor.ts`**: Algorithm execution engine
3. **`utils/trajectoryPredictorWrapper.ts`**: Automatic fallback system
4. **`components/AlgorithmEditor.tsx`**: JSON editor UI
5. **`components/AlgorithmBenchmark.tsx`**: Performance testing UI
6. **`app/algorithm-lab/page.tsx`**: Main lab interface

### Integration Points

- **TacticalFootball.tsx**: Uses wrapper function for trajectory prediction
- **localStorage**: Persists custom algorithm across sessions
- **UI Indicator**: Shows active algorithm name with reset button

### Safety Features

- **Validation**: Comprehensive JSON schema validation
- **Error handling**: Graceful fallback to default algorithm on errors
- **Sandboxing**: Algorithms run in isolated execution context
- **Performance monitoring**: Track computation time per prediction

## Future Enhancements

### Potential Features
1. **Algorithm Repository**: Share and download community algorithms
2. **Visual Editor**: GUI for non-technical users
3. **A/B Testing**: Automated comparison across multiple games
4. **ML Integration**: Train algorithms from game data
5. **Replay Analysis**: Visualize trajectory predictions
6. **Tournament Mode**: Test algorithms in structured competitions

### Advanced Physics
1. **Ball spin**: Magnus effect for curved shots
2. **Player mass**: Variable player weights
3. **Collision physics**: Player-player interactions
4. **Fatigue modeling**: Speed degradation over time

## Best Practices

### For Researchers

1. **Start with baseline**: Always compare against default algorithm
2. **Document changes**: Use descriptive names and metadata
3. **Iterate incrementally**: Change one parameter at a time
4. **Track results**: Record benchmark scores and game outcomes
5. **Consider edge cases**: Test extreme velocities and positions

### For Algorithm Design

1. **Maintain stability**: Ensure predictions don't cause game crashes
2. **Optimize performance**: Keep computation time under 1ms
3. **Validate physically**: Results should be plausible
4. **Test thoroughly**: Run benchmarks before game testing
5. **Document assumptions**: Explain your friction model choice

## Troubleshooting

### Common Issues

**Algorithm not activating**
- Check browser console for validation errors
- Ensure JSON is properly formatted
- Verify all required fields are present

**Poor game performance**
- Reduce `timeStep` (larger steps)
- Decrease `maxPredictionTime`
- Simplify custom friction calculations

**Inaccurate predictions**
- Increase `timeStep` precision (smaller steps)
- Match friction to game engine (0.94)
- Test with benchmark suite

**Game behaving strangely**
- Check for extreme parameter values
- Ensure bounce energy loss is between 0-1
- Verify friction zones don't overlap incorrectly

## Support

For questions or issues:
1. Check schema documentation in the editor
2. Load sample templates for reference
3. Reset to default algorithm to test baseline
4. Review benchmark results for accuracy metrics

---

**Built for sports science research and AI experimentation.**
