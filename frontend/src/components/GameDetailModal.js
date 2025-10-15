// frontend/src/components/GameDetailModal.js
'use client';

import { useEffect } from 'react';
import { getTeamLogo, getTeamName } from '@/utils/teamLogos';
import ConfidenceBadge from './ConfidenceBadge';

export default function GameDetailModal({ prediction, isOpen, onClose }) {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !prediction) return null;

    const {
        homeTeamKey,
        awayTeamKey,
        predictedWinner,
        confidence,
        homeWinProbability,
        awayWinProbability,
        date,
        reasoning,
        // These come from your API
        eloScore,
        powerScore,
        situationalScore,
        matchupScore,
        recentFormScore
    } = prediction;

    // ADD THIS LINE TO DEBUG:
    console.log('Modal received prediction:', { eloScore, powerScore, situationalScore, matchupScore, recentFormScore });

    const gameDate = new Date(date);
    const isHomeWinner = predictedWinner === homeTeamKey;

    // Convert probabilities
    let homeProb = parseFloat(homeWinProbability) || 0;
    let awayProb = parseFloat(awayWinProbability) || 0;
    if (homeProb < 1) homeProb = homeProb * 100;
    if (awayProb < 1) awayProb = awayProb * 100;

    // Component data
    // Convert raw scores (-100 to +100) to percentage (0-100) where 50 is neutral
    const normalizeScore = (rawScore) => {
        if (!rawScore) return 50;
        const score = parseFloat(rawScore);  // This converts string to number
        if (isNaN(score)) return 50;  // Safety check
        // Raw scores typically range from -50 to +50
        // Convert to 0-100 scale where 50 is neutral
        return Math.max(0, Math.min(100, 50 + score));
    };

    const components = [
        {
            name: 'Elo Rating',
            score: normalizeScore(eloScore),
            description: 'Historical team strength based on wins/losses',
            icon: '📊'
        },
        {
            name: 'Power Rankings',
            score: normalizeScore(powerScore),
            description: 'Overall team quality and performance metrics',
            icon: '💪'
        },
        {
            name: 'Situational',
            score: normalizeScore(situationalScore),
            description: 'Rest days, travel distance, home field advantage',
            icon: '🏠'
        },
        {
            name: 'Matchup Analysis',
            score: normalizeScore(matchupScore),
            description: 'Offense vs defense strengths and weaknesses',
            icon: '⚔️'
        },
        {
            name: 'Recent Form',
            score: normalizeScore(recentFormScore),
            description: 'Last 5 games performance and momentum',
            icon: '📈'
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
                    aria-label="Close modal"
                >
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 border-b border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-slate-400 text-sm mb-1">
                                {gameDate.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </p>
                            <h2 className="text-3xl font-bold text-white">Game Prediction Analysis</h2>
                        </div>
                        <ConfidenceBadge confidence={confidence} />
                    </div>

                    {/* Teams Display */}
                    <div className="flex items-center justify-between mt-6">
                        {/* Away Team */}
                        <div className={`flex items-center space-x-4 transition-opacity ${!isHomeWinner ? 'opacity-100' : 'opacity-60'}`}>
                            <img
                                src={getTeamLogo(awayTeamKey)}
                                alt={getTeamName(awayTeamKey)}
                                className="w-20 h-20 object-contain"
                            />
                            <div>
                                <p className="text-white font-bold text-2xl">{awayTeamKey}</p>
                                <p className="text-slate-300 text-lg">{getTeamName(awayTeamKey)}</p>
                                <p className="text-slate-400 text-sm mt-1">{awayProb.toFixed(1)}% Win Probability</p>
                            </div>
                        </div>

                        {/* VS Badge */}
                        <div className="flex flex-col items-center">
                            <div className="bg-slate-800 rounded-full px-6 py-2 border border-slate-600">
                                <span className="text-slate-400 font-bold text-lg">VS</span>
                            </div>
                        </div>

                        {/* Home Team */}
                        <div className={`flex items-center space-x-4 transition-opacity ${isHomeWinner ? 'opacity-100' : 'opacity-60'}`}>
                            <div className="text-right">
                                <p className="text-white font-bold text-2xl">{homeTeamKey}</p>
                                <p className="text-slate-300 text-lg">{getTeamName(homeTeamKey)}</p>
                                <p className="text-slate-400 text-sm mt-1">{homeProb.toFixed(1)}% Win Probability</p>
                            </div>
                            <img
                                src={getTeamLogo(homeTeamKey)}
                                alt={getTeamName(homeTeamKey)}
                                className="w-20 h-20 object-contain"
                            />
                        </div>
                    </div>

                    {/* Probability Bar */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                            <span>{awayTeamKey}</span>
                            <span>{homeTeamKey}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden flex">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-1000 flex items-center justify-center text-white text-xs font-bold"
                                style={{ width: `${awayProb}%` }}
                            >
                                {awayProb > 15 && `${awayProb.toFixed(1)}%`}
                            </div>
                            <div
                                className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000 flex items-center justify-center text-white text-xs font-bold"
                                style={{ width: `${homeProb}%` }}
                            >
                                {homeProb > 15 && `${homeProb.toFixed(1)}%`}
                            </div>
                        </div>
                    </div>

                    {/* Predicted Winner Banner */}
                    <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                        <p className="text-emerald-400 font-semibold">
                            🎯 Predicted Winner: <span className="text-emerald-300 font-bold text-xl">{predictedWinner}</span>
                        </p>
                    </div>
                </div>

                {/* Component Breakdown Section */}
                <div className="p-6 border-b border-slate-700">
                    <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                        <span className="mr-2">🧮</span>
                        5-Component Algorithm Breakdown
                    </h3>
                    <p className="text-slate-400 mb-6">
                        Each component contributes to the final prediction. Scores above 50 favor the home team, below 50 favor the away team.
                    </p>

                    <div className="space-y-4">
                        {components.map((component, idx) => {
                            const score = component.score;
                            const homeAdvantage = score >= 50;
                            const advantageTeam = homeAdvantage ? homeTeamKey : awayTeamKey;
                            const scoreDiff = Math.abs(score - 50);

                            return (
                                <div key={idx} className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                            <span className="text-2xl mr-3">{component.icon}</span>
                                            <div>
                                                <h4 className="text-white font-semibold">{component.name}</h4>
                                                <p className="text-slate-400 text-sm">{component.description}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-emerald-400 font-bold text-lg">{score.toFixed(1)}</p>
                                            <p className="text-slate-500 text-xs">Score</p>
                                        </div>
                                    </div>

                                    {/* Visual Bar */}
                                    <div className="relative mt-3">
                                        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${homeAdvantage
                                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 ml-auto'
                                                    : 'bg-gradient-to-l from-blue-400 to-blue-500'
                                                    }`}
                                                style={{ width: `${scoreDiff * 2}%` }}
                                            />
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-0.5 h-5 bg-slate-400" />
                                        </div>
                                    </div>

                                    <p className="text-slate-400 text-sm mt-2 text-center">
                                        Favors <span className="text-white font-semibold">{advantageTeam}</span> by {scoreDiff.toFixed(1)} points
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Detailed Analysis Section */}
                {reasoning && (
                    <div className="p-6">
                        <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                            <span className="mr-2">📝</span>
                            Detailed Analysis
                        </h3>
                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                            <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                                {reasoning}
                            </p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-6 bg-slate-800/50 border-t border-slate-700">
                    <p className="text-slate-400 text-sm text-center">
                        This analysis combines historical data, current form, and statistical models to generate predictions.
                        Past performance: <span className="text-emerald-400 font-semibold">79.7% accuracy</span> in 2024 season.
                    </p>
                </div>
            </div>
        </div>
    );
}