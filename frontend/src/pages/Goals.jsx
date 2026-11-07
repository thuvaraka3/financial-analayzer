import { useState, useEffect } from 'react';
import api from '../api';
import { Target, Plus, Trash2, DollarSign } from 'lucide-react';

export default function Goals({ page, setPage }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ goalName: '', targetAmount: '', deadline: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadGoals(); }, []);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/goals');
      setGoals(res.data.goals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/goals', form);
      setShowForm(false);
      setForm({ goalName: '', targetAmount: '', deadline: '' });
      loadGoals();
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding goal');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProgress = async (goal) => {
    const newAmount = prompt('Enter current amount saved (LKR):', goal.currentAmount?.toString() || '0');
    if (newAmount === null || isNaN(parseFloat(newAmount))) return;
    try {
      await api.put(`/goals/${goal.id || goal.goalId}`, { currentAmount: parseFloat(newAmount) });
      loadGoals();
    } catch (err) {
      alert('Error updating goal');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      loadGoals();
    } catch (err) {
      alert('Error deleting goal');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Savings Goals</h1>
          <p className="text-slate-500">Track and achieve your financial goals</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-medium">
          <Plus className="w-5 h-5" /> Add Goal
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">New Savings Goal</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="Goal Name (e.g., Emergency Fund)" value={form.goalName}
              onChange={(e) => setForm({ ...form, goalName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" required />
            <input type="number" placeholder="Target Amount (LKR)" value={form.targetAmount}
              onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" required />
            <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" />
            <button type="submit" disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition">
              {saving ? 'Creating...' : 'Create Goal'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg mb-2">No savings goals yet</p>
          <p className="text-slate-400">Create your first goal to start saving</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const current = Number(goal.currentAmount) || 0;
            const target = Number(goal.targetAmount) || 1;
            const progress = Math.min((current / target) * 100, 100);
            return (
              <div key={goal.id || goal.goalId} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">{goal.goalName}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${progress >= 100 ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-600'}`}>
                      {progress.toFixed(0)}%
                    </span>
                    <button onClick={() => handleDelete(goal.id || goal.goalId)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-slate-600">LKR {current.toLocaleString()}</span>
                  <span className="text-slate-400">of LKR {target.toLocaleString()}</span>
                </div>
                {goal.deadline && (
                  <p className="text-xs text-slate-400 mb-4">Target date: {goal.deadline}</p>
                )}
                <button onClick={() => handleUpdateProgress(goal)}
                  className="w-full py-2.5 bg-indigo-100 text-indigo-600 rounded-xl font-medium hover:bg-indigo-200 transition text-sm">
                  Update Progress
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
