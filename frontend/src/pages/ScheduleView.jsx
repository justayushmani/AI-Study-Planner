import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  TriangleAlert, 
  FileQuestion, 
  Layers,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Palmtree,
  Flame,
  Search,
  SlidersHorizontal,
  Check,
  TrendingUp,
  X,
  Zap,
  BookOpen,
  ArrowRight,
  Filter,
  CheckSquare,
  Square,
  Play,
  Pause
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { statsService, taskService, planService } from '../services/api';

export default function ScheduleView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reschedule & Vacation Modal State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleTab, setRescheduleTab] = useState('missed'); // 'missed', 'vacation', 'pace'
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleDiff, setRescheduleDiff] = useState(null);
  const [rescheduleSuggestions, setRescheduleSuggestions] = useState([]);

  // Vacation Form
  const [vacationStart, setVacationStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [vacationEnd, setVacationEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [vacationReason, setVacationReason] = useState('Family Vacation / Trip');

  // Pace Adjustment
  const [paceIncreaseHours, setPaceIncreaseHours] = useState(0.5);

  // Selected Missed Task IDs
  const [selectedMissedTaskIds, setSelectedMissedTaskIds] = useState([]);

  const loadSchedule = async () => {
    try {
      const res = await statsService.getDashboard();
      setData(res);
      // Auto-select all missed tasks for easy 1-click catchup
      if (res?.todayTasks || res?.upcomingTasks) {
        const todayStr = new Date().toISOString().split('T')[0];
        const allTasks = [...(res.todayTasks || []), ...(res.upcomingTasks || [])];
        const missed = allTasks.filter(t => t.status !== 'Completed' && t.scheduledDate.split('T')[0] < todayStr);
        setSelectedMissedTaskIds(missed.map(t => t.id));
      }
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
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

    // 2. Perform backend API call asynchronously in background
    try {
      await taskService.updateStatus(taskId, newStatus);
    } catch (err) {
      console.error('Task status update failed:', err);
      // Revert if backend update fails
      setData(previousData);
    }
  };

  // Helper to generate dates between range
  const getDatesInRange = (startDateStr, endDateStr) => {
    const dates = [];
    let curr = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T00:00:00');
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const handleExecuteReschedule = async (overrideOptions = null) => {
    if (!data?.plan?.id) return;
    setRescheduling(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      let payload = { today: todayStr };

      if (overrideOptions) {
        payload = { ...payload, ...overrideOptions };
      } else if (rescheduleTab === 'vacation') {
        const blackoutDates = getDatesInRange(vacationStart, vacationEnd);
        payload = {
          today: todayStr,
          reason: `Vacation leave (${vacationStart} to ${vacationEnd}): ${vacationReason}`,
          blackoutDates,
          missedTaskIds: selectedMissedTaskIds
        };
      } else if (rescheduleTab === 'pace') {
        payload = {
          today: todayStr,
          reason: `Study pace boosted by +${paceIncreaseHours}h/day`,
          adjustedDailyHoursIncrease: parseFloat(paceIncreaseHours),
          missedTaskIds: selectedMissedTaskIds
        };
      } else {
        payload = {
          today: todayStr,
          reason: 'Missed tasks redistribution',
          missedTaskIds: selectedMissedTaskIds
        };
      }

      const res = await planService.reschedulePlan(data.plan.id, payload);
      setRescheduleDiff(res.diff);
      setRescheduleSuggestions(res.suggestions || []);
      setIsRescheduleModalOpen(false);
      loadSchedule();
    } catch (err) {
      alert('Reschedule error: ' + (err.response?.data?.error || err.message));
    } finally {
      setRescheduling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono tracking-tight">LOADING FULL SCHEDULE TIMETABLE...</p>
        </div>
      </div>
    );
  }

  if (!data?.hasActiveGoal) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 animate-fadeIn">
        <div className="w-12 h-12 rounded-xl bg-[#080B10] border border-[#1A2330] flex items-center justify-center mx-auto text-violet-400 shadow-[0_0_15px_rgba(124,58,237,0.15)]">
          <CalendarDays className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">No Active Schedule Found</h2>
        <p className="text-slate-400 text-xs">Create your personalized study plan to generate a DAG schedule.</p>
        <Link to="/onboarding" className="inline-block px-4 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-[0_0_12px_rgba(124,58,237,0.25)] transition-all">
          Create Goal & Plan
        </Link>
      </div>
    );
  }

  const { goal, plan, todayTasks = [], upcomingTasks = [], progress } = data;
  const allTasks = [...todayTasks, ...upcomingTasks];
  const todayStr = new Date().toISOString().split('T')[0];

  // Identify missed tasks (scheduled before today and uncompleted)
  const missedTasksList = allTasks.filter(t => t.scheduledDate.split('T')[0] < todayStr && t.status !== 'Completed');

  // Filter tasks based on activeTab & searchQuery
  const filteredTasks = allTasks.filter(task => {
    const taskDateStr = task.scheduledDate.split('T')[0];
    const matchesSearch = 
      task.topic?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.topic?.unitName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.taskType?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'Today') {
      return taskDateStr === todayStr;
    }
    if (activeTab === 'Upcoming') {
      return taskDateStr > todayStr;
    }
    if (activeTab === 'Missed') {
      return taskDateStr < todayStr && task.status !== 'Completed';
    }
    if (activeTab === 'Completed') {
      return task.status === 'Completed';
    }
    if (activeTab === 'Quizzes & Revisions') {
      return task.taskType === 'Quiz' || task.taskType === 'Revision';
    }
    return true; // 'All'
  });

  // Group tasks by scheduled date
  const groupedTasks = filteredTasks.reduce((acc, t) => {
    const dStr = t.scheduledDate.split('T')[0];
    if (!acc[dStr]) acc[dStr] = [];
    acc[dStr].push(t);
    return acc;
  }, {});

  const dates = Object.keys(groupedTasks).sort();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      
      {/* Top Banner Header */}
      <div className="p-6 rounded-xl bg-[#080B10] border border-[#1A2330] shadow-xl relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center space-x-2.5 mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-violet-300">
                {goal.category}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#0D121A] text-slate-400 font-mono border border-[#1A2330]">
                v{plan?.version || 1}.0
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{goal.title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-mono mt-1.5">
              <span>TARGET CUTOFF: <strong className="text-slate-200">{goal.deadline}</strong></span>
              <span>•</span>
              <span>MODULES: <strong className="text-slate-200">{goal.totalTopics || 0}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">BUFFER PROTECTED</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setRescheduleTab('vacation');
                setIsRescheduleModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-[#0D121A] hover:bg-[#101620] text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold font-mono transition-all flex items-center space-x-1.5"
            >
              <Palmtree className="w-3.5 h-3.5 text-amber-400" />
              <span>PLAN LEAVE</span>
            </button>

            <button
              onClick={() => {
                setRescheduleTab('missed');
                setIsRescheduleModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold font-mono shadow-[0_0_12px_rgba(124,58,237,0.25)] flex items-center space-x-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESCHEDULE</span>
            </button>

            <Link
              to="/what-if"
              className="px-3 py-1.5 rounded-lg bg-[#0D121A] hover:bg-[#101620] text-slate-300 hover:text-white text-xs font-medium border border-[#1A2330] hover:border-[#26354A] transition-colors flex items-center space-x-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>What-If</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#1A2330] text-xs">
          <div className="p-2.5 rounded-lg bg-[#0D121A] border border-[#1A2330]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">Study Streak</span>
            <div className="flex items-center space-x-1.5">
              <Flame className={`w-3.5 h-3.5 ${progress.streakDays > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
              <span className="text-sm font-bold font-mono text-white">{progress.streakDays} Days</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0D121A] border border-[#1A2330]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">Completion</span>
            <span className="text-sm font-bold font-mono text-violet-300">{progress.percentage}%</span>
            <span className="text-slate-500 text-[10px] font-mono ml-1">({progress.completedTasks}/{progress.totalTasks})</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0D121A] border border-[#1A2330]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">Mastered</span>
            <span className="text-sm font-bold font-mono text-emerald-400">{progress.completedHours}h</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#0D121A] border border-[#1A2330]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">Overdue</span>
            <span className={`text-sm font-bold font-mono ${missedTasksList.length > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {missedTasksList.length} Tasks
            </span>
          </div>
        </div>
      </div>

      {/* Missed Tasks Warning Banner */}
      {missedTasksList.length > 0 && (
        <div className="p-4 rounded-xl bg-[#080B10] border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_15px_rgba(244,63,94,0.08)]">
          <div className="flex items-start space-x-3">
            <TriangleAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs font-mono uppercase tracking-wider text-rose-300">
                {missedTasksList.length} OVERDUE STUDY SESSION{missedTasksList.length > 1 ? 'S' : ''}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                The deterministic engine will redistribute these missed minutes across upcoming days while guarding your deadline.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setRescheduleTab('missed');
              setIsRescheduleModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold font-mono transition-all whitespace-nowrap flex items-center justify-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>REBALANCE SCHEDULE</span>
          </button>
        </div>
      )}

      {/* Reschedule Diff / Suggestion Banner */}
      {rescheduleDiff && (
        <div className="p-4 rounded-xl bg-[#080B10] border border-violet-500/30 text-violet-200 flex items-start justify-between shadow-[0_0_15px_rgba(124,58,237,0.1)]">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-xs font-mono uppercase tracking-wider text-violet-300">Schedule Successfully Rebalanced</h4>
              <p className="text-xs text-slate-300">
                Redistributed <strong className="font-mono text-violet-300">{rescheduleDiff.redistributed_minutes}m</strong> from <strong className="font-mono text-violet-300">{rescheduleDiff.missed_tasks_count}</strong> missed tasks.
                {rescheduleDiff.vacation_days_applied > 0 && ` Protected ${rescheduleDiff.vacation_days_applied} vacation day(s).`}
              </p>
              {rescheduleSuggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {rescheduleSuggestions.map((s, idx) => (
                    <p key={idx} className="text-xs text-amber-300 font-medium font-mono flex items-center space-x-1.5">
                      <span>⚡</span>
                      <span>{s}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setRescheduleDiff(null)} className="text-xs text-slate-400 hover:text-white font-mono">
            DISMISS
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#080B10] border border-[#1A2330] rounded-lg w-full md:w-auto">
          {[
            { id: 'All', label: 'All Tasks', count: allTasks.length },
            { id: 'Today', label: "Today", count: allTasks.filter(t => t.scheduledDate.split('T')[0] === todayStr).length },
            { id: 'Upcoming', label: 'Upcoming', count: allTasks.filter(t => t.scheduledDate.split('T')[0] > todayStr).length },
            { id: 'Missed', label: 'Missed', count: missedTasksList.length },
            { id: 'Completed', label: 'Completed', count: allTasks.filter(t => t.status === 'Completed').length },
            { id: 'Quizzes & Revisions', label: 'Quizzes/Revs', count: allTasks.filter(t => t.taskType === 'Quiz' || t.taskType === 'Revision').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#7C3AED] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0D121A]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1 rounded ${
                activeTab === tab.id ? 'bg-violet-950 text-violet-200' : 'bg-[#101620] text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, modules..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#080B10] border border-[#1A2330] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono transition-colors"
          />
        </div>
      </div>

      {/* Timeline Days List */}
      <div className="space-y-4">
        {dates.length === 0 ? (
          <div className="py-12 text-center bg-[#080B10] rounded-xl border border-[#1A2330] p-8">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">No study tasks found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your filter tabs or search query.
            </p>
          </div>
        ) : (
          dates.map((dStr) => {
            const tasksForDay = groupedTasks[dStr];
            const d = new Date(dStr + 'T00:00:00');
            const isToday = dStr === todayStr;
            const isPast = dStr < todayStr;
            const dayMinutes = tasksForDay.reduce((s, t) => s + t.durationMinutes, 0);
            const dayHours = (dayMinutes / 60.0).toFixed(1);
            const completedInDay = tasksForDay.filter(t => t.status === 'Completed').length;
            const isAllDayCompleted = completedInDay === tasksForDay.length;

            return (
              <div
                key={dStr}
                className={`p-5 rounded-xl border transition-all ${
                  isToday
                    ? 'bg-[#080B10] border-violet-500/60 shadow-[0_0_15px_rgba(124,58,237,0.08)]'
                    : isPast && !isAllDayCompleted
                    ? 'bg-[#080B10] border-rose-900/30'
                    : 'bg-[#080B10] border-[#1A2330]'
                }`}
              >
                {/* Day Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1A2330] mb-3 gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-bold text-xs sm:text-sm text-slate-100">
                      {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
                        Today's Focus
                      </span>
                    )}
                    {isPast && !isAllDayCompleted && (
                      <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        Overdue
                      </span>
                    )}
                    {isAllDayCompleted && (
                      <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Completed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
                    <span>{completedInDay}/{tasksForDay.length} Completed</span>
                    <span>•</span>
                    <span className="text-violet-400 font-semibold">{dayMinutes}m ({dayHours}h)</span>
                  </div>
                </div>

                {/* Tasks for the day */}
                <div className="space-y-2">
                  {tasksForDay.map((task) => {
                    const isDone = task.status === 'Completed';
                    const isMissed = isPast && !isDone;
                    const isInProgress = task.status === 'In Progress';

                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-lg border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          isDone
                            ? 'bg-[#030508]/60 border-[#1A2330]/50 opacity-60'
                            : isMissed
                            ? 'bg-rose-950/10 border-rose-900/40 hover:border-rose-700/60'
                            : isInProgress
                            ? 'bg-sky-950/20 border-sky-500/40'
                            : 'bg-[#0D121A] border-[#1A2330] hover:border-[#26354A]'
                        }`}
                      >
                        {/* Task Left: Checkbox + Topic Details */}
                        <div className="flex items-start sm:items-center space-x-3">
                          <button
                            onClick={() => handleTaskStatus(task.id, isDone ? 'Not Started' : 'Completed')}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0 mt-0.5 sm:mt-0 ${
                              isDone
                                ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                : 'border-[#26354A] hover:border-violet-400 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>

                          <div className="space-y-0.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`text-xs font-semibold ${isDone ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                                {task.topic?.title || 'Study Session'}
                              </span>

                              {/* Task Type Badge */}
                              <span className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded ${
                                task.taskType === 'Revision' ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' :
                                task.taskType === 'Quiz' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                                'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                              }`}>
                                {task.taskType}
                              </span>

                              {/* Status Badge */}
                              {isDone && (
                                <span className="text-[9px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                  DONE
                                </span>
                              )}
                              {isMissed && (
                                <span className="text-[9px] font-mono font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                                  OVERDUE
                                </span>
                              )}
                              {isInProgress && (
                                <span className="text-[9px] font-mono font-semibold text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20 animate-pulse">
                                  ACTIVE
                                </span>
                              )}
                            </div>

                            {/* Meta row: Time, Duration, Module, Difficulty */}
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500 font-mono">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>{task.startTime || "18:00"} — {task.endTime || "18:45"}</span>
                              </span>
                              <span>•</span>
                              <span className="text-slate-400">{task.durationMinutes}m</span>
                              <span>•</span>
                              <span className="text-slate-400 truncate max-w-[150px]">{task.topic?.unitName || 'Module'}</span>
                              {task.topic?.difficultyLevel && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-400/90 text-[10px]">
                                    {'★'.repeat(task.topic.difficultyLevel)}
                                    {'☆'.repeat(5 - task.topic.difficultyLevel)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Task Right: Actions */}
                        <div className="flex items-center space-x-1.5 self-end md:self-center flex-shrink-0">
                          {task.taskType === 'Quiz' && (
                            <Link
                              to={`/quiz/${task.topicId}`}
                              className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-semibold transition-colors flex items-center space-x-1"
                            >
                              <FileQuestion className="w-3 h-3" />
                              <span>QUIZ</span>
                            </Link>
                          )}

                          {!isDone && (
                            <button
                              onClick={() => handleTaskStatus(task.id, isInProgress ? 'Not Started' : 'In Progress')}
                              className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition-colors ${
                                isInProgress 
                                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30' 
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#101620]'
                              }`}
                            >
                              {isInProgress ? 'PAUSE' : 'START'}
                            </button>
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
              </div>
            );
          })
        )}
      </div>

      {/* Intelligent Reschedule & Vacation Modal */}
      {isRescheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#080B10] border border-[#1A2330] rounded-xl max-w-lg w-full p-6 shadow-2xl relative animate-scaleUp">
            
            <button
              onClick={() => setIsRescheduleModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#0D121A] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-5">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center text-violet-400">
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-base font-bold text-white font-mono">INTELLIGENT RESCHEDULER</h3>
              </div>
              <p className="text-xs text-slate-400">
                Deterministic DAG reallocation preserving topological order and guarding deadline.
              </p>
            </div>

            {/* Modal Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#030508] rounded-lg mb-5 text-xs font-mono">
              <button
                type="button"
                onClick={() => setRescheduleTab('missed')}
                className={`py-1.5 rounded-md font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  rescheduleTab === 'missed'
                    ? 'bg-[#7C3AED] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TriangleAlert className="w-3 h-3" />
                <span>Missed</span>
              </button>

              <button
                type="button"
                onClick={() => setRescheduleTab('vacation')}
                className={`py-1.5 rounded-md font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  rescheduleTab === 'vacation'
                    ? 'bg-[#7C3AED] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Palmtree className="w-3 h-3" />
                <span>Leave</span>
              </button>

              <button
                type="button"
                onClick={() => setRescheduleTab('pace')}
                className={`py-1.5 rounded-md font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  rescheduleTab === 'pace'
                    ? 'bg-[#7C3AED] text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>Pace</span>
              </button>
            </div>

            {/* TAB 1: Missed Tasks */}
            {rescheduleTab === 'missed' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Select past uncompleted tasks to redistribute into future available slots:
                </p>

                {missedTasksList.length === 0 ? (
                  <div className="p-3.5 rounded-lg bg-[#0D121A] border border-[#1A2330] text-center text-xs text-slate-400 font-mono">
                    Zero overdue tasks. Your schedule is fully on track.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {missedTasksList.map((t) => {
                      const isSelected = selectedMissedTaskIds.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedMissedTaskIds(prev => prev.filter(id => id !== t.id));
                            } else {
                              setSelectedMissedTaskIds(prev => [...prev, t.id]);
                            }
                          }}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-violet-950/30 border-violet-500/50 text-violet-200'
                              : 'bg-[#0D121A] border-[#1A2330] text-slate-400 hover:border-[#26354A]'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {isSelected ? (
                              <CheckSquare className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                            )}
                            <div>
                              <span className="font-semibold block truncate max-w-[280px]">{t.topic?.title}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{t.scheduledDate.split('T')[0]} • {t.durationMinutes}m</span>
                            </div>
                          </div>
                          <span className="text-[9px] uppercase font-mono font-bold text-rose-400">Overdue</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Vacation & Leave */}
            {rescheduleTab === 'vacation' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Select blackout date range to pause study tasks during trips or leave:
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">LEAVE START</label>
                    <input
                      type="date"
                      value={vacationStart}
                      min={todayStr}
                      onChange={(e) => setVacationStart(e.target.value)}
                      className="w-full bg-[#030508] border border-[#1A2330] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">LEAVE END</label>
                    <input
                      type="date"
                      value={vacationEnd}
                      min={vacationStart}
                      onChange={(e) => setVacationEnd(e.target.value)}
                      className="w-full bg-[#030508] border border-[#1A2330] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">REASON / NOTES</label>
                  <input
                    type="text"
                    value={vacationReason}
                    onChange={(e) => setVacationReason(e.target.value)}
                    placeholder="e.g. Travel, exams, personal event"
                    className="w-full bg-[#030508] border border-[#1A2330] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center space-x-2">
                  <Palmtree className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>The engine will zero out study tasks on these days and shift subsequent modules.</span>
                </div>
              </div>
            )}

            {/* TAB 3: Study Pace Booster */}
            {rescheduleTab === 'pace' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Increase daily study capacity to complete the curriculum sooner or safeguard buffer days:
                </p>

                <div className="p-3.5 rounded-lg bg-[#030508] border border-[#1A2330] space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Additional Daily Study</span>
                    <span className="text-violet-400 font-bold">+{paceIncreaseHours}h ({Math.round(paceIncreaseHours * 60)} min/day)</span>
                  </div>

                  <input
                    type="range"
                    min="0.25"
                    max="2.0"
                    step="0.25"
                    value={paceIncreaseHours}
                    onChange={(e) => setPaceIncreaseHours(parseFloat(e.target.value))}
                    className="w-full accent-violet-500 h-1 bg-[#1A2330] rounded cursor-pointer"
                  />

                  <div className="flex justify-between text-[9px] font-mono text-slate-500">
                    <span>+15m</span>
                    <span>+30m</span>
                    <span>+1h</span>
                    <span>+2h</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs">
                  ⚡ Boosting capacity by +{paceIncreaseHours}h preserves more buffer days and reduces deadline stress.
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="mt-6 pt-3 border-t border-[#1A2330] flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsRescheduleModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-[#0D121A] transition-colors"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={() => handleExecuteReschedule()}
                disabled={rescheduling}
                className="px-4 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold font-mono shadow-[0_0_12px_rgba(124,58,237,0.25)] transition-all flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{rescheduling ? 'RECALCULATING...' : 'APPLY PLAN'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
