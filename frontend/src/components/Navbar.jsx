import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  CalendarDays, 
  SlidersHorizontal, 
  FileUp, 
  Plus, 
  Flame, 
  Bot, 
  LayoutDashboard,
  LogOut,
  User,
  LogIn,
  UserPlus,
  ChevronDown,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { statsService } from '../services/api';

export default function Navbar({ onOpenAssistant }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isDemoUser } = useAuth();
  const [streakDays, setStreakDays] = useState(0);
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchStreak = async () => {
      if (!user) return;
      try {
        const stats = await statsService.getDashboard();
        if (isMounted && stats?.progress) {
          setStreakDays(stats.progress.streakDays || 0);
          setIsCompletedToday(stats.progress.isCompletedToday || false);
        }
      } catch (err) {
        // quiet fallback
      }
    };

    fetchStreak();
    const interval = setInterval(fetchStreak, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Schedule', path: '/schedule', icon: CalendarDays },
    { name: 'What-If Sandbox', path: '/what-if', icon: SlidersHorizontal },
    { name: 'Syllabus Extractor', path: '/syllabus', icon: FileUp },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1A2330] bg-[#030508]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-[#080B10] border border-[#1A2330] group-hover:border-[#7C3AED]/60 flex items-center justify-center transition-all shadow-[0_0_10px_rgba(124,58,237,0.1)]">
              <Sparkles className="w-4 h-4 text-violet-400 group-hover:text-cyan-300 transition-colors" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs sm:text-sm text-slate-100 tracking-tight font-mono">AI STUDY PLANNER</span>
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.2 rounded bg-[#7C3AED]/15 text-violet-300 border border-[#7C3AED]/30 font-mono">
                  OS-1
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-[#1A2330]">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#7C3AED]/15 border border-[#7C3AED]/40 text-violet-200 font-semibold shadow-[0_0_12px_rgba(124,58,237,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#0D121A] hover:border hover:border-[#1A2330] border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-400' : 'text-slate-500'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2.5">
          
          {/* Real Streak Indicator */}
          {user && (
            <div 
              title={isCompletedToday ? "Streak protected! You completed study tasks today." : "Complete today's task to keep your streak alive!"}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold transition-all ${
                streakDays > 0 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                  : 'bg-[#080B10] border-[#1A2330] text-slate-500'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${streakDays > 0 ? 'fill-amber-400 text-amber-400 animate-pulse' : 'text-slate-600'}`} />
              <span>{streakDays}D STREAK</span>
            </div>
          )}

          {/* AI Coach Button */}
          <button
            onClick={onOpenAssistant}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#080B10] hover:bg-[#0D121A] border border-[#1A2330] hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs font-medium transition-all"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">AI Coach</span>
          </button>

          {/* New Goal Button */}
          <Link
            to="/onboarding"
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">New Goal</span>
          </Link>

          {/* User Auth Section */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 pl-1.5 pr-2 py-1 rounded-lg bg-[#080B10] hover:bg-[#0D121A] border border-[#1A2330] hover:border-[#26354A] text-slate-200 text-xs transition-colors"
              >
                <div className="w-5 h-5 rounded bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center text-violet-300 text-[10px] font-mono font-bold">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <span className="max-w-[90px] truncate font-medium text-[11px] hidden md:inline">
                  {user.fullName || 'User'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {/* Dropdown menu */}
              {isUserMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-[#080B10] border border-[#1A2330] shadow-2xl py-1.5 z-50 animate-scaleUp"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-3.5 py-2 border-b border-[#1A2330]">
                    <p className="text-xs font-semibold text-white truncate">{user.fullName || 'User'}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                    {isDemoUser && (
                      <span className="inline-block mt-1 text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Demo Mode Active
                      </span>
                    )}
                  </div>

                  <Link
                    to="/onboarding"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center space-x-2 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-[#0D121A] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-violet-400" />
                    <span>Create New Goal</span>
                  </Link>

                  <Link
                    to="/schedule"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center space-x-2 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-[#0D121A] transition-colors"
                  >
                    <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
                    <span>View Schedule</span>
                  </Link>

                  <div className="my-1 border-t border-[#1A2330]" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-[#080B10] transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-[0_0_12px_rgba(124,58,237,0.3)] transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </Link>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}

