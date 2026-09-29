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
        <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
          <Navbar onOpenAssistant={() => setIsAssistantOpen(true)} />
          
          <main className="flex-1">
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

          <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
            <p>AI Study Planner • Hybrid Deterministic Scheduling Engine + Groq AI</p>
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
