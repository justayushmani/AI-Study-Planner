import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileQuestion, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw, 
  Award,
  Sparkles,
  TriangleAlert,
  Check,
  X
} from 'lucide-react';
import { quizService } from '../services/api';

export default function QuizView() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (topicId) {
      quizService.generateQuiz(topicId)
        .then(data => {
          setQuiz(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [topicId]);

  const handleSelectOption = (questionIndex, optionIndex) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    if (submitting || !quiz) return;
    setSubmitting(true);
    try {
      const res = await quizService.submitQuiz(quiz.id, selectedAnswers);
      setResult(res);
      setSubmitted(true);
    } catch (err) {
      alert('Failed to submit quiz: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-mono tracking-tight">GENERATING DIAGNOSTIC ASSESSMENT VIA GROQ LLM...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-md mx-auto py-20 text-center text-slate-400 text-xs font-mono">
        COULD NOT LOAD QUIZ QUESTIONS FOR THIS TOPIC.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="pb-4 border-b border-[#1A2330] flex items-center justify-between">
        <div>
          <span className="text-[9px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-[#7C3AED]/15 text-violet-300 border border-[#7C3AED]/30">
            DIAGNOSTIC ASSESSMENT
          </span>
          <h1 className="text-lg sm:text-xl font-bold text-slate-100 mt-1.5 font-mono">{quiz.title}</h1>
        </div>
        <div className="w-8 h-8 rounded-lg bg-[#080B10] border border-[#1A2330] flex items-center justify-center text-violet-400">
          <FileQuestion className="w-4 h-4" />
        </div>
      </div>

      {/* Quiz Questions */}
      <div className="space-y-4">
        {quiz.questions.map((q, qIdx) => {
          const selected = selectedAnswers[qIdx];
          const feedbackItem = result?.feedback?.[qIdx];

          return (
            <div
              key={qIdx}
              className="p-5 rounded-xl bg-[#080B10] border border-[#1A2330] space-y-3.5"
            >
              <h3 className="font-semibold text-xs sm:text-sm text-slate-100">
                <span className="text-violet-400 font-mono mr-2">0{qIdx + 1}.</span>
                {q.question}
              </h3>

              <div className="space-y-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selected === optIdx;
                  let optStyle = 'bg-[#0D121A] border-[#1A2330] text-slate-300 hover:border-[#26354A]';

                  if (submitted) {
                    if (optIdx === q.correct_index) {
                      optStyle = 'bg-emerald-950/30 border-emerald-500/80 text-emerald-200';
                    } else if (isSelected && optIdx !== q.correct_index) {
                      optStyle = 'bg-rose-950/30 border-rose-500/80 text-rose-200';
                    }
                  } else if (isSelected) {
                    optStyle = 'bg-[#7C3AED]/20 border-violet-500 text-violet-200 shadow-[0_0_10px_rgba(124,58,237,0.15)]';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`w-full text-left p-3 rounded-lg border text-xs sm:text-sm transition-all flex items-center justify-between ${optStyle}`}
                    >
                      <span>{opt}</span>
                      {submitted && optIdx === q.correct_index && (
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 ml-2 stroke-[3]" />
                      )}
                      {submitted && isSelected && optIdx !== q.correct_index && (
                        <X className="w-4 h-4 text-rose-400 flex-shrink-0 ml-2 stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {submitted && feedbackItem && (
                <div className="p-3 rounded-lg bg-[#030508] border border-[#1A2330] text-xs text-slate-300 space-y-1">
                  <span className="font-semibold text-violet-300 font-mono text-[11px] uppercase tracking-wider block">Explanation:</span>
                  <p className="leading-relaxed text-slate-300">{feedbackItem.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Result Card */}
      {submitted && result && (
        <div className="p-6 rounded-xl bg-[#080B10] border border-[#1A2330] space-y-4 text-center shadow-2xl animate-fadeIn">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 font-mono">
              Score: {result.score} / {result.maxScore} ({result.percentage}%)
            </h3>
            {result.confidenceCalibrated && (
              <p className="text-xs text-violet-300 mt-1 flex items-center justify-center space-x-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Topic priority dynamically adjusted in future scheduling cycles.</span>
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/schedule')}
            className="px-5 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold font-mono text-xs shadow-[0_0_12px_rgba(124,58,237,0.25)] transition-colors inline-flex items-center space-x-1.5"
          >
            <span>RETURN TO SCHEDULE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Submit Button */}
      {!submitted && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(selectedAnswers).length === 0}
            className="px-5 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white font-bold font-mono text-xs shadow-[0_0_15px_rgba(124,58,237,0.3)] flex items-center space-x-1.5 transition-all"
          >
            <span>{submitting ? 'EVALUATING...' : 'SUBMIT ANSWERS'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
