import { useState, useEffect } from 'react';
import api from '../api';
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, LineChart as LineChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

export default function Analytics({ page, setPage }) {
  const [activeTab, setActiveTab] = useState('spending');
  const [spending, setSpending] = useState(null);
  const [income, setIncome] = useState(null);
  const [savings, setSavings] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const fetches = [
      api.get('/analytics/spending').then(r => setSpending(r.data)).catch(() => {}),
      api.get('/analytics/income').then(r => setIncome(r.data)).catch(() => {}),
      api.get('/analytics/savings').then(r => setSavings(r.data)).catch(() => {}),
      api.get('/analytics/forecast').then(r => setForecast(r.data)).catch(() => {}),
      api.get('/analytics/anomalies').then(r => setAnomalies(r.data)).catch(() => {}),
    ];
    await Promise.all(fetches);
    setLoading(false);
  };

  const tabs = [
    { id: 'spending', label: 'Spending', icon: TrendingDown },
    { id: 'income', label: 'Income', icon: TrendingUp },
    { id: 'savings', label: 'Savings', icon: BarChart3 },
    { id: 'forecast', label: 'Forecast', icon: LineChartIcon },
    { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;
  }

  const renderSpending = () => {
    if (!spending || !spending.total) return <p className="text-slate-400 text-center py-12">No spending data available</p>;
    const categoryData = spending.categoryBreakdown ? Object.entries(spending.categoryBreakdown).map(([name, value]) => ({ name, value })) : [];
    const dailyData = spending.dailyTrend ? Object.entries(spending.dailyTrend).slice(-14).map(([date, amount]) => ({ date: date.slice(5), amount })) : [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">Total Spending</p>
            <p className="text-2xl font-bold text-slate-800">LKR {spending.total.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">Avg per Transaction</p>
            <p className="text-2xl font-bold text-slate-800">LKR {(spending.averagePerTransaction || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">Transactions</p>
            <p className="text-2xl font-bold text-slate-800">{spending.transactionCount || 0}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">By Category</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categoryData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(v) => `LKR ${Number(v).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Daily Trend (14 days)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip formatter={(v) => `LKR ${Number(v).toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderIncome = () => {
    if (!income || !income.total) return <p className="text-slate-400 text-center py-12">No income data available</p>;
    const sourceData = income.sourceBreakdown ? Object.entries(income.sourceBreakdown).map(([name, value]) => ({ name, value })) : [];
    const monthlyTrend = income.monthlyTrend ? Object.entries(income.monthlyTrend).map(([month, amount]) => ({ month, amount })) : [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">Total Income</p>
            <p className="text-2xl font-bold text-green-600">LKR {income.total.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">Monthly Avg</p>
            <p className="text-2xl font-bold text-slate-800">LKR {(income.averageMonthly || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">Growth</p>
            <p className={`text-2xl font-bold ${(income.monthlyGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(income.monthlyGrowth || 0) >= 0 ? '+' : ''}{income.monthlyGrowth || 0}%
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Income Sources</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {sourceData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(v) => `LKR ${Number(v).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Monthly Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `LKR ${v/1000}k`} />
                  <Tooltip formatter={(v) => `LKR ${Number(v).toLocaleString()}`} />
                  <Line type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSavings = () => {
    if (!savings || !savings.totalIncome) return <p className="text-slate-400 text-center py-12">No savings data available</p>;
    const monthlyTrend = savings.monthlyTrend ? Object.entries(savings.monthlyTrend).map(([month, amount]) => ({ month, amount })) : [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">Total Savings</p>
            <p className="text-2xl font-bold text-purple-600">LKR {(savings.totalSavings || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">Total Income</p>
            <p className="text-2xl font-bold text-green-600">LKR {(savings.totalIncome || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500">Savings Rate</p>
            <p className="text-2xl font-bold text-slate-800">{(savings.savingsRate || 0).toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Savings Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `LKR ${v/1000}k`} />
                <Tooltip formatter={(v) => `LKR ${Number(v).toLocaleString()}`} />
                <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderForecast = () => {
    if (!forecast) return <p className="text-slate-400 text-center py-12">Forecast data not available</p>;
    const expForecast = forecast.expenseForecast?.forecast || [];
    const savForecast = forecast.savingsForecast?.forecast || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Expense Forecast</h3>
            {expForecast.length > 0 ? (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expForecast.map(f => ({ ...f, name: f.month }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip formatter={(v) => `LKR ${Number(v).toLocaleString()}`} />
                      <Bar dataKey="predictedExpenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-slate-500">
                  Trend: <span className={`font-medium ${forecast.expenseForecast.trend === 'increasing' ? 'text-red-600' : 'text-green-600'}`}>
                    {forecast.expenseForecast.trend}
                  </span>
                </div>
              </>
            ) : <p className="text-slate-400 text-center py-4">{forecast.expenseForecast?.error || 'Insufficient data'}</p>}
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Savings Forecast</h3>
            {savForecast.length > 0 ? (
              <>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={savForecast.map(f => ({ ...f, name: f.month }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip formatter={(v) => `LKR ${Number(v).toLocaleString()}`} />
                      <Bar dataKey="predictedSavings" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-slate-500">
                  Trend: <span className={`font-medium ${forecast.savingsForecast.trend === 'increasing' ? 'text-green-600' : 'text-red-600'}`}>
                    {forecast.savingsForecast.trend}
                  </span>
                </div>
              </>
            ) : <p className="text-slate-400 text-center py-4">{forecast.savingsForecast?.error || 'Insufficient data'}</p>}
          </div>
        </div>
        {forecast.budgetOverrunRisk && (
          <div className={`rounded-2xl p-6 border ${forecast.budgetOverrunRisk.risk === 'high' ? 'bg-red-50 border-red-200' : forecast.budgetOverrunRisk.risk === 'medium' ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-6 h-6 ${forecast.budgetOverrunRisk.risk === 'high' ? 'text-red-600' : forecast.budgetOverrunRisk.risk === 'medium' ? 'text-yellow-600' : 'text-green-600'}`} />
              <div>
                <p className="font-semibold text-slate-800">Budget Overrun Risk: {forecast.budgetOverrunRisk.risk}</p>
                <p className="text-sm text-slate-600">{forecast.budgetOverrunRisk.message}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAnomalies = () => {
    const items = anomalies?.anomalies || [];
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Detected Anomalies</h3>
          {items.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-slate-500">No anomalies detected. Your account looks normal.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className={`p-4 rounded-xl ${item.severity === 'high' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-800 capitalize">{item.type?.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {item.category && `${item.category} - `}
                        {item.amount ? `LKR ${Number(item.amount).toLocaleString()}` : ''}
                        {item.date && ` on ${item.date}`}
                        {item.month && ` in ${item.month}`}
                        {item.percentageIncrease && ` (${item.percentageIncrease.toFixed(1)}% increase)`}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Detected by: {item.detectionMethod}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${item.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {item.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Financial Analytics</h1>
        <p className="text-slate-500">Deep insights into your financial behavior</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition ${activeTab === id ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'spending' && renderSpending()}
      {activeTab === 'income' && renderIncome()}
      {activeTab === 'savings' && renderSavings()}
      {activeTab === 'forecast' && renderForecast()}
      {activeTab === 'anomalies' && renderAnomalies()}
    </div>
  );
}
