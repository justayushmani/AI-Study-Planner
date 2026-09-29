import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Calendar, 
  Sliders, 
  FileUp, 
  PlusCircle, 
  Flame, 
  Bot, 
  LayoutDashboard,
  LogOut,
  User,
  LogIn,
  UserPlus,
  ShieldCheck,
  ChevronDown
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
    { name: 'Study Schedule', path: '/schedule', icon: Calendar },
    { name: 'What-If Sandbox', path: '/what-if', icon: Sliders },
    { name: 'Syllabus Extractor', path: '/syllabus', icon: FileUp },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-slate-100 tracking-tight">AI Study Planner</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Adaptive
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Deterministic Engine + Groq</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-800">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-indigo-400 font-semibold shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          
          {/* Real Streak Indicator */}
          {user && (
            <div 
              title={isCompletedToday ? "Streak protected! You completed study tasks today." : "Complete today's task to keep your streak alive!"}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all ${
                streakDays > 0 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-sm shadow-amber-500/10'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${streakDays > 0 ? 'fill-amber-400 text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span>{streakDays} Day Streak</span>
            </div>
          )}

          {/* AI Coach Button */}
          <button
            onClick={onOpenAssistant}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 text-xs font-medium transition-colors"
          >
            <Bot className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">AI Study Coach</span>
          </button>

          {/* New Goal Button */}
          <Link
            to="/onboarding"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Goal</span>
          </Link>

          {/* User Auth Section */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 pl-2 pr-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[11px] font-bold">
                  {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                </div>
                <span className="max-w-[100px] truncate font-medium hidden md:inline">
                  {user.fullName || 'User'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Dropdown menu */}
              {isUserMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl shadow-black/50 py-2 z-50 animate-fadeIn"
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-3.5 py-2 border-b border-slate-800">
                    <p className="text-xs font-semibold text-white truncate">{user.fullName || 'User'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    {isDemoUser && (
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Demo Mode Active
                      </span>
                    )}
                  </div>

                  <Link
                    to="/onboarding"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center space-x-2 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Create New Study Goal</span>
                  </Link>

                  <Link
                    to="/schedule"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center space-x-2 px-3.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>View Full Schedule</span>
                  </Link>

                  <div className="my-1 border-t border-slate-800" />

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
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-400" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
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

