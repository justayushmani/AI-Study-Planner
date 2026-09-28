import React, { useState, useEffect } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { statsService, taskService, planService } from '../services/api';

export default function ScheduleView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleDiff, setRescheduleDiff] = useState(null);
  const [filterType, setFilterType] = useState('All');

  const loadSchedule = async () => {
    try {
      const res = await statsService.getDashboard();
      setData(res);
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
    try {
      await taskService.updateStatus(taskId, newStatus);
      loadSchedule();
    } catch (err) {
      console.error('Task status update failed:', err);
    }
  };

  const handleReschedule = async () => {
    if (!data?.plan?.id) return;
    setRescheduling(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await planService.reschedulePlan(data.plan.id, todayStr);
      setRescheduleDiff(res.diff);
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
        <p className="text-slate-400 text-sm">No active schedule found.</p>
        <Link to="/onboarding" className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold">
          Create Goal & Plan
        </Link>
      </div>
    );
  }

  const { goal, plan, todayTasks, upcomingTasks, progress } = data;
  const allTasks = [...todayTasks, ...upcomingTasks];

  // Group tasks by scheduled date
  const groupedTasks = allTasks.reduce((acc, t) => {
    const dStr = new Date(t.scheduledDate).toISOString().split('T')[0];
    if (!acc[dStr]) acc[dStr] = [];
    acc[dStr].push(t);
    return acc;
  }, {});

  const dates = Object.keys(groupedTasks).sort();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-100">{goal.title}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
              Plan v{plan?.version || 1}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Target Cutoff: <strong className="text-slate-200">{goal.deadline}</strong> • Buffer Days Protected
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/what-if"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            What-If Simulator
          </Link>

          <button
            onClick={handleReschedule}
            disabled={rescheduling}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center space-x-2 transition-all"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${rescheduling ? 'animate-spin' : ''}`} />
            <span>{rescheduling ? 'Recalculating...' : 'Intelligent Reschedule'}</span>
          </button>
        </div>
      </div>

      {/* Reschedule Diff Alert */}
      {rescheduleDiff && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-200 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-indigo-100">Deterministic Engine Recalculated Plan</h4>
              <p className="text-xs text-slate-300 mt-1">
                Redistributed {rescheduleDiff.redistributed_minutes} minutes from {rescheduleDiff.missed_tasks_count} missed tasks.
                Your deadline ({goal.deadline}) is safe and maintained.
              </p>
            </div>
          </div>
          <button onClick={() => setRescheduleDiff(null)} className="text-xs text-indigo-300 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Timeline Days */}
      <div className="space-y-6">
        {dates.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No tasks currently scheduled.</div>
        ) : (
          dates.map((dStr) => {
            const tasksForDay = groupedTasks[dStr];
            const d = new Date(dStr + 'T00:00:00');
            const isToday = dStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={dStr}
                className={`p-6 rounded-3xl border transition-all ${
                  isToday
                    ? 'bg-slate-900/90 border-indigo-500/60 ring-1 ring-indigo-500/30 shadow-xl shadow-indigo-500/5'
                    : 'bg-slate-900/40 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-sm sm:text-base text-slate-100">
                      {d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                    {isToday && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {tasksForDay.reduce((s, t) => s + t.durationMinutes, 0)} min total
                  </span>
                </div>

                {/* Tasks for the day */}
                <div className="space-y-3">
                  {tasksForDay.map((task) => {
                    const isDone = task.status === 'Completed';
                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                          isDone
                            ? 'bg-slate-950/40 border-slate-800/40 opacity-70'
                            : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3.5">
                          <button
                            onClick={() => handleTaskStatus(task.id, isDone ? 'Not Started' : 'Completed')}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                              isDone
                                ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                                : 'border-slate-700 hover:border-indigo-400 text-transparent'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 fill-current" />
                          </button>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-semibold text-slate-200">
                                {task.topic?.title || 'Study Session'}
                              </span>
                              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                task.taskType === 'Revision' ? 'bg-purple-500/20 text-purple-300' :
                                task.taskType === 'Quiz' ? 'bg-amber-500/20 text-amber-300' :
                                'bg-indigo-500/20 text-indigo-300'
                              }`}>
                                {task.taskType}
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                              <span>{task.startTime} - {task.endTime}</span>
                              <span>•</span>
                              <span>{task.durationMinutes} min</span>
                              <span>•</span>
                              <span className="text-slate-500">{task.topic?.unitName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {task.taskType === 'Quiz' && (
                            <Link
                              to={`/quiz/${task.topicId}`}
                              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors flex items-center space-x-1"
                            >
                              <FileQuestion className="w-3.5 h-3.5" />
                              <span>Quiz</span>
                            </Link>
                          )}
                          <button
                            onClick={() => handleTaskStatus(task.id, 'Skipped')}
                            className="px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
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

    </div>
  );
}
