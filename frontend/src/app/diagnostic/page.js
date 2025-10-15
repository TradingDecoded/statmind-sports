// frontend/src/app/diagnostic/page.js
'use client';

import { useState, useEffect } from 'react';

export default function DiagnosticPage() {
  const [results, setResults] = useState({
    apiUrl: '',
    backendDirect: null,
    publicApi: null,
    upcomingPredictions: null,
    week7Predictions: null,
    errors: {},
    timestamp: null
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runComprehensiveDiagnostics();
  }, []);

  const runComprehensiveDiagnostics = async () => {
    setLoading(true);
    const timestamp = new Date().toISOString();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'NOT SET';
    const errors = {};
    
    console.log('🔍 Starting diagnostics...');
    console.log('API URL:', apiUrl);
    
    // Test 1: Direct backend (if accessible)
    let backendDirect = null;
    try {
      console.log('Testing: http://localhost:4000/api/predictions/week/2025/7');
      const res = await fetch('http://localhost:4000/api/predictions/week/2025/7', {
        cache: 'no-store'
      });
      backendDirect = await res.json();
      console.log('✅ Direct backend test:', backendDirect);
    } catch (error) {
      errors.backendDirect = error.message;
      console.error('❌ Direct backend test failed:', error);
    }

    // Test 2: Public API through reverse proxy
    let publicApi = null;
    try {
      console.log('Testing: https://statmindsports.com/api/predictions/week/2025/7');
      const res = await fetch('https://statmindsports.com/api/predictions/week/2025/7', {
        cache: 'no-store'
      });
      publicApi = await res.json();
      console.log('✅ Public API test:', publicApi);
    } catch (error) {
      errors.publicApi = error.message;
      console.error('❌ Public API test failed:', error);
    }

    // Test 3: Using API utility (upcoming)
    let upcomingPredictions = null;
    try {
      console.log('Testing: Upcoming predictions via utility');
      const res = await fetch(`${apiUrl}/predictions/upcoming?limit=5`, {
        cache: 'no-store'
      });
      upcomingPredictions = await res.json();
      console.log('✅ Upcoming predictions:', upcomingPredictions);
    } catch (error) {
      errors.upcomingPredictions = error.message;
      console.error('❌ Upcoming predictions failed:', error);
    }

    // Test 4: Week 7 predictions via configured API
    let week7Predictions = null;
    try {
      console.log(`Testing: ${apiUrl}/predictions/week/2025/7`);
      const res = await fetch(`${apiUrl}/predictions/week/2025/7`, {
        cache: 'no-store'
      });
      week7Predictions = await res.json();
      console.log('✅ Week 7 predictions:', week7Predictions);
    } catch (error) {
      errors.week7Predictions = error.message;
      console.error('❌ Week 7 predictions failed:', error);
    }

    setResults({
      apiUrl,
      backendDirect,
      publicApi,
      upcomingPredictions,
      week7Predictions,
      errors,
      timestamp
    });
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <div className="text-white text-2xl font-bold mb-2">Running Diagnostics...</div>
          <div className="text-slate-400">Testing all API endpoints</div>
        </div>
      </div>
    );
  }

  const { apiUrl, backendDirect, publicApi, upcomingPredictions, week7Predictions, errors, timestamp } = results;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🔍 System Diagnostics</h1>
          <p className="text-slate-400">Complete API connectivity test</p>
          <p className="text-slate-500 text-sm mt-2">Timestamp: {timestamp}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard 
            title="Backend Direct" 
            status={backendDirect ? 'success' : 'error'}
            count={backendDirect?.count || 0}
            error={errors.backendDirect}
          />
          <SummaryCard 
            title="Public API" 
            status={publicApi ? 'success' : 'error'}
            count={publicApi?.count || 0}
            error={errors.publicApi}
          />
          <SummaryCard 
            title="Upcoming" 
            status={upcomingPredictions ? 'success' : 'error'}
            count={upcomingPredictions?.count || 0}
            error={errors.upcomingPredictions}
          />
          <SummaryCard 
            title="Week 7 via Config" 
            status={week7Predictions ? 'success' : 'error'}
            count={week7Predictions?.count || 0}
            error={errors.week7Predictions}
          />
        </div>

        {/* Configuration */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            ⚙️ Configuration
          </h2>
          <div className="space-y-2">
            <ConfigRow label="API URL" value={apiUrl} />
            <ConfigRow label="Window Location" value={typeof window !== 'undefined' ? window.location.href : 'N/A'} />
            <ConfigRow label="User Agent" value={typeof window !== 'undefined' ? navigator.userAgent : 'N/A'} />
          </div>
        </div>

        {/* Detailed Results */}
        <div className="space-y-6">
          <DetailedResult 
            title="1. Direct Backend (localhost:4000)" 
            data={backendDirect}
            error={errors.backendDirect}
            url="http://localhost:4000/api/predictions/week/2025/7"
          />
          
          <DetailedResult 
            title="2. Public API (statmindsports.com)" 
            data={publicApi}
            error={errors.publicApi}
            url="https://statmindsports.com/api/predictions/week/2025/7"
          />
          
          <DetailedResult 
            title="3. Upcoming Predictions" 
            data={upcomingPredictions}
            error={errors.upcomingPredictions}
            url={`${apiUrl}/predictions/upcoming?limit=5`}
          />
          
          <DetailedResult 
            title="4. Week 7 via Configured URL" 
            data={week7Predictions}
            error={errors.week7Predictions}
            url={`${apiUrl}/predictions/week/2025/7`}
          />
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={runComprehensiveDiagnostics}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            🔄 Run Tests Again
          </button>
          <button
            onClick={() => window.location.href = '/predictions'}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            📊 Go to Predictions
          </button>
        </div>

        {/* Troubleshooting Guide */}
        <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-bold mb-4">🔧 Troubleshooting Guide</h2>
          <div className="space-y-4 text-slate-300">
            <TroubleshootingItem 
              condition={!publicApi && !errors.publicApi}
              issue="Public API returns no data but no error"
              solution="The API might be returning empty results. Check backend logs: pm2 logs statmind-backend"
            />
            <TroubleshootingItem 
              condition={errors.publicApi}
              issue="Public API connection failed"
              solution="Check reverse proxy configuration in /etc/nginx/sites-available/statmindsports.com"
            />
            <TroubleshootingItem 
              condition={publicApi?.count === 0}
              issue="API returns 0 predictions"
              solution="Run: node /root/statmind-sports/src/scripts/generatePredictions.js"
            />
            <TroubleshootingItem 
              condition={apiUrl === 'NOT SET'}
              issue="API URL not configured"
              solution="Create frontend/.env.local with NEXT_PUBLIC_API_URL=https://statmindsports.com/api"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, status, count, error }) {
  const statusColors = {
    success: 'border-green-500 bg-green-500/10',
    error: 'border-red-500 bg-red-500/10',
    warning: 'border-yellow-500 bg-yellow-500/10'
  };
  
  const statusIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };

  return (
    <div className={`rounded-lg p-4 border-2 ${statusColors[status]}`}>
      <div className="text-2xl mb-2">{statusIcons[status]}</div>
      <div className="text-sm text-slate-400 mb-1">{title}</div>
      <div className="text-2xl font-bold">
        {error ? 'Failed' : `${count} predictions`}
      </div>
      {error && (
        <div className="text-xs text-red-400 mt-2 truncate">{error}</div>
      )}
    </div>
  );
}

