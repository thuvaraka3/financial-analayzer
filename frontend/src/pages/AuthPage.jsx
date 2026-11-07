import { useState, useContext } from 'react';
import api from '../api';
import AuthContext from '../context/AuthContext';
import { Wallet, TrendingUp, Shield, Sparkles } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password || (!isLogin && !fullName)) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const res = await api.post('/auth/login', { email, password });
        login(res.data.access_token, res.data.user);
      } else {
        const res = await api.post('/auth/register', { fullName, name: fullName, email, password });
        setIsLogin(true);
        setError('Registration successful! Please login.');
      }
    } catch (err) {
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Make sure backend is running on port 5000.');
      } else if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else {
        setError(err.response?.data?.error || err.message || 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">FinSightAI</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Smart Financial<br />Management<br />Powered by AI
          </h1>
          <p className="text-white/80 text-lg max-w-md">
            Track expenses, manage budgets, set savings goals, and get AI-powered financial insights.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { icon: TrendingUp, label: 'Track Spending' },
            { icon: Shield, label: 'Smart Budgets' },
            { icon: Sparkles, label: 'AI Insights' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center">
              <Icon className="w-6 h-6 text-white mx-auto mb-2" />
              <p className="text-white text-sm font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">FinSightAI</h1>
            <p className="text-slate-500 mt-2">Smart Financial Management</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-500 mb-6">
              {isLogin ? 'Sign in to access your financial dashboard' : 'Start your financial journey'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                    required={!isLogin}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                  required
                />
              </div>

              {error && (
                <p className={`text-sm ${error.includes('successful') ? 'text-green-600' : 'text-red-500'}`}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-500">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
