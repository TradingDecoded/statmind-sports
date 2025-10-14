// frontend/src/app/how-it-works/page.js

export const metadata = {
  title: "How Our 5-Component Algorithm Works",
  description: "Learn how StatMind achieves 79.7% accuracy using a proven 5-component methodology: Elo ratings, rest analysis, weather impact, home advantage, and strength of schedule.",
  keywords: ["NFL prediction algorithm", "sports analytics methodology", "Elo rating system", "NFL data science", "prediction model"],
  openGraph: {
    title: "How Our 5-Component Algorithm Works | StatMind Sports",
    description: "Learn how we achieve 79.7% accuracy with our proven 5-component methodology for NFL predictions.",
    url: "https://statmindsports.com/how-it-works",
    type: "website",
    images: [
      {
        url: "/og-how-it-works.jpg",
        width: 1200,
        height: 630,
        alt: "StatMind Sports Methodology",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "How Our 5-Component Algorithm Works",
    description: "Learn the methodology behind 79.7% accuracy in NFL predictions.",
    images: ["/twitter-how-it-works.jpg"],
  },
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
            <span className="text-emerald-400 text-sm font-semibold">79.7% Accuracy in 2024</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            How StatMind Works
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Our prediction system combines five powerful data science components to deliver consistently accurate NFL game predictions.
          </p>
        </div>
      </section>

      {/* The 5 Components Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            The 5-Component Methodology
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Component 1 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-emerald-400">Elo Rating System</h3>
              <p className="text-slate-300 mb-4">
                Every team receives a dynamic rating that adjusts after each game. Strong teams gain more points, while upset victories create bigger rating swings.
              </p>
              <div className="text-sm text-slate-400 space-y-2">
                <div className="flex items-start">
                  <span className="text-emerald-400 mr-2">•</span>
                  <span>Tracks team strength over time</span>
                </div>
                <div className="flex items-start">
                  <span className="text-emerald-400 mr-2">•</span>
                  <span>Accounts for margin of victory</span>
                </div>
                <div className="flex items-start">
                  <span className="text-emerald-400 mr-2">•</span>
                  <span>Rewards quality wins</span>
                </div>
              </div>
            </div>

            {/* Component 2 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-blue-400">Power Ranking Score</h3>
              <p className="text-slate-300 mb-4">
                An advanced metric that evaluates overall team performance by analyzing offensive and defensive efficiency, consistency, and recent form.
              </p>
              <div className="text-sm text-slate-400 space-y-2">
                <div className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Measures offensive strength</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Evaluates defensive capability</span>
                </div>
                <div className="flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  <span>Considers recent performance</span>
                </div>
              </div>
            </div>

            {/* Component 3 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-purple-400">Home Field Advantage</h3>
              <p className="text-slate-300 mb-4">
                Quantifies the statistical boost teams receive when playing at home, adjusted for venue-specific factors and historical performance.
              </p>
              <div className="text-sm text-slate-400 space-y-2">
                <div className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Stadium-specific adjustments</span>
                </div>
                <div className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Historical venue data</span>
                </div>
                <div className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Travel distance factors</span>
                </div>
              </div>
            </div>

            {/* Component 4 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">4</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-orange-400">Rest Differential</h3>
              <p className="text-slate-300 mb-4">
                Analyzes the impact of rest days between games, accounting for recovery time and competitive advantage from bye weeks or extended rest.
              </p>
              <div className="text-sm text-slate-400 space-y-2">
                <div className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span>Days of rest calculation</span>
                </div>
                <div className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span>Bye week advantages</span>
                </div>
                <div className="flex items-start">
                  <span className="text-orange-400 mr-2">•</span>
                  <span>Thursday/Monday adjustments</span>
                </div>
              </div>
            </div>

            {/* Component 5 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-emerald-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">5</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-yellow-400">Division Rivalry Factor</h3>
              <p className="text-slate-300 mb-4">
                Captures the unique dynamics of divisional matchups, where familiarity and rivalry history often lead to closer, more unpredictable games.
              </p>
              <div className="text-sm text-slate-400 space-y-2">
                <div className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span>Head-to-head history</span>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span>Divisional familiarity</span>
                </div>
                <div className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  <span>Competitive balance</span>
                </div>
              </div>
            </div>

            {/* Final Component - Weighted Algorithm */}
            <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-xl p-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-emerald-400">Weighted Algorithm</h3>
              <p className="text-slate-300 mb-4">
                All five components are combined using a proprietary weighting system that has been optimized through extensive backtesting to achieve maximum accuracy.
              </p>
              <div className="text-sm text-slate-400">
                Each factor contributes to the final prediction, with relative importance determined by historical performance data.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How Predictions Are Made Section */}
      <section className="py-16 px-4 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            From Data to Prediction
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-center">
                <span className="text-emerald-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-white">Data Collection</h3>
                <p className="text-slate-300">
                  We continuously gather data from every NFL game, including scores, team statistics, venue information, and schedule details.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center">
                <span className="text-blue-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-white">Component Calculation</h3>
                <p className="text-slate-300">
                  Each of the five components is calculated independently for every matchup, producing individual scores for Elo ratings, power rankings, home field, rest, and rivalry factors.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-center">
                <span className="text-purple-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-white">Weighted Integration</h3>
                <p className="text-slate-300">
                  The five component scores are combined using our proprietary weighting system to generate a single composite score for each team in the matchup.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-center justify-center">
                <span className="text-orange-400 font-bold">4</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-white">Win Probability</h3>
                <p className="text-slate-300">
                  The composite scores are converted into win probabilities for each team. A larger score difference indicates a more confident prediction.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center justify-center">
                <span className="text-yellow-400 font-bold">5</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-white">Confidence Classification</h3>
                <p className="text-slate-300">
                  Based on the win probability margin, each prediction is classified as High Confidence (65%+), Medium Confidence (55-65%), or Low Confidence (&lt;55%).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Works Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Our Approach Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Data-Driven</h3>
              <p className="text-slate-300">
                Every prediction is based on quantitative analysis of real game data, not subjective opinions or gut feelings.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Continuously Updated</h3>
              <p className="text-slate-300">
                Team ratings and metrics update after every game, ensuring predictions reflect the most current team performance.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Backtested & Proven</h3>
              <p className="text-slate-300">
                Our methodology achieved 79.7% accuracy on the entire 2024 NFL season, demonstrating consistent performance.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Multi-Factor Analysis</h3>
              <p className="text-slate-300">
                Combining five distinct components provides a more complete picture than any single metric could achieve alone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-slate-900/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-3 text-emerald-400">
                How accurate are your predictions?
              </h3>
              <p className="text-slate-300">
                Our system achieved 79.7% accuracy on all 256 games during the 2024 NFL season, correctly predicting 204 games. This performance is significantly above random chance and demonstrates the reliability of our methodology.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-3 text-emerald-400">
                Do you consider injuries or weather?
              </h3>
              <p className="text-slate-300">
                Currently, our model focuses on team-level performance metrics rather than individual player data or weather conditions. This approach maintains consistency and avoids introducing subjective assessments. Future versions may incorporate additional factors.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-3 text-emerald-400">
                When are predictions updated?
              </h3>
              <p className="text-slate-300">
                Predictions for upcoming games are generated continuously as team ratings update after each completed game. You'll always see predictions based on the most recent data available.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-3 text-emerald-400">
                What do the confidence levels mean?
              </h3>
              <p className="text-slate-300">
                High Confidence predictions have win probabilities of 65% or higher, Medium Confidence ranges from 55-65%, and Low Confidence is below 55%. Higher confidence generally means a clearer favorite based on our analysis.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-3 text-emerald-400">
                Can I use these for betting?
              </h3>
              <p className="text-slate-300">
                StatMind predictions are provided for informational and entertainment purposes only. We do not endorse or encourage sports betting. Always gamble responsibly and within your means if you choose to bet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border-y border-emerald-500/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to see our predictions?
          </h2>
          <p className="text-slate-300 text-lg mb-8">
            Check out this week's NFL predictions powered by our 5-component algorithm.
          </p>
          <a 
            href="/predictions"
            className="inline-flex items-center px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/50"
          >
            View Predictions
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}