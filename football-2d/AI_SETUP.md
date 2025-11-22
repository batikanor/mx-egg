# AI Strategy Selection Setup

This game uses **OpenRouter** with **Grok 4.1 Fast (Non-Reasoning)** for AI-powered strategy selection. Each player analyzes their FOV screenshots, trajectory predictions, and game state every 5 seconds to decide their optimal strategy.

## Setup Instructions

### 1. Get an OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up / Log in
3. Navigate to [API Keys](https://openrouter.ai/keys)
4. Create a new API key
5. Copy your API key

### 2. Configure Locally

Create a `.env.local` file in the project root:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

Then restart your dev server:

```bash
npm run dev
```

### 3. Configure on Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `OPENROUTER_API_KEY`
   - **Value**: `sk-or-v1-your-api-key-here`
   - **Environment**: Production, Preview, Development (select all)
4. Click **Save**
5. Redeploy your application

## How It Works

- **Every 5 seconds**, a random player is selected for strategy evaluation
- The AI receives:
  - Player's last 5 FOV screenshots (most recent first)
  - Current game score and team
  - Ball trajectory and landing position
  - Interception analysis (who can reach the ball and when)
  - Teammate strategies
  - Role descriptions and strategy guidelines
- The AI responds with:
  - Selected strategy (can choose to keep current strategy)
  - Reasoning for the decision (2-3 sentences)
- **Strategy thoughts** are logged and displayed in the player's knowledge base
- Teammates are notified of strategy changes

## Model Information

- **Model**: `x-ai/grok-4-1-fast-non-reasoning`
- **Capabilities**: Multimodal (text + images)
- **Context**: Analyzes last 5 FOV screenshots with game state
- **Output**: JSON with strategy selection and reasoning
- **Speed**: Optimized for instant responses without extended reasoning

## Viewing AI Thoughts

1. Select a player by clicking on them in the 2D/3D view
2. Scroll down to the "🤖 AI Strategy Thoughts" section
3. See the complete history of strategy decisions with timestamps and reasoning
4. Green text = strategy changed
5. Blue text = strategy kept the same

## Cost Optimization

The API is called at a controlled rate (1 player every 5 seconds for 8 players = ~96 calls/hour).
With Grok's pricing, this should be very affordable during development and testing.

## Troubleshooting

- **No strategy updates**: Check browser console for API errors
- **403 Forbidden**: Verify your API key is correct in environment variables
- **500 Error**: Check Vercel function logs for detailed error messages
- **Blank thoughts**: Ensure players have FOV screenshots (wait ~1-2 seconds after game start)
