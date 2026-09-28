import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  ArrowRight,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { statsService, planService } from '../services/api';

export default function WhatIfSimulator() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [error, setError] = useState(null);

  // Hypothetical controls
  const [hypoDeadline, setHypoDeadline] = useState('');
  const [hypoDailyHours, setHypoDailyHours] = useState(2.0);
  const [hypoBufferDays, setHypoBufferDays] = useState(3);
  const [scenarioPreset, setScenarioPreset] = useState('custom');

  useEffect(() => {
    statsService.getDashboard().then(res => {
      setData(res);
      if (res.hasActiveGoal && res.goal?.deadline) {
        setHypoDeadline(res.goal.deadline);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleApplyPreset = (preset) => {
    setScenarioPreset(preset);
    if (!data?.goal?.deadline) return;

    const baseDeadline = new Date(data.goal.deadline);

    if (preset === 'tight-time') {
      setHypoDailyHours(1.0);
    } else if (preset === 'accelerate') {
      const earlier = new Date(baseDeadline);
      earlier.setDate(earlier.getDate() - 7);
      setHypoDeadline(earlier.toISOString().split('T')[0]);
      setHypoDailyHours(3.0);
    } else if (preset === 'weekend-heavy') {
      setHypoDailyHours(1.5);
    }
  };

  const handleSimulate = async () => {
    if (!data?.plan?.id) return;
    setSimulating(true);
    setError(null);
    try {
      const weeklyHours = {
        Monday: hypoDailyHours,
        Tuesday: hypoDailyHours,
        Wednesday: hypoDailyHours,
        Thursday: hypoDailyHours,
        Friday: hypoDailyHours,
        Saturday: scenarioPreset === 'weekend-heavy' ? 4.5 : hypoDailyHours,
        Sunday: scenarioPreset === 'weekend-heavy' ? 4.5 : hypoDailyHours
      };

      const res = await planService.simulateWhatIf(data.plan.id, {
        hypotheticalDeadline: hypoDeadline,
        hypotheticalWeeklyHours: weeklyHours,
        hypotheticalBufferDays: parseInt(hypoBufferDays)
      });

      setSimResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
      setError(err.response?.data?.error || err.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.hasActiveGoal) {
    return (
      <div className="max-w-md mx-auto py-20 text-center text-slate-400 text-sm">
        Please create an active goal first to run What-If simulations.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* Title */}
      <div>
        <div className="flex items-center space-x-2">
          <Sliders className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-bold text-slate-100">What-If Planning Sandbox</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Simulate hypotheticals without touching your real schedule. Test changing your daily hours, pulling your deadline earlier, or reducing buffer days to evaluate risk and feasibility.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2.5">
        {[
          { id: 'tight-time', label: 'What if I only study 1 hour/day?' },
          { id: 'accelerate', label: 'What if I finish 7 days earlier?' },
          { id: 'weekend-heavy', label: 'What if I study heavy on weekends?' },
          { id: 'custom', label: 'Custom Simulation' }
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => handleApplyPreset(p.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              scenarioPreset === p.id
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Control Sliders & Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <label className="block text-xs font-semibold text-slate-300">Hypothetical Deadline</label>
          <input
            type="date"
            value={hypoDeadline}
            onChange={(e) => setHypoDeadline(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <p className="text-[11px] text-slate-500">Current active deadline: {data.goal.deadline}</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300">Daily Study Capacity</label>
            <span className="font-mono text-xs font-bold text-indigo-400">{hypoDailyHours}h / day</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="6"
            step="0.5"
            value={hypoDailyHours}
            onChange={(e) => setHypoDailyHours(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <p className="text-[11px] text-slate-500">Adjust average study time available each day</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <label className="block text-xs font-semibold text-slate-300">Reserved Buffer Days</label>
          <select
            value={hypoBufferDays}
            onChange={(e) => setHypoBufferDays(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="0">0 Days (Extreme Risk)</option>
            <option value="1">1 Day</option>
            <option value="3">3 Days (Recommended)</option>
            <option value="5">5 Days</option>
          </select>
          <p className="text-[11px] text-slate-500">Days reserved for unexpected delays</p>
        </div>

      </div>

      {/* Run Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
        >
          {simulating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Simulating with Deterministic Solver...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Run Sandbox Simulation</span>
            </>
          )}
        </button>
      </div>

      {/* Simulation Results Card */}
      {simResult && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 animate-fadeIn">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                {simResult.deadline_met ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-rose-400" />
                )}
                <h3 className="font-bold text-slate-100 text-lg">
                  {simResult.deadline_met ? 'Feasible Plan Projected' : 'Deadline Compromised!'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">{simResult.risk_assessment}</p>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono self-start sm:self-center ${
              simResult.deadline_met
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              Projected Finish: {simResult.projected_finish_date}
            </span>
          </div>

          {/* Tradeoffs List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">Key Simulation Insights & Trade-offs:</h4>
            <div className="space-y-1.5">
              {simResult.tradeoffs.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sandbox Note */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 leading-relaxed">
            🛡️ <strong>Safety Guarantee:</strong> This simulation has not modified your live schedule. Your primary study plan remains unchanged in PostgreSQL.
          </div>

        </div>
      )}

    </div>
  );
}
