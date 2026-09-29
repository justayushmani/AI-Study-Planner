import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileUp, 
  FileText, 
  Sparkles, 
  Check, 
  Trash2, 
  Plus, 
  AlertCircle, 
  ArrowRight,
  Layers,
  Clock,
  HelpCircle
} from 'lucide-react';
import { syllabusService, goalService, planService } from '../services/api';

export default function SyllabusUpload() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'text'
  const [file, setFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [courseName, setCourseName] = useState('Custom Curriculum');
  const [extracting, setExtracting] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [targetDeadline, setTargetDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return d.toISOString().split('T')[0];
  });
  const [error, setError] = useState(null);
  const [scheduling, setScheduling] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleExtract = async () => {
    setExtracting(true);
    setError(null);
    try {
      let result;
      if (activeTab === 'file') {
        if (!file) {
          setError('Please select a PDF or DOCX file to upload');
          setExtracting(false);
          return;
        }
        result = await syllabusService.extractFile(file);
      } else {
        if (!rawText.trim()) {
          setError('Please paste or write your syllabus outline');
          setExtracting(false);
          return;
        }
        result = await syllabusService.extractText(rawText, courseName);
      }
      setExtractedData(result);
    } catch (err) {
      console.error('Extraction error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to extract syllabus');
    } finally {
      setExtracting(false);
    }
  };

  const updateTopic = (index, field, value) => {
    setExtractedData(prev => {
      const newTopics = [...prev.topics];
      newTopics[index] = { ...newTopics[index], [field]: value };
      return { ...prev, topics: newTopics };
    });
  };

  const removeTopic = (index) => {
    setExtractedData(prev => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index)
    }));
  };

  const addTopic = () => {
    setExtractedData(prev => ({
      ...prev,
      topics: [
        ...prev.topics,
        {
          title: 'New Topic',
          unit_name: 'Unit ' + (prev.topics.length + 1),
          description: '',
          difficulty_level: 3,
          estimated_minutes: 60,
          prerequisite_titles: []
        }
      ]
    }));
  };

  const handleConfirmAndSchedule = async () => {
    if (!extractedData || extractedData.topics.length === 0) return;
    setScheduling(true);
    try {
      // Create goal with extracted verified curriculum
      const goalPayload = {
        title: extractedData.course_title || courseName,
        category: 'Custom',
        targetDeadline: targetDeadline,
        proficiencyLevel: 'Beginner',
        weeklyAvailability: {
          Monday: 2.0, Tuesday: 2.0, Wednesday: 2.0,
          Thursday: 2.0, Friday: 2.0, Saturday: 3.5, Sunday: 3.5
        },
        preferredStudyTime: 'Evening',
        learningPreference: 'Balanced',
        revisionFrequencyDays: 7,
        bufferDays: 3,
        customTopics: extractedData.topics.map(t => ({
          title: t.title,
          unitName: t.unit_name,
          description: t.description,
          difficultyLevel: t.difficulty_level,
          baseEstimatedMinutes: t.estimated_minutes,
          prerequisites: t.prerequisite_titles
        }))
      };

      const createdGoal = await goalService.createGoal(goalPayload);
      await planService.generatePlan(createdGoal.id, startDate);

      navigate('/schedule');
    } catch (err) {
      console.error('Failed to schedule extracted syllabus:', err);
      setError(err.response?.data?.error || err.message || 'Failed to generate schedule');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8 animate-fadeIn">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
          Custom Syllabus & Document Extractor
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Upload any course curriculum, syllabus PDF, or lecture outline. Our local parser and Groq LLM will identify units, estimate study workloads, and detect prerequisite dependencies before you confirm.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input / Upload Section (Only show if not yet extracted or in edit mode) */}
      {!extractedData && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          
          {/* Tab Selector */}
          <div className="flex items-center space-x-2 p-1 rounded-xl bg-slate-950 border border-slate-800 w-fit">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'file'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>Document Upload (PDF / DOCX)</span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'text'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Paste Text Outline</span>
            </button>
          </div>

          {activeTab === 'file' ? (
            <div className="border-2 border-dashed border-slate-700/80 hover:border-indigo-500/60 rounded-2xl p-8 sm:p-12 text-center transition-colors">
              <input
                type="file"
                id="file-upload"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer space-y-3 block">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
                  <FileUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-200">
                    {file ? file.name : 'Click to select or drag and drop syllabus document'}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, and TXT files up to 15MB</p>
                </div>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Course / Subject Name</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. CS201 - Advanced Data Structures"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Syllabus / Outline Text</label>
                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste your course syllabus, chapters, and topic breakdowns here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleExtract}
              disabled={extracting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
            >
              {extracting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Parsing Curriculum with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Structured Syllabus</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* VERIFICATION & EDITING STEP (Crucial Feature 2 requirement) */}
      {extractedData && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="p-6 rounded-3xl bg-indigo-950/20 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-base">
                  Syllabus Extracted: {extractedData.course_title}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Please review the extracted modules, difficulty ratings, and prerequisite links below. You can edit any field or add/remove topics before scheduling.
              </p>
            </div>

            <button
              onClick={() => setExtractedData(null)}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors w-fit"
            >
              Re-upload Document
            </button>
          </div>

          {/* Topics Table / Cards */}
          <div className="space-y-3">
            {extractedData.topics.map((topic, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Topic Title</label>
                      <input
                        type="text"
                        value={topic.title}
                        onChange={(e) => updateTopic(idx, 'title', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Unit / Module</label>
                      <input
                        type="text"
                        value={topic.unit_name}
                        onChange={(e) => updateTopic(idx, 'unit_name', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => removeTopic(idx)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors self-end sm:self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Est. Minutes</span>
                    <input
                      type="number"
                      value={topic.estimated_minutes}
                      onChange={(e) => updateTopic(idx, 'estimated_minutes', parseInt(e.target.value) || 45)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Difficulty (1-5)</span>
                    <select
                      value={topic.difficulty_level}
                      onChange={(e) => updateTopic(idx, 'difficulty_level', parseInt(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    >
                      <option value="1">1 - Fundamental</option>
                      <option value="2">2 - Easy</option>
                      <option value="3">3 - Medium</option>
                      <option value="4">4 - Advanced</option>
                      <option value="5">5 - Complex</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block">Prerequisites</span>
                    <span className="text-[11px] text-indigo-300 font-mono">
                      {topic.prerequisite_titles?.length > 0
                        ? topic.prerequisite_titles.join(', ')
                        : 'None (Foundational)'}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Add Topic & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <button
              onClick={addTopic}
              className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Topic</span>
            </button>

            <button
              onClick={handleConfirmAndSchedule}
              disabled={scheduling}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center space-x-2 transition-all"
            >
              {scheduling ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Generating Schedule...</span>
                </>
              ) : (
                <>
                  <span>Confirm Syllabus & Generate Schedule</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
