import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface StrategyRequest {
  playerKnowledge: any; // Full PlayerKnowledge object
  availableStrategies: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { playerKnowledge, availableStrategies }: StrategyRequest = await request.json();

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Prepare the multimodal content with FOV screenshots and game state
    const userContent = [
      {
        type: 'text',
        text: `You are an AI football player making tactical decisions. Analyze your current situation and choose the best strategy.

**Current Game State:**
- Team: ${playerKnowledge.team === 'red' ? 'Red (Player FC)' : 'Blue (CPU United)'}
- Role: ${playerKnowledge.myRole === 'GK' ? 'Goalkeeper' : 'Field Player'}
- Score: Red ${playerKnowledge.currentScore.red} - ${playerKnowledge.currentScore.blue} Blue
- Current Strategy: ${playerKnowledge.myCurrentStrategy}
- My Goal: ${playerKnowledge.myGoalSide}
- Opponent Goal: ${playerKnowledge.opponentGoalSide}

**Trajectory Analysis:**
- Ball landing position: (${playerKnowledge.ballPrediction.landingPosition?.x.toFixed(0)}, ${playerKnowledge.ballPrediction.landingPosition?.y.toFixed(0)})
- Time until ball stops: ${playerKnowledge.ballPrediction.timeToStop.toFixed(1)}s
- Can I intercept? ${playerKnowledge.canInterceptBall ? `Yes, in ${playerKnowledge.timeToInterceptBall?.toFixed(1)}s` : 'No'}
- Teammates who can intercept: ${playerKnowledge.teammatePredictions.filter((t: any) => t.canInterceptBall).length}
- Opponent threats: ${playerKnowledge.opponentPredictions.filter((o: any) => o.canInterceptBall).length}

**Teammate Strategies:**
${playerKnowledge.teammateStrategies.map((t: any) => `- Player ${t.playerId}: ${t.strategy}`).join('\n')}

**Available Strategies:**
${availableStrategies.join(', ')}

**Strategy Guidelines:**
${playerKnowledge.myRole === 'GK' ? playerKnowledge.roleDescriptions.GK : playerKnowledge.roleDescriptions.FIELD}

**When to use strategies:**
- Winning: ${playerKnowledge.whenToUseStrategies.winning}
- Losing: ${playerKnowledge.whenToUseStrategies.losing}
- Tied: ${playerKnowledge.whenToUseStrategies.tied}

Based on the FOV screenshots (showing your recent field of view) and all the above information, decide:
1. Should you change your strategy or keep it the same?
2. If changing, which strategy is best?

Respond in JSON format:
{
  "selectedStrategy": "strategy name",
  "reasoning": "brief explanation of why you made this choice (2-3 sentences)"
}`
      },
      // Add the most recent FOV screenshot if available
      ...(playerKnowledge.fovScreenshots.length > 0
        ? [
            {
              type: 'image_url',
              image_url: {
                url: playerKnowledge.fovScreenshots[playerKnowledge.fovScreenshots.length - 1],
              },
            },
          ]
        : []),
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.VERCEL_URL || 'http://localhost:3000',
        'X-Title': 'Football 2D Tactical Game',
      },
      body: JSON.stringify({
        model: 'x-ai/grok-2-vision-1212', // Latest multimodal Grok model
        messages: [
          {
            role: 'user',
            content: userContent,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      return NextResponse.json(
        { error: 'OpenRouter API request failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse);
      return NextResponse.json(
        { error: 'Invalid AI response format', rawResponse: aiResponse },
        { status: 500 }
      );
    }

    return NextResponse.json({
      selectedStrategy: parsedResponse.selectedStrategy,
      reasoning: parsedResponse.reasoning,
      timestamp: Date.now(),
    });

  } catch (error: any) {
    console.error('Strategy selection error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
