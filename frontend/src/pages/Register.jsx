import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, ArrowRight, ShieldCheck, Calendar, Zap, UserCheck, Terminal, Cpu, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(email, password, fullName);
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    loginAsDemo();
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Value Showcase */}
        <div className="lg:col-span-6 space-y-6 text-left hidden lg:block pr-6">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded border border-[#1A2330] bg-[#080B10] text-purple-400 text-xs font-mono">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI COGNITIVE ARCHITECTURE • OS-1</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight leading-tight">
            Initialize Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-purple-400">Autonomous</span> Study Engine
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed">
            Create your account to unlock private schedules, dynamic graph redistribution, spaced repetition quizzes, and real-time pace telemetry.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-3 text-xs text-slate-300 p-3 rounded-lg border border-[#1A2330] bg-[#080B10]/80">
              <div className="w-7 h-7 rounded bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-200 block">100% Data Isolation</span>
                <span className="text-slate-500 text-[11px]">Private DAG graph for your milestones & calibration</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-300 p-3 rounded-lg border border-[#1A2330] bg-[#080B10]/80">
              <div className="w-7 h-7 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-200 block">Custom Start Date & Buffer Protection</span>
                <span className="text-slate-500 text-[11px]">Automatic buffer days safeguard against unexpected delays</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs text-slate-300 p-3 rounded-lg border border-[#1A2330] bg-[#080B10]/80">
              <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-slate-200 block">0ms Optimistic UI & Dynamic Rescheduling</span>
                <span className="text-slate-500 text-[11px]">Intelligent vacation & missed task redistribution engine</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center space-x-4 text-[11px] font-mono text-slate-500">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>DAG ENGINE ACTIVE</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1.5">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span>GROQ LLM CONNECTED</span>
            </span>
          </div>
        </div>

        {/* Right Auth Card */}
        <div className="lg:col-span-6">
          <div className="bg-[#080B10] border border-[#1A2330] rounded-xl p-6 sm:p-8 shadow-2xl relative">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0D121A] border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_12px_rgba(124,58,237,0.3)]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-100 tracking-tight">Create Your Account</h2>
                    <p className="text-[11px] font-mono text-slate-400">INITIALIZE NEW OPERATOR PROFILE</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded border border-[#1A2330] bg-[#0D121A] text-[10px] font-mono text-cyan-400">
                  FREE ACCESS
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs font-mono">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0D121A] border border-[#1A2330] text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0D121A] border border-[#1A2330] text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0D121A] border border-[#1A2330] text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">Confirm</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0D121A] border border-[#1A2330] text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white text-xs font-semibold shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center space-x-2 disabled:opacity-60 mt-3"
              >
                <span>{loading ? 'Initializing Operator...' : 'Register & Launch Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="relative my-5 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1A2330]" />
              </div>
              <span className="relative px-3 bg-[#080B10] text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Or explore without signup
              </span>
            </div>

            <button
              onClick={handleDemoLogin}
              type="button"
              className="w-full py-2.5 rounded-lg bg-[#0D121A] hover:bg-[#101620] text-slate-300 hover:text-white border border-[#1A2330] text-xs font-mono transition-colors flex items-center justify-center space-x-2"
            >
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>LAUNCH INSTANT DEMO ENVIRONMENT</span>
            </button>

            <p className="text-center text-xs text-slate-400 mt-5 font-mono">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Sign in here →
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
