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
      confidence
    } = data;

    const favoredTeam = home_win_probability > 0.5 ? home_team : away_team;
    const winProbability = Math.round(Math.max(home_win_probability, away_win_probability) * 100);
    const isHomeTeamFavored = home_win_probability > 0.5;

    // Identify key factors
    const componentScores = [
      { name: 'Elo Rating', score: Math.abs(eloScore), weight: '35%', raw: eloScore },
      { name: 'Power Rating', score: Math.abs(powerScore), weight: '15%', raw: powerScore },
      { name: 'Home/Away Performance', score: Math.abs(situationalScore), weight: '25%', raw: situationalScore },
      { name: 'Matchup Analysis', score: Math.abs(matchupScore), weight: '20%', raw: matchupScore },
      { name: 'Recent Form', score: Math.abs(recentFormScore), weight: '5%', raw: recentFormScore }
    ];

    // Sort by impact (absolute value)
    componentScores.sort((a, b) => b.score - a.score);
    const topFactors = componentScores.slice(0, 3);

    const prompt = `You are a professional NFL analyst writing a prediction analysis for StatMind Sports, a sports prediction platform with 79.7% historical accuracy.

**Game:** ${away_team} @ ${home_team}

**Prediction:** ${predicted_winner} to win with ${winProbability}% probability (${confidence} confidence)

**5-Component Analysis Breakdown:**
${componentScores.map(c => `- ${c.name} (${c.weight} weight): ${c.raw > 0 ? '+' : ''}${c.raw.toFixed(1)} (favors ${c.raw > 0 ? home_team : away_team})`).join('\n')}

**Team Statistics:**

${home_team} (Home):
- Elo Rating: ${homeStats.elo_rating?.toFixed(0) || 'N/A'}
- Record: ${homeStats.wins || 0}-${homeStats.losses || 0}
- Home Record: ${homeStats.home_wins || 0}-${(homeStats.home_games - homeStats.home_wins) || 0}
- Offensive Rating: ${homeStats.offensive_rating?.toFixed(1) || 'N/A'}
- Defensive Rating: ${homeStats.defensive_rating?.toFixed(1) || 'N/A'}
- Points Per Game: ${homeStats.points_per_game?.toFixed(1) || 'N/A'}
- Points Allowed: ${homeStats.points_allowed_per_game?.toFixed(1) || 'N/A'}

${away_team} (Away):
- Elo Rating: ${awayStats.elo_rating?.toFixed(0) || 'N/A'}
- Record: ${awayStats.wins || 0}-${awayStats.losses || 0}
- Away Record: ${awayStats.away_wins || 0}-${(awayStats.away_games - awayStats.away_wins) || 0}
- Offensive Rating: ${awayStats.offensive_rating?.toFixed(1) || 'N/A'}
- Defensive Rating: ${awayStats.defensive_rating?.toFixed(1) || 'N/A'}
- Points Per Game: ${awayStats.points_per_game?.toFixed(1) || 'N/A'}
- Points Allowed: ${awayStats.points_allowed_per_game?.toFixed(1) || 'N/A'}

**Top 3 Factors Influencing This Prediction:**
${topFactors.map((f, i) => `${i + 1}. ${f.name} (${f.weight} weight): ${f.raw > 0 ? '+' : ''}${f.raw.toFixed(1)}`).join('\n')}

**Write a 3-4 sentence professional analyst-style prediction reasoning that:**
1. States the pick and win probability upfront
2. Highlights 2-3 key factors from the analysis
3. Uses concrete numbers from the statistics
4. Sounds natural and engaging, like an ESPN analyst
5. Is informative but concise

**Style guidelines:**
- Write in present tense
- Be confident but not overstating certainty
- Use analyst language: "edge," "advantage," "matchup," "trendy," etc.
- Include specific statistics to support claims
- NO generic phrases - be specific to this matchup
- Keep it under 100 words

Write ONLY the prediction reasoning, no preamble or extra commentary:`;

    return prompt;
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
