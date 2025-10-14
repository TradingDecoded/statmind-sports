// frontend/src/app/about/page.js

export const metadata = {
  title: "About StatMind Sports - Our Story",
  description: "Built by a data scientist passionate about NFL analytics. StatMind Sports combines advanced algorithms with transparent results to deliver 79.7% accurate predictions.",
  keywords: ["about StatMind", "NFL analytics platform", "sports prediction company", "data science NFL"],
  openGraph: {
    title: "About StatMind Sports - Our Story | StatMind Sports",
    description: "Learn about the data science and passion behind StatMind's 79.7% accurate NFL predictions.",
    url: "https://statmindsports.com/about",
    type: "website",
    images: [
      {
        url: "/og-about.jpg",
        width: 1200,
        height: 630,
        alt: "About StatMind Sports",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About StatMind Sports",
    description: "Data science and passion behind 79.7% accurate NFL predictions.",
    images: ["/twitter-about.jpg"],
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            About StatMind Sports
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 leading-relaxed">
            Accurate, transparent, and data-driven NFL predictions you can trust.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800 rounded-2xl p-8 md:p-12 shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
            <div className="space-y-4 text-slate-300 text-lg leading-relaxed">
              <p>
                StatMind Sports was born from a simple question: <strong className="text-white">Can we predict NFL games better than the "experts"?</strong>
              </p>
              <p>
                After analyzing thousands of games and testing countless statistical models, we developed a prediction algorithm that achieved <strong className="text-blue-400">79.7% accuracy</strong> on the 2024 NFL season—far above industry averages.
              </p>
              <p>
                But accuracy alone isn't enough. We believe in <strong className="text-white">transparency</strong>. Every prediction we make is recorded, tracked, and displayed—wins and losses alike. No cherry-picking. No hiding. Just honest, data-driven insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Big Number */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-7xl md:text-8xl font-bold text-white mb-4">
            79.7%
          </div>
          <div className="text-2xl md:text-3xl text-blue-100 font-semibold">
            Accuracy on 2024 NFL Season
          </div>
          <div className="text-lg text-blue-200 mt-4">
            204 correct predictions out of 256 games
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            What Makes Us Different
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Value 1 */}
            <div className="bg-slate-800 rounded-xl p-8 hover:bg-slate-750 transition">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-white mb-4">Accuracy First</h3>
              <p className="text-slate-300 leading-relaxed">
                We prioritize correct predictions over hype. Our 5-component algorithm is battle-tested and continuously refined.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-slate-800 rounded-xl p-8 hover:bg-slate-750 transition">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-white mb-4">Full Transparency</h3>
              <p className="text-slate-300 leading-relaxed">
                Every prediction is tracked and displayed. We show you our methodology, reasoning, and complete historical performance.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-slate-800 rounded-xl p-8 hover:bg-slate-750 transition">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold text-white mb-4">Always Current</h3>
              <p className="text-slate-300 leading-relaxed">
                Automated systems update predictions daily. Fresh data, fresh insights, no manual delays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (Brief) */}
      <section className="py-16 px-4 bg-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Our 5-Component System
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Elo Rating (25%)</h3>
                <p className="text-slate-300">Chess-inspired system that updates after every game based on performance.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Power Rating (25%)</h3>
                <p className="text-slate-300">Season-long performance metrics including points scored/allowed.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Situational Factors (20%)</h3>
                <p className="text-slate-300">Home-field advantage, travel, rest days, and division rivalries.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Head-to-Head (15%)</h3>
                <p className="text-slate-300">Historical matchup data and team-specific tendencies.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                5
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Recent Form (15%)</h3>
                <p className="text-slate-300">Last 3 games performance to capture momentum and trends.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <a 
              href="/how-it-works" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Learn More About Our Methodology →
            </a>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Our Mission</h2>
          <p className="text-xl text-slate-300 leading-relaxed">
            To provide sports fans with <strong className="text-white">accurate, transparent, and actionable</strong> NFL predictions through proven statistical methods and complete performance tracking.
          </p>
          <p className="text-lg text-slate-400 mt-6">
            No black boxes. No hidden agendas. Just data-driven insights you can trust.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to See Our Predictions?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of fans who trust StatMind Sports for accurate NFL insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/predictions" 
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 px-8 rounded-lg transition"
            >
              View This Week's Predictions
            </a>
            <a 
              href="/accuracy" 
              className="bg-blue-800 text-white hover:bg-blue-900 font-bold py-4 px-8 rounded-lg transition border-2 border-white"
            >
              See Our Track Record
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}