import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, Terminal, Cpu, RefreshCw, ChevronRight } from 'lucide-react';
import { assistantService } from '../services/api';

export default function AIAssistantModal({ isOpen, onClose, currentGoalId, goalTitle }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm your AI Study Coach powered by Groq. I'm actively monitoring your progress for **${goalTitle || 'your active goal'}**.\n\nHow can I help you today? I can explain challenging concepts, recommend study strategies, or review your schedule changes.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', content: query }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await assistantService.chat(newMessages, currentGoalId);
      setMessages([...newMessages, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'I could not connect to the AI model right now. If you are running locally, please ensure `ai-service` is active and `GROQ_API_KEY` is provided.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "What should I focus on next?",
    "Explain Two Pointers with a code example",
    "How does the scheduler protect my deadline?",
    "Generate 3 practice questions for my weak topics"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl h-[650px] bg-[#080B10] border border-[#1A2330] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1A2330] bg-[#030508] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-[#0D121A] border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_10px_rgba(124,58,237,0.3)]">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-100 text-sm">AI Study Coach Terminal</h3>
                <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  <span>GROQ LLM ACTIVE</span>
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-500">CONTEXTUAL PEDAGOGICAL MENTOR & SCHEDULE ANALYZER</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#0D121A] border border-transparent hover:border-[#1A2330] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#05070B]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${
                m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                  m.role === 'user'
                    ? 'bg-[#7C3AED] text-white shadow-[0_0_10px_rgba(124,58,237,0.4)]'
                    : 'bg-[#0D121A] border border-cyan-500/30 text-cyan-400'
                }`}
              >
                {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-[#0D121A] border border-purple-500/40 text-slate-100 rounded-tr-none shadow-sm'
                    : 'bg-[#080B10] border border-[#1A2330] text-slate-200 rounded-tl-none whitespace-pre-wrap font-sans'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-3 text-slate-400 text-xs py-2">
              <div className="w-7 h-7 rounded-lg bg-[#0D121A] border border-[#1A2330] flex items-center justify-center">
                <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              </div>
              <span className="font-mono text-[11px] text-slate-400">Coach is analyzing syllabus context and formulating response...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="px-5 py-2.5 border-t border-[#1A2330] bg-[#030508] flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <Terminal className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span className="text-[10px] font-mono text-slate-500 uppercase flex-shrink-0">PROMPTS:</span>
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="text-[11px] font-mono whitespace-nowrap px-2.5 py-1 rounded border border-[#1A2330] bg-[#080B10] hover:bg-[#0D121A] hover:border-purple-500/40 text-slate-400 hover:text-purple-300 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="p-3.5 border-t border-[#1A2330] bg-[#080B10]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your study plan, difficult topics, or theory..."
              className="flex-1 bg-[#0D121A] border border-[#1A2330] rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-40 text-white text-xs font-semibold shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
