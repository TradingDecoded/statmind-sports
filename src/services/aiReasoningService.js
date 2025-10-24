// src/services/aiReasoningService.js
import Anthropic from '@anthropic-ai/sdk';

class AIReasoningService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Generate professional analyst-quality reasoning for a prediction
   */
  async generateReasoning(predictionData) {
    try {
      const {
        home_team,
        away_team,
        predicted_winner,
        home_win_probability,
        away_win_probability,
        eloScore,
        powerScore,
        situationalScore,
        matchupScore,
        recentFormScore,
        homeStats,
        awayStats,
        confidence
      } = predictionData;

      // Calculate key metrics
      const favoredTeam = home_win_probability > 0.5 ? home_team : away_team;
      const winProbability = Math.round(Math.max(home_win_probability, away_win_probability) * 100);

      // Build the prompt for Claude
      const prompt = this.buildAnalystPrompt(predictionData);

      // Call Claude API
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      // Extract the generated reasoning
      const reasoning = message.content[0].text.trim();

      console.log(`✨ AI reasoning generated for ${away_team} @ ${home_team}`);
      return reasoning;

    } catch (error) {
      console.error('❌ Error generating AI reasoning:', error.message);

      // Fallback to template-based reasoning if AI fails
      return this.generateFallbackReasoning(predictionData);
    }
  }

  /**
   * Build the prompt for Claude to generate analyst-quality reasoning
   */
  buildAnalystPrompt(data) {
    const {
      home_team,
      away_team,
      predicted_winner,
      home_win_probability,
      away_win_probability,
      eloScore,
      powerScore,
      situationalScore,
      matchupScore,
      recentFormScore,
      homeStats,
      awayStats,
      confidence,
      injuryContext
    } = data;

    const favoredTeam = home_win_probability > 0.5 ? home_team : away_team;
    const underdog = home_win_probability > 0.5 ? away_team : home_team;
    const winProbability = Math.round(Math.max(home_win_probability, away_win_probability) * 100);
    const spread = Math.abs(eloScore * 0.4).toFixed(1); // Rough spread estimate

    // Determine what type of game this is
    const gameNarrative = this.determineGameNarrative(data);

    // Build injury context if available
    let injurySection = '';
    if (injuryContext) {
      injurySection = `
🚨 **INJURY ALERT**: ${injuryContext.playerName} (${injuryContext.position}) is OUT for ${injuryContext.teamAbbr}. This is a significant absence that impacts the matchup.`;
    }

    const prompt = `You are an ESPN-style NFL analyst writing game analysis for StatMind Sports (79.7% accuracy rate).

**MATCHUP**: ${away_team} @ ${home_team}
**PICK**: ${predicted_winner} (${winProbability}% confidence)
${injurySection}

**KEY DATA POINTS**:
${favoredTeam} Advantages:
- Elo Rating: ${Math.abs(Math.round(eloScore * 20))} points higher
- Record: ${home_win_probability > 0.5 ? homeStats.wins : awayStats.wins}-${home_win_probability > 0.5 ? homeStats.losses : awayStats.losses} vs ${home_win_probability > 0.5 ? awayStats.wins : homeStats.wins}-${home_win_probability > 0.5 ? awayStats.losses : homeStats.losses}
- Scoring: ${home_win_probability > 0.5 ? homeStats.points_per_game?.toFixed(1) : awayStats.points_per_game?.toFixed(1)} PPG vs ${home_win_probability > 0.5 ? awayStats.points_per_game?.toFixed(1) : homeStats.points_per_game?.toFixed(1)} PPG
- Defense: Allowing ${home_win_probability > 0.5 ? homeStats.points_allowed_per_game?.toFixed(1) : awayStats.points_allowed_per_game?.toFixed(1)} vs ${home_win_probability > 0.5 ? awayStats.points_allowed_per_game?.toFixed(1) : homeStats.points_allowed_per_game?.toFixed(1)} PPG

Location Factors:
- ${home_team} at home: ${homeStats.home_wins || 0}-${(homeStats.home_games - homeStats.home_wins) || 0}
- ${away_team} on road: ${awayStats.away_wins || 0}-${(awayStats.away_games - awayStats.away_wins) || 0}

**GAME TYPE**: ${gameNarrative}

**YOUR TASK**: Write a 2-3 paragraph analysis that sounds like a real NFL analyst breaking down this game. Focus on:

1. **Opening Hook** (1-2 sentences): Start with the pick and WHY it makes sense from a football perspective
   ${injuryContext ? '- MUST mention the injury impact in your opening' : ''}
   - Use phrases like: "this matchup favors...", "the key battle is...", "momentum swings toward..."
   - NO generic statements like "analyzing the data" or "our system predicts"

2. **Matchup Analysis** (2-3 sentences): Dive into the actual football factors
   - Talk about offensive vs defensive strengths
   - Mention specific advantages (pass rush vs O-line, run game vs run defense, etc.)
   - Reference the records and recent performance NATURALLY (don't list stats robotically)
   - Use analyst language: "exploitable weakness", "mismatch advantage", "tough environment"

3. **The Bottom Line** (1-2 sentences): Conclude with confidence level and what to watch
   - Acknowledge if it's a close game or if one team has clear edges
   - End with insight, not just restating the prediction

**STYLE RULES**:
- Write in PRESENT TENSE (e.g., "The Chiefs boast a high-powered offense")
- Be CONVERSATIONAL but PROFESSIONAL
- Use SPECIFIC football terminology (red zone efficiency, third down defense, pass rush, etc.)
- Include numbers NATURALLY in sentences, not as bullet points
- NEVER say: "our algorithm predicts", "based on our data", "the numbers show"
- DO say: "this shapes up as", "the edge goes to", "expect a battle between", "the key matchup"
- Keep it under 120 words total
- Sound confident but not arrogant (${confidence} confidence level)

Write ONLY the analysis - no preamble, no title, no "here's my analysis":`;

    return prompt;
  }

  /**
   * Helper method to categorize the game narrative
   */
  determineGameNarrative(data) {
    const { home_win_probability, confidence, eloScore } = data;
    const probDiff = Math.abs(home_win_probability - 0.5);

    if (confidence === 'High') {
      return 'Clear Favorite Matchup';
    } else if (probDiff < 0.07) {
      return 'Toss-Up Game';
    } else if (Math.abs(eloScore) > 15) {
      return 'Talent Mismatch';
    } else {
      return 'Competitive Matchup';
    }
  }

  /**
   * Fallback reasoning if AI generation fails
   */
  generateFallbackReasoning(data) {
    const {
      home_team,
      away_team,
      predicted_winner,
      home_win_probability,
      eloScore,
      powerScore,
      situationalScore,
      matchupScore,
      recentFormScore
    } = data;

    const probability = Math.round(Math.max(home_win_probability, 1 - home_win_probability) * 100);
    let reasoning = `${predicted_winner} favored with ${probability}% win probability. `;

    const factors = [
      { name: 'Elo advantage', score: Math.abs(eloScore), favorable: eloScore > 0 === home_win_probability > 0.5 },
      { name: 'Power rating edge', score: Math.abs(powerScore), favorable: powerScore > 0 === home_win_probability > 0.5 },
      { name: 'Home field advantage', score: Math.abs(situationalScore), favorable: situationalScore > 0 },
      { name: 'Matchup superiority', score: Math.abs(matchupScore), favorable: matchupScore > 0 === home_win_probability > 0.5 },
      { name: 'Recent form momentum', score: Math.abs(recentFormScore), favorable: recentFormScore > 0 === home_win_probability > 0.5 }
    ];

    factors.sort((a, b) => b.score - a.score);
    const topFactors = factors.filter(f => f.favorable).slice(0, 2);

    if (topFactors.length > 0) {
      reasoning += 'Key factors: ' + topFactors.map(f => f.name).join(', ') + '.';
    }

    return reasoning;
  }
}

// Export singleton instance
const aiReasoningService = new AIReasoningService();
export default aiReasoningService;
