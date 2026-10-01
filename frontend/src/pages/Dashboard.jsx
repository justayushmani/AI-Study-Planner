import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Target, 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  Flame, 
  TriangleAlert, 
  ArrowRight, 
  RotateCcw, 
  BookOpen, 
  Sparkles,
  TrendingUp,
  FileQuestion,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { statsService, taskService, planService } from '../services/api';

export default function Dashboard({ onOpenAssistant }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleDiff, setRescheduleDiff] = useState(null);
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const res = await statsService.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleTaskStatus = async (taskId, newStatus) => {
    // 1. Instant 0ms optimistic UI update
    const previousData = data;
    setData((prev) => {
      if (!prev) return prev;
      const updateList = (list) =>
        (list || []).map((t) => (t.id === taskId ? { ...t, status: newStatus } : t));

      const updatedToday = updateList(prev.todayTasks);
      const updatedUpcoming = updateList(prev.upcomingTasks);
      const allTasks = [...updatedToday, ...updatedUpcoming];
      const completedTasks = allTasks.filter((t) => t.status === 'Completed').length;
      const totalTasks = allTasks.length;
      const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const completedMinutes = allTasks
        .filter((t) => t.status === 'Completed')
        .reduce((s, t) => s + (t.durationMinutes || 0), 0);
      const completedHours = Number(Math.round(completedMinutes / 60.0 + 'e1') + 'e-1');

      const todayIso = new Date().toISOString().split('T')[0];
      const missedTasksCount = allTasks.filter(
        (t) => t.status !== 'Completed' && (t.scheduledDate || '').split('T')[0] < todayIso
      ).length;
      const isCompletedToday = updatedToday.some((t) => t.status === 'Completed');

      return {
        ...prev,
        todayTasks: updatedToday,
        upcomingTasks: updatedUpcoming,
        progress: {
          ...prev.progress,
          completedTasks,
          totalTasks,
          percentage,
          completedHours,
          missedTasksCount,
          isCompletedToday,
          streakDays: isCompletedToday && (prev.progress?.streakDays === 0 || !prev.progress?.streakDays)
            ? 1
            : (prev.progress?.streakDays || 0)
        }
      };
    });

    // 2. Perform backend API call in background
    try {
      await taskService.updateStatus(taskId, newStatus);
    } catch (err) {
      console.error('Failed to update task:', err);
      // Revert on error
      setData(previousData);
    }
  };

  const handleReschedule = async () => {
    if (!data?.plan?.id) return;
    setRescheduling(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await planService.reschedulePlan(data.plan.id, todayStr);
      setRescheduleDiff(res.diff);
      fetchDashboard();
    } catch (err) {
      alert('Rescheduling failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setRescheduling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono tracking-tight">INITIALIZING ADAPTIVE SCHEDULE...</p>
        </div>
      </div>
    );
  }

  if (!data?.hasActiveGoal) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-fadeIn">
        <div className="inline-flex p-4 rounded-xl bg-[#080B10] border border-[#1A2330] text-violet-400 mb-6 shadow-[0_0_20px_rgba(124,58,237,0.15)]">
          <Target className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight mb-3">
          Ready to achieve your study goal?
        </h1>
        <p className="max-w-lg mx-auto text-xs sm:text-sm text-slate-400 mb-8 leading-relaxed">
          Initialize an adaptive, dependency-aware study schedule. If you miss a study session or take time off, the deterministic engine rebalances your timetable automatically.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/onboarding"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all flex items-center justify-center space-x-2"
          >
            <span>Start Goal Setup</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/syllabus"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#080B10] hover:bg-[#0D121A] text-slate-300 border border-[#1A2330] hover:border-[#26354A] font-medium text-xs transition-colors flex items-center justify-center space-x-2"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>Upload Syllabus Document</span>
          </Link>
        </div>
      </div>
    );
  }

  const { goal, plan, progress, todayTasks, upcomingTasks, weakTopics, weeklyChart } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      
      {/* Reschedule Success Alert */}
      {rescheduleDiff && (
        <div className="p-4 rounded-xl bg-[#080B10] border border-emerald-500/30 text-emerald-300 flex items-start justify-between shadow-[0_0_15px_rgba(34,197,94,0.1)]">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs font-mono uppercase tracking-wider text-emerald-300">
                Schedule Intelligently Recalculated
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Redistributed <strong className="text-emerald-300 font-mono">{rescheduleDiff.redistributed_minutes}m</strong> from <strong className="text-emerald-300 font-mono">{rescheduleDiff.missed_tasks_count}</strong> missed tasks across remaining study days while preserving <strong className="text-emerald-300 font-mono">{rescheduleDiff.buffer_days_preserved}</strong> buffer days.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setRescheduleDiff(null)}
            className="text-xs text-slate-400 hover:text-white font-mono"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Missed Tasks Warning Banner */}
      {progress.missedTasksCount > 0 && !rescheduleDiff && (
        <div className="p-4 rounded-xl bg-[#080B10] border border-amber-500/30 text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_15px_rgba(245,158,11,0.08)]">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <TriangleAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-xs font-mono uppercase tracking-wider text-amber-300">
                {progress.missedTasksCount} OVERDUE STUDY SESSION{progress.missedTasksCount > 1 ? 'S' : ''} DETECTED
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Overdue tasks detected. Execute the deterministic solver to redistribute without compromising deadline.
              </p>
            </div>
          </div>
          <button
            onClick={handleReschedule}
            disabled={rescheduling}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold font-mono transition-all flex items-center justify-center space-x-1.5 flex-shrink-0"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${rescheduling ? 'animate-spin' : ''}`} />
            <span>{rescheduling ? 'RECALCULATING...' : 'INTELLIGENT RESCHEDULE'}</span>
          </button>
        </div>
      )}

      {/* Dashboard Command Center Header */}
      <div className="p-6 rounded-xl bg-[#080B10] border border-[#1A2330] shadow-xl relative overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-[#7C3AED]/15 text-violet-300 border border-[#7C3AED]/30">
                {goal.category}
              </span>
              <span className="text-[11px] text-slate-400 font-mono flex items-center space-x-1.5">
                <CalendarDays className="w-3 h-3 text-slate-500" />
                <span>DEADLINE: <strong className="text-slate-200">{goal.deadline}</strong></span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              {goal.title}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Proficiency: <span className="text-violet-300 font-semibold">{goal.proficiencyLevel}</span> • Plan Version: <span className="text-cyan-300 font-mono">v{plan?.version || 1}.0</span>
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <Link
              to="/what-if"
              className="px-3 py-1.5 rounded-lg bg-[#0D121A] hover:bg-[#101620] text-slate-300 hover:text-white border border-[#1A2330] hover:border-[#26354A] text-xs font-medium transition-all flex items-center space-x-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>What-If Sandbox</span>
            </Link>
            <Link
              to="/schedule"
              className="px-3.5 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-[0_0_12px_rgba(124,58,237,0.25)] transition-all flex items-center space-x-1.5"
            >
              <span>Full Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Curriculum Progress Bar */}
        <div className="mt-5 pt-4 border-t border-[#1A2330]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider">Curriculum Completion</span>
            <span className="text-violet-300 font-bold font-mono text-xs">{progress.percentage}%</span>
          </div>
          <div className="w-full h-2 bg-[#030508] border border-[#1A2330] rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#22D3EE] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(124,58,237,0.5)]"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Analytics Widgets Row (4 Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Widget 1: Streak */}
        <div className="p-4 rounded-xl bg-[#080B10] border border-[#1A2330] relative overflow-hidden group hover:border-[#26354A] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Real Study Streak</span>
            <Flame className={`w-3.5 h-3.5 ${progress.streakDays > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
            {String(progress.streakDays).padStart(2, '0')} <span className="text-xs font-sans text-slate-500 font-normal">days</span>
          </div>
          <p className={`text-[11px] mt-1 font-mono ${progress.streakDays > 0 ? (progress.isCompletedToday ? 'text-emerald-400' : 'text-amber-400') : 'text-slate-500'}`}>
            {progress.streakDays > 0 
              ? (progress.isCompletedToday ? '✓ COMPLETED TODAY' : '● PENDING TODAY') 
              : 'INACTIVE STREAK'}
          </p>
        </div>

        {/* Widget 2: Completed Time */}
        <div className="p-4 rounded-xl bg-[#080B10] border border-[#1A2330] relative overflow-hidden group hover:border-[#26354A] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Completed Time</span>
            <Clock className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
            {progress.completedHours} <span className="text-xs font-sans text-slate-500 font-normal">hours</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">{progress.completedTasks} tasks finished</p>
        </div>

        {/* Widget 3: Scheduled Tasks */}
        <div className="p-4 rounded-xl bg-[#080B10] border border-[#1A2330] relative overflow-hidden group hover:border-[#26354A] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Scheduled Tasks</span>
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
            {progress.totalTasks} <span className="text-xs font-sans text-slate-500 font-normal">total</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">{progress.totalTasks - progress.completedTasks} remaining</p>
        </div>

        {/* Widget 4: Weak Areas */}
        <div className="p-4 rounded-xl bg-[#080B10] border border-[#1A2330] relative overflow-hidden group hover:border-[#26354A] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Identified Weak Areas</span>
            <TriangleAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono tracking-tight">
            {weakTopics.length} <span className="text-xs font-sans text-slate-500 font-normal">topics</span>
          </div>
          <p className="text-[11px] text-rose-400/90 font-mono mt-1">Weighted in scheduler</p>
        </div>

      </div>

      {/* Main Grid: Today's Timeline + Charts & Side Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Today's Tasks & Study Velocity */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Study Sessions Timeline */}
          <div className="p-5 rounded-xl bg-[#080B10] border border-[#1A2330] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2330]">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-violet-400" />
                <h3 className="font-bold text-slate-100 text-sm">Today's Study Sessions</h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0D121A] text-slate-400 border border-[#1A2330]">
                {todayTasks.length} task{todayTasks.length === 1 ? '' : 's'}
              </span>
            </div>

            {todayTasks.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[#1A2330] rounded-lg">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-200">No more tasks scheduled for today</p>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">Sessions complete. Take a practice quiz or review weak concepts.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todayTasks.map((task) => {
                  const isDone = task.status === 'Completed';
                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                        isDone
                          ? 'bg-[#030508]/60 border-[#1A2330]/50 opacity-60'
                          : 'bg-[#0D121A] border-[#1A2330] hover:border-[#26354A]'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <button
                          onClick={() => handleTaskStatus(task.id, isDone ? 'Not Started' : 'Completed')}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                              : 'border-[#26354A] hover:border-violet-400 text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-medium truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                              {task.topic?.title || 'Study Session'}
                            </span>
                            <span className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded ${
                              task.taskType === 'Revision' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' :
                              task.taskType === 'Quiz' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                              'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                            }`}>
                              {task.taskType}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono mt-0.5">
                            <span>{task.startTime || '18:00'} — {task.endTime || '18:45'}</span>
                            <span>•</span>
                            <span className="text-slate-400">{task.durationMinutes} MIN</span>
                            {task.topic?.unitName && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[120px]">{task.topic.unitName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        {task.taskType === 'Quiz' && (
                          <Link
                            to={`/quiz/${task.topicId}`}
                            className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-semibold transition-colors flex items-center space-x-1"
                          >
                            <FileQuestion className="w-3 h-3" />
                            <span>QUIZ</span>
                          </Link>
                        )}
                        <button
                          onClick={() => handleTaskStatus(task.id, 'Skipped')}
                          className="px-2 py-1 rounded text-[11px] font-mono text-slate-500 hover:text-slate-300 hover:bg-[#101620] transition-colors"
                        >
                          SKIP
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Workload & Velocity Chart */}
          <div className="p-5 rounded-xl bg-[#080B10] border border-[#1A2330] space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2330]">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Study Velocity</h3>
                <p className="text-[11px] text-slate-500 font-mono">Planned vs Actual Hours (Past 7 Days)</p>
              </div>
              <TrendingUp className="w-4 h-4 text-violet-400" />
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} unit="h" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#080B10', borderColor: '#1A2330', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px', fontFamily: 'monospace' }} />
                  <Bar dataKey="plannedHours" name="Planned Hours" fill="#1E293B" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="completedHours" name="Completed Hours" fill="#7C3AED" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Priority Focus, Next Queue, AI Coach */}
        <div className="space-y-6">
          
          {/* Weak Topics Priority Panel */}
          <div className="p-5 rounded-xl bg-[#080B10] border border-[#1A2330] space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#1A2330]">
              <h3 className="font-bold text-slate-100 text-xs font-mono uppercase tracking-wider">Priority Focus Areas</h3>
              <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                Low Confidence
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Assigned extra repetition and higher weighting by the scheduler engine.
            </p>

            {weakTopics.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500 font-mono">
                No weak topics flagged. Good retention across modules!
              </div>
            ) : (
              <div className="space-y-2">
                {weakTopics.slice(0, 4).map((topic) => (
                  <div
                    key={topic.id}
                    className="p-2.5 rounded-lg bg-[#0D121A] border border-[#1A2330] flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-semibold text-slate-200 truncate">{topic.title}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{topic.unitName} • Difficulty {topic.difficultyLevel}/5</p>
                    </div>
                    <Link
                      to={`/quiz/${topic.id}`}
                      className="px-2 py-0.5 rounded bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-mono font-semibold transition-colors flex-shrink-0"
                    >
                      QUIZ
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Schedule Queue */}
          <div className="p-5 rounded-xl bg-[#080B10] border border-[#1A2330] space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#1A2330]">
              <h3 className="font-bold text-slate-100 text-xs font-mono uppercase tracking-wider">Next in Queue</h3>
              <Link to="/schedule" className="text-[11px] font-mono text-violet-400 hover:text-violet-300 font-medium">
                VIEW ALL
              </Link>
            </div>

            <div className="space-y-2">
              {upcomingTasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-lg bg-[#0D121A] border border-[#1A2330] flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-medium text-slate-300 truncate">{t.topic?.title}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {new Date(t.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })} • {t.durationMinutes}m
                    </p>
                  </div>
                  <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#101620] text-slate-400 border border-[#1A2330] flex-shrink-0">
                    {t.taskType}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick AI Coaching Trigger */}
          <div className="p-5 rounded-xl bg-[#080B10] border border-[#1A2330] space-y-2.5">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-slate-100 text-xs font-mono uppercase tracking-wider">AI Study Mentor</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Have doubts about an upcoming topic or want a breakdown of the rescheduling algorithm?
            </p>
            <button
              onClick={onOpenAssistant}
              className="w-full py-2 rounded-lg bg-[#0D121A] hover:bg-[#101620] border border-[#1A2330] hover:border-cyan-500/40 text-cyan-300 hover:text-cyan-200 text-xs font-semibold font-mono transition-all flex items-center justify-center space-x-1.5"
            >
              <span>LAUNCH AI COACH</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
