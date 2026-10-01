import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck, Zap, CalendarDays, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    loginAsDemo();
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Value Showcase */}
        <div className="lg:col-span-6 space-y-5 text-left hidden lg:block pr-4">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-violet-300 text-[11px] font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI ADAPTIVE STUDY OS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
            Master Any Syllabus With <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-400">Intelligent Scheduling</span>
          </h1>
          <p className="text-slate-400 text-xs leading-relaxed">
            Your personal AI study planner that adapts dynamically to your real life—rebalancing missed days, vacation leaves, and study velocity automatically.
          </p>

          <div className="space-y-2.5 pt-1 font-mono text-xs">
            <div className="flex items-center space-x-3 text-slate-300 p-2.5 rounded-lg bg-[#080B10] border border-[#1A2330]">
              <div className="w-5 h-5 rounded bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <ShieldCheck className="w-3 h-3" />
              </div>
              <span className="text-[11px]">Private schedule & data isolation for each user</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-300 p-2.5 rounded-lg bg-[#080B10] border border-[#1A2330]">
              <div className="w-5 h-5 rounded bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <CalendarDays className="w-3 h-3" />
              </div>
              <span className="text-[11px]">Vacation-aware rescheduling & study pace booster</span>
            </div>
            <div className="flex items-center space-x-3 text-slate-300 p-2.5 rounded-lg bg-[#080B10] border border-[#1A2330]">
              <div className="w-5 h-5 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Zap className="w-3 h-3" />
              </div>
              <span className="text-[11px]">Real streak telemetry & spaced repetition quizzes</span>
            </div>
          </div>
        </div>

        {/* Right Auth Card */}
        <div className="lg:col-span-6">
          <div className="bg-[#080B10] border border-[#1A2330] rounded-xl p-6 sm:p-8 shadow-2xl">
            <div className="mb-5 text-center">
              <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/30 mx-auto mb-2.5 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight font-mono">AUTHENTICATION</h2>
              <p className="text-xs text-slate-500 mt-0.5">Sign in to resume your study journey</p>
            </div>

            {error && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#030508] border border-[#1A2330] text-slate-100 placeholder-slate-600 text-xs font-mono focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">PASSWORD</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#030508] border border-[#1A2330] text-slate-100 placeholder-slate-600 text-xs font-mono focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold font-mono shadow-[0_0_15px_rgba(124,58,237,0.25)] transition-all flex items-center justify-center space-x-1.5 disabled:opacity-60 mt-1"
              >
                <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1A2330]" />
              </div>
              <span className="relative px-2 bg-[#080B10] text-[10px] text-slate-600 uppercase tracking-widest font-mono">
                Or quick exploration
              </span>
            </div>

            <button
              onClick={handleDemoLogin}
              type="button"
              className="w-full py-2 rounded-lg bg-[#0D121A] hover:bg-[#101620] text-slate-300 hover:text-white border border-[#1A2330] hover:border-[#26354A] text-xs font-mono font-semibold transition-colors flex items-center justify-center space-x-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-violet-400" />
              <span>Continue with Instant Demo Mode</span>
            </button>

            <p className="text-center text-xs text-slate-500 mt-4">
              Don't have an account?{' '}
              <Link to="/register" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
                Create an account
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
