import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { MessageSquare, Send, Bot, User, X, Minus, RotateCcw, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'How much did I spend this month?',
  'What is my largest expense category?',
  'Am I exceeding my budget?',
  'How can I save more money?',
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const widgetRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (open && widgetRef.current && !widgetRef.current.contains(e.target)) {
        const toggleBtn = document.getElementById('chat-toggle-btn');
        if (toggleBtn && toggleBtn.contains(e.target)) return;
        setOpen(false);
        setMinimized(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReset = () => {
    setMessages([]);
  };

  const handleSend = async (text) => {
    const message = text || input;
    if (!message.trim() || loading) return;

    setInput('');
    const userMsg = { text: message, role: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.post('/chat', { message });
      const assistantMsg = {
        text: res.data.response,
        role: 'assistant',
        provider: res.data.provider,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      setMessages(prev => [...prev, {
        text: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && !minimized && (
        <div ref={widgetRef} className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button onClick={handleReset} className="p-1.5 hover:bg-white/20 rounded-lg transition" title="Reset chat">
                  <RotateCcw className="w-4 h-4 text-white" />
                </button>
              )}
              <button onClick={() => setMinimized(true)} className="p-1.5 hover:bg-white/20 rounded-lg transition">
                <Minus className="w-4 h-4 text-white" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-600 mb-1">FinSightAI Assistant</h4>
                <p className="text-xs text-slate-400 mb-4">Ask anything about your finances!</p>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => handleSend(s)}
                      className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-medium hover:bg-indigo-100 transition text-left">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div className={`p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : msg.error
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3 h-3 text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-slate-100 rounded-2xl p-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-100 p-3">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your finances..."
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm bg-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {minimized && (
        <button
          onClick={() => setMinimized(false)}
          className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition"
        >
          <Bot className="w-5 h-5" />
          <span className="text-sm font-medium whitespace-nowrap">AI Assistant</span>
        </button>
      )}

      <button
        id="chat-toggle-btn"
        onClick={() => { setOpen(!open); if (!open) setMinimized(false); }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          open
            ? 'bg-slate-700 hover:bg-slate-800 rotate-90'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-xl'
        }`}
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
      </button>
    </>
  );
}
