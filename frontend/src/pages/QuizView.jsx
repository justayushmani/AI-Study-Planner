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
  AlertTriangle
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
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Generating diagnostic assessment with Groq AI...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-md mx-auto py-20 text-center text-slate-400 text-sm">
        Could not load quiz questions for this topic.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="pb-6 border-b border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
            Diagnostic Assessment
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-2">{quiz.title}</h1>
        </div>
        <FileQuestion className="w-8 h-8 text-indigo-400" />
      </div>

      {/* Quiz Questions */}
      <div className="space-y-6">
        {quiz.questions.map((q, qIdx) => {
          const selected = selectedAnswers[qIdx];
          const feedbackItem = result?.feedback?.[qIdx];

          return (
            <div
              key={qIdx}
              className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4"
            >
              <h3 className="font-semibold text-sm sm:text-base text-slate-100">
                <span className="text-indigo-400 font-mono mr-2">{qIdx + 1}.</span>
                {q.question}
              </h3>

              <div className="space-y-2.5">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selected === optIdx;
                  let optStyle = 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700';

                  if (submitted) {
                    if (optIdx === q.correct_index) {
                      optStyle = 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200';
                    } else if (isSelected && optIdx !== q.correct_index) {
                      optStyle = 'bg-rose-950/40 border-rose-500/80 text-rose-200';
                    }
                  } else if (isSelected) {
                    optStyle = 'bg-indigo-600/30 border-indigo-500 text-indigo-200';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={submitted}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${optStyle}`}
                    >
                      <span>{opt}</span>
                      {submitted && optIdx === q.correct_index && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 ml-2" />
                      )}
                      {submitted && isSelected && optIdx !== q.correct_index && (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {submitted && feedbackItem && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                  <span className="font-semibold text-indigo-300 block">Explanation:</span>
                  <p>{feedbackItem.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Result Card */}
      {submitted && result && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-center">
          <Award className="w-12 h-12 text-amber-400 mx-auto" />
          <div>
            <h3 className="text-xl font-bold text-slate-100">
              Score: {result.score} / {result.maxScore} ({result.percentage}%)
            </h3>
            {result.confidenceCalibrated && (
              <p className="text-xs text-indigo-300 mt-1 flex items-center justify-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Topic priority dynamically adjusted in future scheduling cycles.</span>
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/schedule')}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors inline-flex items-center space-x-2"
          >
            <span>Return to Schedule</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Submit Button */}
      {!submitted && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(selectedAnswers).length === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
          >
            <span>{submitting ? 'Evaluating...' : 'Submit Answers'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
