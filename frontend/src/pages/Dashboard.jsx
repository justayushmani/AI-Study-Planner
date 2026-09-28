import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Target, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Flame, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  BookOpen, 
  Sparkles,
  TrendingUp,
  FileQuestion,
  Layers,
  ChevronRight
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
    try {
      await taskService.updateStatus(taskId, newStatus);
      fetchDashboard();
    } catch (err) {
      console.error('Failed to update task:', err);
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
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading personalized study plan...</p>
        </div>
      </div>
    );
  }

  if (!data?.hasActiveGoal) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-6">
          <Target className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight sm:text-4xl mb-4">
          Ready to achieve your study goal?
        </h1>
        <p className="max-w-xl mx-auto text-base text-slate-400 mb-8 leading-relaxed">
          Create an adaptive, dependency-aware study schedule. If you miss a study session or have a busy week, the deterministic scheduler automatically redistributes the workload without breaking your target deadline.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/onboarding"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
          >
            <span>Start Goal Setup</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/syllabus"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>Upload Syllabus PDF</span>
          </Link>
        </div>
      </div>
    );
  }

  const { goal, plan, progress, todayTasks, upcomingTasks, weakTopics, weeklyChart } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Reschedule Success Alert */}
      {rescheduleDiff && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-emerald-200">Schedule Intelligently Recalculated!</h4>
              <p className="text-xs text-emerald-300/80 mt-1">
                Redistributed {rescheduleDiff.redistributed_minutes} minutes from {rescheduleDiff.missed_tasks_count} missed tasks across remaining study days. 
                Target deadline is strictly maintained, preserving {rescheduleDiff.buffer_days_preserved} buffer days.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setRescheduleDiff(null)}
            className="text-xs text-emerald-400 hover:text-emerald-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Missed Tasks Warning Banner */}
      {progress.missedTasksCount > 0 && !rescheduleDiff && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-amber-200">
                {progress.missedTasksCount} Missed Study Task{progress.missedTasksCount > 1 ? 's' : ''} Detected
              </h4>
              <p className="text-xs text-amber-300/80">
                You have overdue tasks. Trigger the deterministic scheduler to dynamically redistribute them across remaining days.
              </p>
            </div>
          </div>
          <button
            onClick={handleReschedule}
            disabled={rescheduling}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${rescheduling ? 'animate-spin' : ''}`} />
            <span>{rescheduling ? 'Recalculating...' : 'Intelligent Reschedule'}</span>
          </button>
        </div>
      )}

      {/* Goal Header Card */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-indigo-950/40 border border-slate-800 shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {goal.category}
              </span>
              <span className="text-xs text-slate-400 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Target Deadline: <strong className="text-slate-200">{goal.deadline}</strong></span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
              {goal.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Proficiency: <span className="text-indigo-300 font-medium">{goal.proficiencyLevel}</span> • Plan Version: <span className="text-slate-300 font-mono">v{plan?.version || 1}</span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/what-if"
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-all flex items-center space-x-2"
            >
              <span>What-If Sandbox</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <Link
              to="/schedule"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
            >
              <span>View Full Calendar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 font-medium">Curriculum Completion</span>
            <span className="text-indigo-400 font-bold font-mono text-sm">{progress.percentage}%</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Study Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {progress.streakDays} <span className="text-xs font-sans text-slate-400 font-normal">days</span>
          </div>
          <p className="text-[11px] text-emerald-400">Consistent learning pace</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Completed Time</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {progress.completedHours} <span className="text-xs font-sans text-slate-400 font-normal">hours</span>
          </div>
          <p className="text-[11px] text-slate-400">{progress.completedTasks} tasks finished</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Scheduled Tasks</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {progress.totalTasks} <span className="text-xs font-sans text-slate-400 font-normal">total</span>
          </div>
          <p className="text-[11px] text-slate-400">{progress.totalTasks - progress.completedTasks} remaining</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Identified Weak Areas</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {weakTopics.length} <span className="text-xs font-sans text-slate-400 font-normal">topics</span>
          </div>
          <p className="text-[11px] text-rose-400">Priority weighted in scheduler</p>
        </div>

      </div>

      {/* Main Grid: Today's Tasks + Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Today's Action Plan */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-base">Today's Study Sessions</h3>
                <p className="text-xs text-slate-400">Check off tasks as you finish them</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
                {todayTasks.length} task{todayTasks.length === 1 ? '' : 's'} scheduled
              </span>
            </div>

            {todayTasks.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-800 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-200">No more tasks scheduled for today!</p>
                <p className="text-xs text-slate-500 mt-1">Great job! Enjoy your rest or run a practice quiz.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayTasks.map((task) => {
                  const isDone = task.status === 'Completed';
                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        isDone
                          ? 'bg-slate-950/40 border-slate-800/40 opacity-70'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
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
                            <span>Take Quiz</span>
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
            )}
          </div>

          {/* Workload & Velocity Chart */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-base">Study Velocity</h3>
                <p className="text-xs text-slate-400">Planned vs Actual Completed Hours (Past 7 Days)</p>
              </div>
              <TrendingUp className="w-5 h-5 text-indigo-400" />
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="h" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="plannedHours" name="Planned Hours" fill="#475569" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completedHours" name="Completed Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column (1 Col): Weak Areas & Upcoming Tasks */}
        <div className="space-y-6">
          
          {/* Weak Topics Priority Card */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-base flex items-center space-x-2">
                <span>Priority Focus Areas</span>
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                Low Confidence
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              These topics have confidence score ≤ 2. The deterministic scheduler assigns them extra repetition and high priority.
            </p>

            {weakTopics.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No weak areas flagged. You're confident across all topics!
              </div>
            ) : (
              <div className="space-y-2.5">
                {weakTopics.slice(0, 4).map((topic) => (
                  <div
                    key={topic.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{topic.title}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">{topic.unitName} • Difficulty {topic.difficultyLevel}/5</p>
                    </div>
                    <Link
                      to={`/quiz/${topic.id}`}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-colors"
                    >
                      Quiz
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Schedule Peek */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-base">Next in Queue</h3>
              <Link to="/schedule" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {upcomingTasks.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-300">{t.topic?.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(t.scheduledDate).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })} • {t.durationMinutes} min
                    </p>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {t.taskType}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick AI Coaching Trigger */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-900/60 border border-indigo-500/20 space-y-3">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h4 className="font-bold text-slate-100 text-sm">Antigravity Study Mentor</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Have doubts about an upcoming topic or want a breakdown of the dynamic rescheduling formula?
            </p>
            <button
              onClick={onOpenAssistant}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              Open AI Study Coach
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
