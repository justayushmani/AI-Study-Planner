import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
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
  Square
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
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.hasActiveGoal) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
          <CalendarIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">No Active Schedule Found</h2>
        <p className="text-slate-400 text-xs">Create your personalized study plan to generate a DAG schedule.</p>
        <Link to="/onboarding" className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all">
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Top Banner Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0e1424] to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                {goal.category}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 font-mono border border-slate-700/60">
                Plan Version {plan?.version || 1}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{goal.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-2">
              <span>Target Cutoff: <strong className="text-slate-200">{goal.deadline}</strong></span>
              <span>•</span>
              <span>Total Modules: <strong className="text-slate-200">{goal.totalTopics || 0}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">🛡️ Buffer Days Protected</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setRescheduleTab('vacation');
                setIsRescheduleModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-semibold shadow-sm transition-all flex items-center space-x-2"
            >
              <Palmtree className="w-4 h-4 text-amber-400" />
              <span>Plan Vacation / Leave</span>
            </button>

            <button
              onClick={() => {
                setRescheduleTab('missed');
                setIsRescheduleModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Intelligent Reschedule</span>
            </button>

            <Link
              to="/what-if"
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center space-x-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>What-If Sandbox</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/70 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60">
            <span className="text-slate-400 block mb-1">Active Study Streak</span>
            <div className="flex items-center space-x-2">
              <Flame className={`w-4 h-4 ${progress.streakDays > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
              <span className="text-base font-bold text-white">{progress.streakDays} Days</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60">
            <span className="text-slate-400 block mb-1">Completion Progress</span>
            <span className="text-base font-bold text-indigo-400">{progress.percentage}%</span>
            <span className="text-slate-500 text-[11px] ml-1.5">({progress.completedTasks}/{progress.totalTasks})</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60">
            <span className="text-slate-400 block mb-1">Hours Mastered</span>
            <span className="text-base font-bold text-emerald-400">{progress.completedHours}h</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/60">
            <span className="text-slate-400 block mb-1">Overdue / Missed Tasks</span>
            <span className={`text-base font-bold ${missedTasksList.length > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {missedTasksList.length} Tasks
            </span>
          </div>
        </div>
      </div>

      {/* Missed Tasks Warning Banner */}
      {missedTasksList.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-rose-950/30 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs sm:text-sm text-rose-200">
                You have {missedTasksList.length} missed study session(s)
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Don't stress! The AI rescheduler will redistribute these missed minutes across upcoming days while guarding your deadline.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setRescheduleTab('missed');
              setIsRescheduleModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all whitespace-nowrap flex items-center justify-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>⚡ Catch Up & Reschedule</span>
          </button>
        </div>
      )}

      {/* Reschedule Diff / Suggestion Banner */}
      {rescheduleDiff && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-200 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-indigo-100">Schedule Successfully Rebalanced</h4>
              <p className="text-xs text-slate-300">
                Redistributed {rescheduleDiff.redistributed_minutes} minutes from {rescheduleDiff.missed_tasks_count} missed tasks.
                {rescheduleDiff.vacation_days_applied > 0 && ` Protected ${rescheduleDiff.vacation_days_applied} vacation day(s).`}
              </p>
              {rescheduleSuggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  {rescheduleSuggestions.map((s, idx) => (
                    <p key={idx} className="text-xs text-amber-300 font-medium flex items-center space-x-1">
                      <span>💡</span>
                      <span>{s}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => setRescheduleDiff(null)} className="text-xs text-indigo-300 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl w-full md:w-auto">
          {[
            { id: 'All', label: 'All Tasks', count: allTasks.length },
            { id: 'Today', label: "Today's Focus", count: allTasks.filter(t => t.scheduledDate.split('T')[0] === todayStr).length },
            { id: 'Upcoming', label: 'Upcoming', count: allTasks.filter(t => t.scheduledDate.split('T')[0] > todayStr).length },
            { id: 'Missed', label: 'Missed', count: missedTasksList.length },
            { id: 'Completed', label: 'Completed', count: allTasks.filter(t => t.status === 'Completed').length },
            { id: 'Quizzes & Revisions', label: 'Quizzes & Revisions', count: allTasks.filter(t => t.taskType === 'Quiz' || t.taskType === 'Revision').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === tab.id ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, modules, units..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Timeline Days List */}
      <div className="space-y-6">
        {dates.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 p-8">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-200">No study tasks found</h3>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your filter tabs or search criteria.
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
                className={`p-6 rounded-3xl border transition-all ${
                  isToday
                    ? 'bg-slate-900/95 border-indigo-500/70 ring-1 ring-indigo-500/30 shadow-xl shadow-indigo-500/10'
                    : isPast && !isAllDayCompleted
                    ? 'bg-slate-900/50 border-rose-900/40'
                    : 'bg-slate-900/40 border-slate-800/80'
                }`}
              >
                {/* Day Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/70 mb-4 gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-sm sm:text-base text-slate-100">
                      {d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                    {isToday && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Today's Schedule
                      </span>
                    )}
                    {isPast && !isAllDayCompleted && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Overdue Tasks
                      </span>
                    )}
                    {isAllDayCompleted && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Completed Day
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
                    <span>{completedInDay}/{tasksForDay.length} Completed</span>
                    <span>•</span>
                    <span className="text-indigo-400 font-bold">{dayMinutes} mins ({dayHours}h)</span>
                  </div>
                </div>

                {/* Tasks for the day */}
                <div className="space-y-3">
                  {tasksForDay.map((task) => {
                    const isDone = task.status === 'Completed';
                    const isMissed = isPast && !isDone;
                    const isInProgress = task.status === 'In Progress';

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          isDone
                            ? 'bg-slate-950/30 border-slate-800/40 opacity-75'
                            : isMissed
                            ? 'bg-rose-950/20 border-rose-900/50 hover:border-rose-700'
                            : isInProgress
                            ? 'bg-indigo-950/30 border-indigo-500/50'
                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {/* Task Left: Checkbox + Topic Details */}
                        <div className="flex items-start sm:items-center space-x-3.5">
                          <button
                            onClick={() => handleTaskStatus(task.id, isDone ? 'Not Started' : 'Completed')}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 mt-0.5 sm:mt-0 ${
                              isDone
                                ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                : 'border-slate-700 hover:border-indigo-400 text-transparent'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 fill-current" />
                          </button>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-xs sm:text-sm font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                                {task.topic?.title || 'Study Session'}
                              </span>

                              {/* Task Type Badge */}
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                task.taskType === 'Revision' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                task.taskType === 'Quiz' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              }`}>
                                {task.taskType}
                              </span>

                              {/* Status Badge */}
                              {isDone && (
                                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                  Done ✓
                                </span>
                              )}
                              {isMissed && (
                                <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
                                  Missed
                                </span>
                              )}
                              {isInProgress && (
                                <span className="text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full animate-pulse">
                                  In Progress
                                </span>
                              )}
                            </div>

                            {/* Meta row: Time, Duration, Module, Difficulty */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span>{task.startTime || "18:00"} - {task.endTime || "18:45"}</span>
                              </span>
                              <span>•</span>
                              <span className="font-mono text-slate-300">{task.durationMinutes} min</span>
                              <span>•</span>
                              <span className="text-slate-400">{task.topic?.unitName || 'Module'}</span>
                              {task.topic?.difficultyLevel && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-400/90 text-[11px]">
                                    {'★'.repeat(task.topic.difficultyLevel)}
                                    {'☆'.repeat(5 - task.topic.difficultyLevel)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Task Right: Actions */}
                        <div className="flex items-center space-x-2 self-end md:self-center">
                          {task.taskType === 'Quiz' && (
                            <Link
                              to={`/quiz/${task.topicId}`}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors flex items-center space-x-1"
                            >
                              <FileQuestion className="w-3.5 h-3.5" />
                              <span>Take Quiz</span>
                            </Link>
                          )}

                          {!isDone && (
                            <button
                              onClick={() => handleTaskStatus(task.id, isInProgress ? 'Not Started' : 'In Progress')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                isInProgress 
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' 
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                              }`}
                            >
                              {isInProgress ? 'Pause' : 'Start'}
                            </button>
                          )}

                          <button
                            onClick={() => handleTaskStatus(task.id, 'Skipped')}
                            className="px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                          >
                            Skip
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative animate-scaleUp">
            
            <button
              onClick={() => setIsRescheduleModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center space-x-2.5 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-white">Intelligent Rescheduler</h3>
              </div>
              <p className="text-xs text-slate-400">
                Deterministic DAG reallocation that preserves topic order and guards your deadline.
              </p>
            </div>

            {/* Modal Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl mb-6 text-xs">
              <button
                type="button"
                onClick={() => setRescheduleTab('missed')}
                className={`py-2 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  rescheduleTab === 'missed'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Missed Tasks</span>
              </button>

              <button
                type="button"
                onClick={() => setRescheduleTab('vacation')}
                className={`py-2 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  rescheduleTab === 'vacation'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Palmtree className="w-3.5 h-3.5" />
                <span>Vacation / Leave</span>
              </button>

              <button
                type="button"
                onClick={() => setRescheduleTab('pace')}
                className={`py-2 rounded-lg font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  rescheduleTab === 'pace'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Study Pace</span>
              </button>
            </div>

            {/* TAB 1: Missed Tasks */}
            {rescheduleTab === 'missed' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Select which past uncompleted tasks you wish to redistribute into future available days:
                </p>

                {missedTasksList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                    🎉 You have zero overdue tasks! Your schedule is fully on track.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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
                          className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-100'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600 flex-shrink-0" />
                            )}
                            <div>
                              <span className="font-semibold block">{t.topic?.title}</span>
                              <span className="text-[10px] text-slate-500">{t.scheduledDate.split('T')[0]} • {t.durationMinutes} min</span>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-rose-400">Missed</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Vacation & Leave */}
            {rescheduleTab === 'vacation' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Going on a family trip, vacation, or taking time off? Select the blackout date range:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Vacation Start</label>
                    <input
                      type="date"
                      value={vacationStart}
                      min={todayStr}
                      onChange={(e) => setVacationStart(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Vacation End</label>
                    <input
                      type="date"
                      value={vacationEnd}
                      min={vacationStart}
                      onChange={(e) => setVacationEnd(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Reason / Notes</label>
                  <input
                    type="text"
                    value={vacationReason}
                    onChange={(e) => setVacationReason(e.target.value)}
                    placeholder="e.g. Family vacation in mountains"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center space-x-2">
                  <Palmtree className="w-4 h-4 flex-shrink-0" />
                  <span>The engine will zero out study tasks during these dates and shift modules forward.</span>
                </div>
              </div>
            )}

            {/* TAB 3: Study Pace Booster */}
            {rescheduleTab === 'pace' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Need to meet your goal sooner or guarantee deadline safety? Increase daily study time:
                </p>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Additional Daily Study Time</span>
                    <span className="font-mono text-indigo-400 font-bold">+{paceIncreaseHours}h ({Math.round(paceIncreaseHours * 60)} min/day)</span>
                  </div>

                  <input
                    type="range"
                    min="0.25"
                    max="2.0"
                    step="0.25"
                    value={paceIncreaseHours}
                    onChange={(e) => setPaceIncreaseHours(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>+15 mins</span>
                    <span>+30 mins</span>
                    <span>+1 hour</span>
                    <span>+2 hours</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
                  ⚡ Boosting your daily capacity by +{paceIncreaseHours}h gives you more buffer days and lowers deadline stress.
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsRescheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleExecuteReschedule()}
                disabled={rescheduling}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{rescheduling ? 'Recalculating DAG Plan...' : 'Recalculate & Apply Plan'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
