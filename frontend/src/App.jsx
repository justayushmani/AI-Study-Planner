import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import AIAssistantModal from './components/AIAssistantModal';
import Dashboard from './pages/Dashboard';
import ScheduleView from './pages/ScheduleView';
import Onboarding from './pages/Onboarding';
import SyllabusUpload from './pages/SyllabusUpload';
import WhatIfSimulator from './pages/WhatIfSimulator';
import QuizView from './pages/QuizView';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#030508] bg-tech-grid text-slate-200 flex flex-col font-sans selection:bg-purple-600/30 selection:text-purple-200 antialiased">
          <Navbar onOpenAssistant={() => setIsAssistantOpen(true)} />
          
          <main className="flex-1 relative z-10">
            <Routes>
              <Route path="/" element={<Dashboard onOpenAssistant={() => setIsAssistantOpen(true)} />} />
              <Route path="/schedule" element={<ScheduleView />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/syllabus" element={<SyllabusUpload />} />
              <Route path="/what-if" element={<WhatIfSimulator />} />
              <Route path="/quiz/:topicId" element={<QuizView />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>

          <footer className="border-t border-[#1A2330] bg-[#030508]/90 py-5 text-center text-xs text-slate-500 font-mono tracking-tight">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>SYSTEM ONLINE</span>
                <span>•</span>
                <span>DETERMINISTIC DAG ENGINE</span>
                <span>•</span>
                <span>GROQ LLM</span>
              </div>
              <p className="text-[11px] text-slate-500">AI STUDY PLANNER // OS-1 • v2.4.0</p>
            </div>
          </footer>

          <AIAssistantModal
            isOpen={isAssistantOpen}
            onClose={() => setIsAssistantOpen(false)}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}
