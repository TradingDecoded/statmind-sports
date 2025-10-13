"use client";

import { useEffect, useState } from "react";
import { fetchCurrentWeekPredictions } from "../../utils/api";

export default function HomePage() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPredictions() {
      const data = await fetchCurrentWeekPredictions();
      setPredictions(data);
      setLoading(false);
    }
    loadPredictions();
  }, []);

  if (loading)
    return (
      <p className="text-center mt-20 text-gray-300">Loading predictions...</p>
    );

  return (
    <main className="p-6 max-w-5xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-6 text-center">
        StatMind Sports — Week 7 Predictions
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {predictions.map((p) => (
          <div key={p.gameId} className="bg-gray-800 p-4 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-2">
              {p.homeTeamKey} vs {p.awayTeamKey}
            </h2>
            <p>
              <strong>Predicted Winner:</strong> {p.predictedWinner}
            </p>
            <p>
              <strong>Confidence:</strong> {p.confidence}
            </p>
            <p>
              <strong>Home Win Probability:</strong>{" "}
              {(parseFloat(p.homeWinProbability) * 100).toFixed(1)}%
            </p>
            <p>
              <strong>Away Win Probability:</strong>{" "}
              {(parseFloat(p.awayWinProbability) * 100).toFixed(1)}%
            </p>
            <p className="italic text-sm mt-2 text-gray-400">
              {p.reasoning}
            </p>
          </div>
        ))}

      </div>
    </main>
  );
}