function ConfigRow({ label, value }) {
  return (
    <div className="flex items-start">
      <div className="w-40 text-slate-400 font-semibold">{label}:</div>
      <div className="flex-1 text-white font-mono text-sm break-all">{value}</div>
    </div>
  );
}

function DetailedResult({ title, data, error, url }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left hover:bg-slate-750 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {error ? '❌' : data ? '✅' : '⚠️'}
            </div>
            <div>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-sm text-slate-400 mt-1">{url}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {data && (
              <div className="text-right">
                <div className="text-sm text-slate-400">Count</div>
                <div className="text-2xl font-bold text-emerald-400">{data.count || 0}</div>
              </div>
            )}
            <svg 
              className={`w-6 h-6 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>
      
      {isExpanded && (
        <div className="border-t border-slate-700 p-6">
          {error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="font-bold text-red-400 mb-2">Error:</div>
              <div className="text-red-300">{error}</div>
            </div>
          ) : data ? (
            <>
              {data.predictions && data.predictions.length > 0 && (
                <div className="mb-4">
                  <div className="font-bold text-emerald-400 mb-2">Sample Prediction:</div>
                  <div className="bg-slate-900 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-slate-400">Home Team:</div>
                      <div className="font-mono">{data.predictions[0].homeTeamKey || 'N/A'}</div>
                      <div className="text-slate-400">Away Team:</div>
                      <div className="font-mono">{data.predictions[0].awayTeamKey || 'N/A'}</div>
                      <div className="text-slate-400">Predicted Winner:</div>
                      <div className="font-mono">{data.predictions[0].predictedWinner || 'N/A'}</div>
                      <div className="text-slate-400">Confidence:</div>
                      <div className="font-mono">{data.predictions[0].confidence || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}
              <details className="mt-4">
                <summary className="cursor-pointer text-slate-400 hover:text-white">
                  View Full Response JSON
                </summary>
                <pre className="mt-2 bg-slate-900 p-4 rounded-lg overflow-auto text-xs">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </details>
            </>
          ) : (
            <div className="text-slate-400">No data received</div>
          )}
        </div>
      )}
    </div>
  );
}

function TroubleshootingItem({ condition, issue, solution }) {
  if (!condition) return null;
  
  return (
    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
      <div className="font-bold text-yellow-400 mb-2">⚠️ {issue}</div>
      <div className="text-sm text-slate-300">
        <strong>Solution:</strong> {solution}
      </div>
    </div>
  );
}