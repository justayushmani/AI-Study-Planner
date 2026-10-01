import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  Sparkles, 
  TriangleAlert, 
  ShieldAlert, 
  ShieldCheck, 
  CalendarDays, 
  Clock, 
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Cpu
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
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono tracking-tight">INITIALIZING SIMULATION ENVIRONMENT...</p>
        </div>
      </div>
    );
  }

  if (!data?.hasActiveGoal) {
    return (
      <div className="max-w-md mx-auto py-20 text-center text-slate-400 text-xs font-mono">
        INITIALIZE ACTIVE GOAL FIRST TO EXECUTE WHAT-IF SIMULATIONS.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      
      {/* Title */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center text-violet-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 font-mono tracking-tight">WHAT-IF PLANNING SANDBOX</h1>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          Simulate hypotheticals without modifying your live database schedule. Test changing daily capacity, pulling deadlines forward, or reducing buffer margins.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#080B10] border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <TriangleAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'tight-time', label: '1 hour/day study capacity' },
          { id: 'accelerate', label: 'Finish 7 days earlier' },
          { id: 'weekend-heavy', label: 'Weekend-heavy distribution' },
          { id: 'custom', label: 'Custom Parameters' }
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => handleApplyPreset(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
              scenarioPreset === p.id
                ? 'bg-[#7C3AED]/20 border-[#7C3AED]/50 text-violet-200 shadow-[0_0_10px_rgba(124,58,237,0.15)]'
                : 'bg-[#080B10] border-[#1A2330] text-slate-400 hover:text-slate-200 hover:border-[#26354A]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Control Sliders & Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="p-4 rounded-xl bg-[#080B10] border border-[#1A2330] space-y-2.5">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">Hypothetical Cutoff</label>
          <input
            type="date"
            value={hypoDeadline}
            onChange={(e) => setHypoDeadline(e.target.value)}
            className="w-full bg-[#030508] border border-[#1A2330] rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-violet-500 transition-colors"
          />
          <p className="text-[10px] text-slate-500 font-mono">Current live cutoff: {data.goal.deadline}</p>
        </div>

        <div className="p-4 rounded-xl bg-[#080B10] border border-[#1A2330] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">Daily Study Capacity</label>
            <span className="font-mono text-xs font-bold text-violet-400">{hypoDailyHours}h / day</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="6"
            step="0.5"
            value={hypoDailyHours}
            onChange={(e) => setHypoDailyHours(parseFloat(e.target.value))}
            className="w-full accent-violet-500 h-1 bg-[#1A2330] rounded cursor-pointer"
          />
          <p className="text-[10px] text-slate-500 font-mono">Adjust hours available per day</p>
        </div>

        <div className="p-4 rounded-xl bg-[#080B10] border border-[#1A2330] space-y-2.5">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">Reserved Buffer Days</label>
          <select
            value={hypoBufferDays}
            onChange={(e) => setHypoBufferDays(e.target.value)}
            className="w-full bg-[#030508] border border-[#1A2330] rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-violet-500 transition-colors"
          >
            <option value="0">0 Days (Extreme Risk)</option>
            <option value="1">1 Day</option>
            <option value="3">3 Days (Balanced)</option>
            <option value="5">5 Days</option>
          </select>
          <p className="text-[10px] text-slate-500 font-mono">Days reserved for unexpected delays</p>
        </div>

      </div>

      {/* Run Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="px-5 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white font-bold font-mono text-xs shadow-[0_0_15px_rgba(124,58,237,0.3)] flex items-center space-x-2 transition-all"
        >
          {simulating ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>SIMULATING WITH DETERMINISTIC SOLVER...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>RUN SANDBOX SIMULATION</span>
            </>
          )}
        </button>
      </div>

      {/* Simulation Results Card */}
      {simResult && (
        <div className="p-6 rounded-xl bg-[#080B10] border border-[#1A2330] space-y-5 animate-fadeIn shadow-2xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1A2330]">
            <div>
              <div className="flex items-center space-x-2">
                {simResult.deadline_met ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                )}
                <h3 className="font-bold text-slate-100 text-base font-mono">
                  {simResult.deadline_met ? 'FEASIBLE PLAN PROJECTED' : 'DEADLINE COMPROMISED'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">{simResult.risk_assessment}</p>
            </div>

            <span className={`px-3 py-1 rounded-md text-xs font-mono font-bold self-start sm:self-center ${
              simResult.deadline_met
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
            }`}>
              Projected Finish: {simResult.projected_finish_date}
            </span>
          </div>

          {/* Tradeoffs List */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">Simulation Insights & Trade-offs:</h4>
            <div className="space-y-1.5">
              {simResult.tradeoffs.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                  <span className="text-violet-400 font-mono font-bold">●</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sandbox Note */}
          <div className="p-3 rounded-lg bg-[#030508] border border-[#1A2330] text-[11px] text-slate-400 font-mono leading-relaxed">
            🛡️ <strong>ISOLATION GUARANTEE:</strong> This simulation has not modified your live study timetable. Primary schedule remains untouched in PostgreSQL.
          </div>

        </div>
      )}

    </div>
  );
}
