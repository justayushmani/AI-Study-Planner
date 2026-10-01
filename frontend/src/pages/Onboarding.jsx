import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Target, 
  CalendarDays, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Sparkles, 
  BookOpen, 
  SlidersHorizontal, 
  FileUp,
  TriangleAlert,
  ShieldCheck,
  Zap
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      
      {/* Step Indicator Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#1A2330]">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center text-violet-400 font-mono font-bold text-xs">
            0{step}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">
              {step === 1 && 'Choose Goal & Curriculum'}
              {step === 2 && 'Availability & Target Cutoff'}
              {step === 3 && 'Skill Level & Weak Topic Calibration'}
              {step === 4 && 'Revision Cadence & Buffer Safeguards'}
            </h2>
            <p className="text-[11px] text-slate-500 font-mono">PHASE {step} OF 4</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`h-1.5 w-6 rounded transition-all ${
                s <= step ? 'bg-[#7C3AED] shadow-[0_0_8px_rgba(124,58,237,0.4)]' : 'bg-[#101620]'
              }`}
            />
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#080B10] border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <TriangleAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Goal Selection */}
      {step === 1 && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <h3 className="text-base font-bold text-slate-100 font-mono">SELECT LEARNING CURRICULUM</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose a structured prerequisite-modeled learning path or upload your own custom syllabus outline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {predefinedGoals.map((g) => {
              const isSelected = selectedGoal?.id === g.id;
              return (
                <div
                  key={g.id}
                  onClick={() => selectTemplate(g)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#0D121A] border-violet-500/80 shadow-[0_0_15px_rgba(124,58,237,0.15)] ring-1 ring-violet-500/40'
                      : 'bg-[#080B10] border-[#1A2330] hover:border-[#26354A]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-[#030508] text-slate-400 border border-[#1A2330]">
                        {g.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-100 mt-1.5">{g.title}</h4>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded bg-[#7C3AED] flex items-center justify-center text-white">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{g.description}</p>
                  <div className="mt-3 pt-2.5 border-t border-[#1A2330] flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{g.topics?.length || 0} Core Topics</span>
                    <span>~{g.defaultDurationWeeks} Weeks</span>
                  </div>
                </div>
              );
            })}

            {/* Custom Syllabus Card */}
            <Link
              to="/syllabus"
              className="p-4 rounded-xl border border-dashed border-[#1A2330] hover:border-violet-500/60 bg-[#080B10]/40 hover:bg-[#080B10] transition-all flex flex-col justify-center items-center text-center group"
            >
              <div className="p-2.5 rounded-lg bg-[#7C3AED]/15 group-hover:bg-[#7C3AED]/25 text-violet-400 mb-2">
                <FileUp className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-100 font-mono">Upload Custom Syllabus</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                Upload a PDF, DOCX, or paste syllabus text. The Groq engine will parse units and prerequisite graphs automatically.
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* STEP 2: Availability & Target Deadline */}
      {step === 2 && (
        <div className="space-y-4 animate-fadeIn">
          <div>
            <h3 className="text-base font-bold text-slate-100 font-mono">TIMELINE & TIME CAPACITY</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Specify your preparation start date, target deadline, and daily study capacity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#080B10] border border-[#1A2330] space-y-3.5">
              
              {/* Preparation Start Date */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5">Preparation Start Date</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                  {[
                    { id: 'today', label: 'Today', icon: '⚡' },
                    { id: 'tomorrow', label: 'Tomorrow', icon: '🌅' },
                    { id: 'next_monday', label: 'Monday', icon: '📅' },
                    { id: 'custom', label: 'Custom', icon: '🎯' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleStartModeChange(opt.id)}
                      className={`py-1.5 px-1 rounded-md text-[11px] font-mono border text-center transition-all ${
                        startMode === opt.id
                          ? 'bg-[#7C3AED]/20 border-violet-500 text-violet-200 font-bold'
                          : 'bg-[#030508] border-[#1A2330] text-slate-400 hover:border-[#26354A]'
                      }`}
                    >
                      <span>{opt.icon} {opt.label}</span>
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
                  className="w-full bg-[#030508] border border-[#1A2330] rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-violet-500"
                />
              </div>

              {/* Target Deadline */}
              <div className="pt-2.5 border-t border-[#1A2330]">
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Target Completion Cutoff</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={startDate}
                  className="w-full bg-[#030508] border border-[#1A2330] rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="pt-2.5 border-t border-[#1A2330] space-y-1.5">
                <label className="block text-[11px] font-mono uppercase text-slate-400">Preferred Daily Study Window</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Morning', 'Afternoon', 'Evening'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setPreferredStudyTime(slot)}
                      className={`py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                        preferredStudyTime === slot
                          ? 'bg-[#7C3AED]/20 border-violet-500 text-violet-200 font-bold'
                          : 'bg-[#030508] border-[#1A2330] text-slate-400 hover:border-[#26354A]'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Hours Slider */}
            <div className="p-4 rounded-xl bg-[#080B10] border border-[#1A2330] space-y-2.5">
              <label className="block text-[11px] font-mono uppercase text-slate-400">Weekly Hour Capacities</label>
              <div className="space-y-2">
                {daysList.map((day) => (
                  <div key={day} className="flex items-center justify-between space-x-2.5 text-xs font-mono">
                    <span className="w-20 text-slate-400 text-[11px]">{day}</span>
                    <input
                      type="range"
                      min="0"
                      max="6"
                      step="0.5"
                      value={weeklyHours[day]}
                      onChange={(e) => handleHourChange(day, e.target.value)}
                      className="flex-1 accent-violet-500 h-1 bg-[#1A2330] rounded cursor-pointer"
                    />
                    <span className="w-10 text-right font-mono font-bold text-violet-400 text-xs">
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
        <div className="space-y-4 animate-fadeIn">
          <div>
            <h3 className="text-base font-bold text-slate-100 font-mono">CONFIDENCE CALIBRATION</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Flag modules where you feel less confident (1 or 2). The scheduler allocates higher priority and extra spaced revision slots for them.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#080B10] border border-[#1A2330] space-y-2.5 max-h-[420px] overflow-y-auto">
            {selectedGoal?.topics?.map((topic) => {
              const key = topic.id || topic.title;
              const currentScore = topicConfidence[key] || 3;
              return (
                <div
                  key={key}
                  className="p-3 rounded-lg bg-[#0D121A] border border-[#1A2330] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-semibold text-slate-200">{topic.title}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">({topic.unitName})</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{topic.description}</p>
                  </div>

                  {/* Confidence Buttons 1 to 5 */}
                  <div className="flex items-center space-x-1 flex-shrink-0">
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
                        className={`w-6 h-6 rounded text-xs font-mono font-bold transition-all ${
                          currentScore === btn.val
                            ? btn.val <= 2
                              ? 'bg-rose-500 text-white shadow-sm'
                              : btn.val === 3
                              ? 'bg-[#7C3AED] text-white shadow-sm'
                              : 'bg-emerald-500 text-slate-950 shadow-sm'
                            : 'bg-[#030508] border border-[#1A2330] text-slate-400 hover:border-[#26354A]'
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
        <div className="space-y-4 animate-fadeIn">
          <div>
            <h3 className="text-base font-bold text-slate-100 font-mono">REVISION & BUFFER PROTECTION</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Safeguard parameters to prevent cramming and burnout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="p-4 rounded-xl bg-[#080B10] border border-[#1A2330] space-y-3">
              <label className="block text-[11px] font-mono uppercase text-slate-400">Spaced Revision Cadence</label>
              <select
                value={revisionFrequencyDays}
                onChange={(e) => setRevisionFrequencyDays(e.target.value)}
                className="w-full bg-[#030508] border border-[#1A2330] rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-violet-500"
              >
                <option value="5">Every 5 Days (High Retention)</option>
                <option value="7">Every 7 Days (Balanced - Recommended)</option>
                <option value="14">Every 14 Days (Fast Track)</option>
              </select>
              <p className="text-[10px] text-slate-500 font-mono">
                Schedules recall sessions for topics already completed.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#080B10] border border-[#1A2330] space-y-3">
              <label className="block text-[11px] font-mono uppercase text-slate-400">Trailing Buffer Days</label>
              <select
                value={bufferDays}
                onChange={(e) => setBufferDays(e.target.value)}
                className="w-full bg-[#030508] border border-[#1A2330] rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-violet-500"
              >
                <option value="2">2 Days (Tight)</option>
                <option value="3">3 Days (Recommended)</option>
                <option value="5">5 Days (Comfortable)</option>
                <option value="7">7 Days (Comprehensive Review)</option>
              </select>
              <p className="text-[10px] text-slate-500 font-mono">
                Reserved days before cutoff for missed task overflow.
              </p>
            </div>

          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-[#080B10] border border-violet-500/30 space-y-1.5 shadow-[0_0_15px_rgba(124,58,237,0.08)]">
            <h4 className="text-xs font-bold text-violet-300 font-mono uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Deterministic Engine Readiness</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Once you confirm, the deterministic DAG scheduler will perform topological sorting, calculate composite priority weights (factoring weak areas), and generate an adaptive timetable.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="mt-6 pt-4 border-t border-[#1A2330] flex items-center justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="px-3.5 py-1.5 rounded-lg border border-[#1A2330] hover:bg-[#0D121A] text-slate-300 text-xs font-mono font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>PREVIOUS</span>
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="px-4 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-mono font-semibold shadow-[0_0_12px_rgba(124,58,237,0.25)] flex items-center space-x-1.5 transition-all"
          >
            <span>CONTINUE</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-xs font-bold font-mono shadow-[0_0_15px_rgba(124,58,237,0.3)] flex items-center space-x-2 transition-all"
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>GENERATING SCHEDULE...</span>
              </>
            ) : (
              <>
                <span>GENERATE STUDY PLAN</span>
                <Check className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

    </div>
  );
}
