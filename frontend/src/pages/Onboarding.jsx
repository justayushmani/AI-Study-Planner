import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Target, 
  Calendar, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Sparkles, 
  BookOpen, 
  Sliders, 
  FileUp,
  AlertCircle
} from 'lucide-react';
import { goalService, planService } from '../services/api';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [predefinedGoals, setPredefinedGoals] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Coding');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startMode, setStartMode] = useState('today');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 45); // default 45 days in future
    return d.toISOString().split('T')[0];
  });
  const [proficiencyLevel, setProficiencyLevel] = useState('Intermediate');
  const [preferredStudyTime, setPreferredStudyTime] = useState('Evening');
  const [learningPreference, setLearningPreference] = useState('Balanced');
  const [revisionFrequencyDays, setRevisionFrequencyDays] = useState(7);
  const [bufferDays, setBufferDays] = useState(3);

  const handleStartModeChange = (mode) => {
    setStartMode(mode);
    const d = new Date();
    if (mode === 'today') {
      setStartDate(d.toISOString().split('T')[0]);
    } else if (mode === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      setStartDate(d.toISOString().split('T')[0]);
    } else if (mode === 'next_monday') {
      const day = d.getDay();
      const diff = (7 - day + 1) % 7 || 7; // days until next Monday
      d.setDate(d.getDate() + diff);
      setStartDate(d.toISOString().split('T')[0]);
    }
  };

  // Weekly hours map
  const [weeklyHours, setWeeklyHours] = useState({
    Monday: 2.0,
    Tuesday: 2.0,
    Wednesday: 2.0,
    Thursday: 2.0,
    Friday: 2.0,
    Saturday: 3.5,
    Sunday: 3.5
  });

  // Confidence mapping for topics
  const [topicConfidence, setTopicConfidence] = useState({});

  useEffect(() => {
    goalService.getPredefined()
      .then(goals => {
        setPredefinedGoals(goals);
        if (goals.length > 0) {
          selectTemplate(goals[0]);
        }
      })
      .catch(err => console.error('Failed to load templates:', err));
  }, []);

  const selectTemplate = (g) => {
    setSelectedGoal(g);
    setTitle(g.title);
    setCategory(g.category);

    // Initial confidence defaults
    const conf = {};
    g.topics?.forEach(t => {
      conf[t.id || t.title] = 3;
    });
    setTopicConfidence(conf);
  };

  const handleHourChange = (day, val) => {
    setWeeklyHours(prev => ({
      ...prev,
      [day]: parseFloat(val)
    }));
  };

  const handleConfidenceChange = (topicKey, level) => {
    setTopicConfidence(prev => ({
      ...prev,
      [topicKey]: level
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Find topics with confidence <= 2
      const weakTopicTitles = [];
      selectedGoal?.topics?.forEach(t => {
        const key = t.id || t.title;
        if (topicConfidence[key] <= 2) {
          weakTopicTitles.push(t.title);
        }
      });

      // 1. Create Goal
      const goalPayload = {
        title,
        category,
        targetDeadline: deadline,
        proficiencyLevel,
        weeklyAvailability: weeklyHours,
        preferredStudyTime,
        learningPreference,
        revisionFrequencyDays: parseInt(revisionFrequencyDays),
        bufferDays: parseInt(bufferDays),
        predefinedGoalId: selectedGoal?.id,
        weakTopicTitles
      };

      const createdGoal = await goalService.createGoal(goalPayload);

      // 2. Generate Plan with Deterministic Scheduler
      await planService.generatePlan(createdGoal.id, startDate);

      navigate('/schedule');
    } catch (err) {
      console.error('Goal creation failed:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create plan');
      setLoading(false);
    }
  };

  const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
            {step}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              {step === 1 && 'Choose Your Goal & Curriculum'}
              {step === 2 && 'Availability & Target Deadline'}
              {step === 3 && 'Skill Level & Weak Topic Calibration'}
              {step === 4 && 'Revision & Scheduling Preferences'}
            </h2>
            <p className="text-xs text-slate-400">Step {step} of 4</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`h-1.5 w-6 rounded-full transition-all ${
                s <= step ? 'bg-indigo-500' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Goal Selection */}
      {step === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-xl font-bold text-slate-100">What are you studying for?</h3>
            <p className="text-xs text-slate-400 mt-1">
              Select one of our structured, prerequisite-modeled learning paths or upload your custom syllabus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predefinedGoals.map((g) => {
              const isSelected = selectedGoal?.id === g.id;
              return (
                <div
                  key={g.id}
                  onClick={() => selectTemplate(g)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/30 border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {g.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-100 mt-2">{g.title}</h4>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-slate-950">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{g.description}</p>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{g.topics?.length || 0} Core Topics</span>
                    <span>~{g.defaultDurationWeeks} Weeks Recommended</span>
                  </div>
                </div>
              );
            })}

            {/* Custom Syllabus Card */}
            <Link
              to="/syllabus"
              className="p-5 rounded-2xl border border-dashed border-slate-700 hover:border-indigo-400 bg-slate-900/30 hover:bg-slate-900/60 transition-all flex flex-col justify-center items-center text-center group"
            >
              <div className="p-3 rounded-xl bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400 mb-3">
                <FileUp className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Upload Custom Syllabus</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Upload a PDF, DOCX, or paste syllabus text. The AI will extract modules and topic dependencies for you.
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* STEP 2: Availability & Target Deadline */}
      {step === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-xl font-bold text-slate-100">When and how much can you study?</h3>
            <p className="text-xs text-slate-400 mt-1">
              Specify when to start your preparation, your target deadline, and daily available study hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              
              {/* Preparation Start Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-2">When do you want to start preparation?</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {[
                    { id: 'today', label: 'Today', icon: '⚡' },
                    { id: 'tomorrow', label: 'Tomorrow', icon: '🌅' },
                    { id: 'next_monday', label: 'Next Monday', icon: '📅' },
                    { id: 'custom', label: 'Custom', icon: '🎯' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleStartModeChange(opt.id)}
                      className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition-all ${
                        startMode === opt.id
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="block text-sm mb-0.5">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setStartMode('custom');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Start Date: <strong className="text-indigo-300">{new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                </p>
              </div>

              {/* Target Deadline */}
              <div className="pt-3 border-t border-slate-800/80">
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">Target Completion Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={startDate}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  The scheduler packs all topics between start date and this cutoff.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">Preferred Daily Study Window</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Morning', 'Afternoon', 'Evening'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setPreferredStudyTime(slot)}
                      className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                        preferredStudyTime === slot
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Hours Slider */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Weekly Hour Capacities</label>
              <div className="space-y-2.5">
                {daysList.map((day) => (
                  <div key={day} className="flex items-center justify-between space-x-3 text-xs">
                    <span className="w-24 text-slate-400 font-medium">{day}</span>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      step="0.5"
                      value={weeklyHours[day]}
                      onChange={(e) => handleHourChange(day, e.target.value)}
                      className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="w-12 text-right font-mono font-bold text-indigo-400">
                      {weeklyHours[day]}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Weak Topics & Confidence Calibration */}
      {step === 3 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Rate your initial confidence</h3>
            <p className="text-xs text-slate-400 mt-1">
              Mark topics you find challenging (1 or 2). The engine will allocate them higher priority, extra revision, and earlier placement in the dependency graph.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 max-h-[450px] overflow-y-auto">
            {selectedGoal?.topics?.map((topic) => {
              const key = topic.id || topic.title;
              const currentScore = topicConfidence[key] || 3;
              return (
                <div
                  key={key}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-semibold text-slate-200">{topic.title}</h4>
                      <span className="text-[10px] text-slate-500">({topic.unitName})</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{topic.description}</p>
                  </div>

                  {/* Confidence Buttons 1 to 5 */}
                  <div className="flex items-center space-x-1.5">
                    {[
                      { val: 1, label: 'Very Weak' },
                      { val: 2, label: 'Weak' },
                      { val: 3, label: 'Average' },
                      { val: 4, label: 'Good' },
                      { val: 5, label: 'Strong' }
                    ].map((btn) => (
                      <button
                        key={btn.val}
                        type="button"
                        onClick={() => handleConfidenceChange(key, btn.val)}
                        title={btn.label}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          currentScore === btn.val
                            ? btn.val <= 2
                              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                              : btn.val === 3
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                              : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {btn.val}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: Revision & Buffer Preferences */}
      {step === 4 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Revision & Buffer Protection</h3>
            <p className="text-xs text-slate-400 mt-1">
              Final safeguards to prevent cramming and burnout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <label className="block text-xs font-semibold text-slate-300">Spaced Revision Cadence</label>
              <select
                value={revisionFrequencyDays}
                onChange={(e) => setRevisionFrequencyDays(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="5">Every 5 Days (High Retention)</option>
                <option value="7">Every 7 Days (Balanced - Recommended)</option>
                <option value="14">Every 14 Days (Fast Track)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Automatically schedules a 30-minute recall slot after topics are completed.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <label className="block text-xs font-semibold text-slate-300">Trailing Buffer Days</label>
              <select
                value={bufferDays}
                onChange={(e) => setBufferDays(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="2">2 Days (Tight)</option>
                <option value="3">3 Days (Recommended)</option>
                <option value="5">5 Days (Comfortable)</option>
                <option value="7">7 Days (Comprehensive Review)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Days reserved before your deadline for missed task overflow and mock exams.
              </p>
            </div>

          </div>

          {/* Summary Box */}
          <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
            <h4 className="text-xs font-bold text-indigo-300 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Deterministic Engine Readiness</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Once you confirm, the deterministic engine will execute DAG cycle validation, compute composite priority weights (incorporating your weak topics), and generate a complete day-by-day timetable.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center space-x-2 transition-all"
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Schedule...</span>
              </>
            ) : (
              <>
                <span>Generate Study Plan</span>
                <Check className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
}
