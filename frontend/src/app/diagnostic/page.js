// frontend/src/app/diagnostic/page.js

export const metadata = {
  title: "System Diagnostics",
  description: "StatMind Sports system health and API diagnostics.",
  robots: {
    index: false,
    follow: false,
  },
};

'use client';

import { useState, useEffect } from 'react';

export default function DiagnosticPage() {
  const [status, setStatus] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://statmindsports.com/api';
    
    // Test 1: Backend Status
    try {
      const statusRes = await fetch(`${apiBase}/status`);
      const statusData = await statusRes.json();
      setStatus(statusData);
    } catch (error) {
      setErrors(prev => ({ ...prev, status: error.message }));
    }

    // Test 2: Upcoming Predictions
    try {
      const predRes = await fetch(`${apiBase}/predictions/upcoming?limit=5`);
      const predData = await predRes.json();
      setPredictions(predData);
    } catch (error) {
      setErrors(prev => ({ ...prev, predictions: error.message }));
    }

    // Test 3: Historical Accuracy
    try {
      const accRes = await fetch(`${apiBase}/predictions/accuracy/historical`);
      const accData = await accRes.json();
      setAccuracy(accData);
    } catch (error) {
      setErrors(prev => ({ ...prev, accuracy: error.message }));
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Running Diagnostics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🔍 System Diagnostics</h1>
        
        {/* Backend Status */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">
            {errors.status ? '❌' : '✅'} Backend Status
          </h2>
          {errors.status ? (
            <div className="text-red-400">Error: {errors.status}</div>
          ) : (
            <pre className="bg-slate-900 p-4 rounded overflow-auto">
              {JSON.stringify(status, null, 2)}
            </pre>
          )}
        </div>

        {/* Predictions Test */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">
            {errors.predictions ? '❌' : '✅'} Predictions API
          </h2>
          {errors.predictions ? (
            <div className="text-red-400">Error: {errors.predictions}</div>
          ) : (
            <>
              <div className="mb-4">
                <strong>Found:</strong> {predictions?.predictions?.length || 0} predictions
              </div>
              <pre className="bg-slate-900 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(predictions, null, 2)}
              </pre>
            </>
          )}
        </div>

        {/* Accuracy Test */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">
            {errors.accuracy ? '❌' : '✅'} Accuracy API
          </h2>
          {errors.accuracy ? (
            <div className="text-red-400">Error: {errors.accuracy}</div>
          ) : (
            <>
              <div className="mb-4">
                <strong>Overall Accuracy:</strong> {accuracy?.overall?.accuracy_percentage}%
              </div>
              <pre className="bg-slate-900 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(accuracy, null, 2)}
              </pre>
            </>
          )}
        </div>

        {/* Summary */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">📊 Summary</h2>
          <div className="space-y-2">
            <div className={errors.status ? 'text-red-400' : 'text-green-400'}>
              Backend: {errors.status ? 'Failed' : 'Healthy'}
            </div>
            <div className={errors.predictions ? 'text-red-400' : 'text-green-400'}>
              Predictions: {errors.predictions ? 'Failed' : `${predictions?.predictions?.length || 0} loaded`}
            </div>
            <div className={errors.accuracy ? 'text-red-400' : 'text-green-400'}>
              Accuracy: {errors.accuracy ? 'Failed' : 'Loaded'}
            </div>
          </div>
        </div>

        <button
          onClick={runDiagnostics}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
        >
          🔄 Run Tests Again
        </button>
      </div>
    </div>
  );
}