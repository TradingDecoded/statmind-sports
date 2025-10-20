// frontend/src/components/GameDetailModal.js
'use client';

import { useEffect, useState } from 'react';
import { getTeamLogo, getTeamName } from '@/utils/teamLogos';
import ConfidenceBadge from './ConfidenceBadge';

export default function GameDetailModal({ prediction, isOpen, onClose }) {
    // Add state for collapsible injury section
    const [isInjuryExpanded, setIsInjuryExpanded] = useState(false);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
            
            // Auto-expand injury section for upcoming games with injuries
            const gameDate = new Date(prediction?.date);
            const now = new Date();
            const hasInjury = prediction?.injuredPlayer && prediction?.injuredTeam;
            const isUpcoming = gameDate > now;
            
            // Expand if upcoming game with injury, collapse if finished
            setIsInjuryExpanded(hasInjury && isUpcoming);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, prediction]);

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
        isFinal,
        // Injury data
        injuredPlayer,
        injuredPosition,
        injuredTeam,
        injuryDescription,
        // Component scores
        eloScore,
        powerScore,
        situationalScore,
        matchupScore,
        recentFormScore
    } = prediction;

    const gameDate = new Date(date);
    const isHomeWinner = predictedWinner === homeTeamKey;
    const hasInjuryImpact = injuredPlayer && injuredTeam;

    // Convert probabilities
    let homeProb = parseFloat(homeWinProbability) || 0;
    let awayProb = parseFloat(awayWinProbability) || 0;
    if (homeProb < 1) homeProb = homeProb * 100;
    if (awayProb < 1) awayProb = awayProb * 100;

    // Normalize component scores
    const normalizeScore = (rawScore) => {
        if (!rawScore) return 50;
        const score = parseFloat(rawScore);
        if (isNaN(score)) return 50;
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

    // Function to highlight injury mentions in reasoning text
    const highlightInjuryMentions = (text) => {
        if (!text || !hasInjuryImpact) return text;
        
        const keywords = [
            injuredPlayer,
            injuredPosition,
            injuredTeam,
            'injury',
            'injured',
            'OUT',
            'ruled out',
            'questionable',
            'CRITICAL INJURY',
            'INJURY UPDATE'
        ].filter(Boolean);

        let highlightedText = text;
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`(${keyword})`, 'gi');
            highlightedText = highlightedText.replace(
                regex,
                '<span class="bg-yellow-500/20 text-yellow-300 font-semibold px-1 rounded">$1</span>'
            );
        });

        return highlightedText;
    };

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
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="p-6 border-b border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <img
                                src={getTeamLogo(awayTeamKey)}
                                alt={getTeamName(awayTeamKey)}
                                className="w-16 h-16 object-contain"
                            />
                            <span className="text-2xl text-slate-400">@</span>
                            <img
                                src={getTeamLogo(homeTeamKey)}
                                alt={getTeamName(homeTeamKey)}
                                className="w-16 h-16 object-contain"
                            />
                        </div>
                        <div className="text-right">
                            <p className="text-slate-400 text-sm mb-1">
                                {gameDate.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                })}
                            </p>
                            <ConfidenceBadge confidence={confidence} />
                        </div>
                    </div>

                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white mb-2">
                            {getTeamName(awayTeamKey)} vs {getTeamName(homeTeamKey)}
                        </h2>
                        <div className="inline-block bg-emerald-500/10 border border-emerald-500/30 rounded-full px-6 py-2">
                            <p className="text-emerald-400 font-semibold">
                                Predicted Winner: <span className="font-bold text-xl">{predictedWinner}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Win Probabilities */}
                <div className="p-6 bg-slate-800/30">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-center flex-1">
                            <p className="text-slate-400 text-sm mb-1">{awayTeamKey}</p>
                            <p className="text-3xl font-bold text-blue-400">{awayProb.toFixed(1)}%</p>
                        </div>
                        <div className="text-slate-500 text-2xl mx-4">VS</div>
                        <div className="text-center flex-1">
                            <p className="text-slate-400 text-sm mb-1">{homeTeamKey}</p>
                            <p className="text-3xl font-bold text-emerald-400">{homeProb.toFixed(1)}%</p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden flex">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-blue-400"
                            style={{ width: `${awayProb}%` }}
                        />
                        <div
                            className="bg-gradient-to-r from-emerald-400 to-emerald-500"
                            style={{ width: `${homeProb}%` }}
                        />
                    </div>
                </div>

                {/* 🏥 INJURY IMPACT SECTION - NEW! */}
                {hasInjuryImpact && (
                    <div className="mx-6 my-4 border-2 border-yellow-500/30 rounded-xl bg-gradient-to-br from-yellow-900/20 to-orange-900/20 overflow-hidden">
                        {/* Collapsible Header */}
                        <button
                            onClick={() => setIsInjuryExpanded(!isInjuryExpanded)}
                            className="w-full p-4 flex items-center justify-between hover:bg-yellow-500/5 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">🏥</span>
                                <div className="text-left">
                                    <h3 className="text-lg font-bold text-yellow-300 flex items-center gap-2">
                                        Injury Impact Analysis
                                        <span className="text-xs px-2 py-0.5 bg-yellow-500/20 rounded-full text-yellow-400 font-normal">
                                            Prediction Updated
                                        </span>
                                    </h3>
                                    <p className="text-slate-400 text-sm">
                                        This game's prediction was regenerated due to an injury report
                                    </p>
                                </div>
                            </div>
                            <svg
                                className={`w-6 h-6 text-yellow-400 transition-transform duration-200 ${isInjuryExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Expandable Content */}
                        {isInjuryExpanded && (
                            <div className="px-4 pb-4 space-y-4 animate-slideDown">
                                {/* Injury Details Card */}
                                <div className="bg-slate-800/50 rounded-lg p-4 border border-yellow-500/20">
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border-2 border-red-500/30">
                                            <span className="text-3xl">🚨</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-white mb-1">{injuredPlayer}</h4>
                                            <div className="flex items-center gap-3 text-sm text-slate-300 mb-2">
                                                <span className="px-2 py-0.5 bg-slate-700 rounded">{injuredPosition}</span>
                                                <span className="px-2 py-0.5 bg-slate-700 rounded">{injuredTeam}</span>
                                            </div>
                                            <p className="text-slate-400">{injuryDescription}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Impact Explanation */}
                                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                                        <span>⚡</span>
                                        How This Affects The Prediction
                                    </h4>
                                    <ul className="space-y-2 text-slate-300 text-sm">
                                        <li className="flex items-start gap-2">
                                            <span className="text-yellow-400 mt-0.5">•</span>
                                            <span>The prediction algorithm detected this key injury and automatically regenerated the forecast</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-yellow-400 mt-0.5">•</span>
                                            <span>Position-based penalties were applied based on {injuredPosition}'s impact on team performance</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-yellow-400 mt-0.5">•</span>
                                            <span>The AI reasoning below includes specific analysis of how this injury affects the matchup</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-yellow-400 mt-0.5">•</span>
                                            <span>Win probabilities and confidence levels have been adjusted accordingly</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Trust Builder */}
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                                    <p className="text-emerald-400 text-sm flex items-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-semibold">StatMind adapts to real-time injury reports</span>
                                    </p>
                                    <p className="text-slate-400 text-xs mt-1 ml-7">
                                        Our system monitors injury reports and automatically updates predictions to ensure you always have the most accurate forecasts.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Component Breakdown */}
                <div className="p-6">
                    <h3 className="text-2xl font-bold text-white mb-3 flex items-center">
                        <span className="mr-2">🎯</span>
                        Prediction Components
                    </h3>
                    <p className="text-slate-400 text-sm mb-4">
                        Scores above 50 favor the home team, below 50 favor the away team.
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

                {/* Detailed Analysis with Injury Highlighting */}
                {reasoning && (
                    <div className="p-6">
                        <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                            <span className="mr-2">📝</span>
                            Detailed Analysis
                            {hasInjuryImpact && (
                                <span className="ml-3 text-xs px-2 py-1 bg-yellow-500/20 rounded-full text-yellow-400 font-normal">
                                    🏥 Includes Injury Context
                                </span>
                            )}
                        </h3>
                        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                            <p 
                                className="text-slate-300 leading-relaxed whitespace-pre-line"
                                dangerouslySetInnerHTML={{ 
                                    __html: hasInjuryImpact ? highlightInjuryMentions(reasoning) : reasoning 
                                }}
                            />
                        </div>
                        {hasInjuryImpact && (
                            <p className="text-yellow-400/70 text-xs mt-2 flex items-center gap-1">
                                <span>💡</span>
                                <span>Highlighted text indicates injury-related analysis</span>
                            </p>
                        )}
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