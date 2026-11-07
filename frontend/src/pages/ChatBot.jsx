import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Send, Bot, User, Sparkles, RotateCcw } from 'lucide-react';

const SUGGESTIONS = [
  'How much did I spend this month?',
  'What is my largest expense category?',
  'Am I exceeding my budget?',
  'How can I save more money?',
  'What is an emergency fund?',
];

export default function ChatBot({ page, setPage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      const res = await api.get('/chat/history');
      setHistory(res.data.history || []);
      const recent = (res.data.history || []).slice(-20);
      setMessages(recent.map(h => ({
        text: h.message,
        role: h.role,
        provider: h.provider,
        timestamp: h.timestamp,
      })));
    } catch (err) {
      console.error(err);
    }
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
    } catch (err) {
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
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">AI Financial Assistant</h1>
          <p className="text-slate-500">Ask anything about your finances</p>
        </div>
        {messages.length > 0 && (
          <button onClick={handleReset} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">FinSightAI Assistant</h3>
              <p className="text-slate-400 mb-6">Ask me anything about your finances!</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => handleSend(s)}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-100 transition">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[75%] lg:max-w-[60%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                <div className={`p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : msg.error
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>

              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 rounded-2xl p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-100 p-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your finances..."
              disabled={loading}
              className="flex-1 px-4 py-3 bg-slate-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
