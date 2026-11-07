import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Sparkles, Plus, Target, Camera, Receipt, AlertTriangle, RefreshCw, Lightbulb
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Dashboard({ page, setPage }) {
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      api.get('/analytics/dashboard').then(r => setData(r.data)).catch(() => {}),
      api.get('/analytics/health').then(r => setHealth(r.data)).catch(() => {}),
      api.get('/analytics/anomalies').then(r => setAnomalies(r.data)).catch(() => {}),
      api.get('/chat/insights').then(r => {
        try {
          const parsed = JSON.parse(r.data.insights);
          setInsights(Array.isArray(parsed) ? parsed : []);
        } catch { setInsights(null); }
      }).catch(() => {}),
    ]);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-600">Welcome to FinSightAI</h2>
        <p className="text-slate-400 mt-2">Start by adding your first transaction</p>
        <button onClick={() => setPage('transactions')} className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition">
          <Plus className="w-5 h-5 inline mr-2" />Add Transaction
        </button>
      </div>
    );
  }

  const healthScore = health?.score || data?.healthScore?.score || 0;
  const healthStatus = health?.status || data?.healthScore?.status || 'No Data';
  const anomalyList = anomalies?.anomalies || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financial Dashboard</h1>
          <p className="text-slate-500 mt-1">Your financial overview at a glance</p>
        </div>
        <button onClick={loadData} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <SummaryCard icon={Wallet} label="Total Balance" value={data.totalBalance} color="indigo" />
        <SummaryCard icon={ArrowUpRight} label="Monthly Income" value={data.monthlyIncome} color="green" />
        <SummaryCard icon={ArrowDownRight} label="Monthly Expenses" value={data.monthlyExpenses} color="red" />
        <SummaryCard icon={TrendingUp} label="Monthly Savings" value={data.monthlySavings} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Income vs Expenses</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `LKR ${v/1000}k`} />
                <Tooltip formatter={(value) => [`LKR ${Number(value).toLocaleString()}`, '']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Spending by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryData || []}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                  paddingAngle={2} dataKey="value"
                >
                  {(data.categoryData || []).map((entry, i) => (
                    <Cell key={entry.name} fill={['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'][i % 7]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `LKR ${Number(value).toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Recent Transactions</h3>
            <button onClick={() => setPage('transactions')} className="text-sm text-indigo-600 hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {(data.recentTransactions || []).length === 0 ? (
              <p className="text-slate-400 text-center py-8">No transactions yet</p>
            ) : (
              (data.recentTransactions || []).map((tx) => (
                <div key={tx.id || tx.transactionId} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5 text-green-600" /> : <ArrowDownRight className="w-5 h-5 text-red-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{tx.category}</p>
                      <p className="text-sm text-slate-500">{tx.date}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}LKR {Number(tx.amount).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Financial Health</h3>
            </div>
            <div className="text-center mb-4">
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-24 h-24 circular-progress" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                  <circle
                    cx="50" cy="50" r="45"
                    stroke="white" strokeWidth="8" fill="none"
                    strokeDasharray={`${healthScore * 2.83} 283`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{healthScore}</span>
                </div>
              </div>
              <p className="text-white/80 mt-2">{healthStatus}</p>
            </div>
            {anomalyList.length > 0 && (
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 mt-2">
                <div className="flex items-center gap-2 text-yellow-300 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{anomalyList.length} anomaly detected</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPage('transactions')} className="flex items-center gap-2 p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition">
                <Plus className="w-4 h-4" /> Add Transaction
              </button>
              <button onClick={() => setPage('budgets')} className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition">
                <Target className="w-4 h-4" /> Set Budget
              </button>
              <button onClick={() => setPage('receipts')} className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition">
                <Camera className="w-4 h-4" /> Scan Receipt
              </button>
              <button onClick={() => setPage('chatbot')} className="flex items-center gap-2 p-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition">
                <Sparkles className="w-4 h-4" /> AI Chat
              </button>
            </div>
          </div>

          {insights && insights.length > 0 && (
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5" />
                <h3 className="text-lg font-semibold">AI Insights</h3>
              </div>
              <div className="space-y-3">
                {insights.map((item, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-3 flex items-start gap-3">
                    <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm leading-relaxed">{item.insight || item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }) {
  const gradients = { indigo: 'from-indigo-500 to-indigo-600', green: 'from-green-500 to-green-600', red: 'from-red-500 to-red-600', purple: 'from-purple-500 to-purple-600' };
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-500">{label}</span>
        <div className={`w-10 h-10 bg-gradient-to-r ${gradients[color]} rounded-xl flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-800">LKR {Number(value || 0).toLocaleString()}</p>
    </div>
  );
}
