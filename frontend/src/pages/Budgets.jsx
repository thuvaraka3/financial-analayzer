import { useState, useEffect } from 'react';
import api from '../api';
import { Target, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';

const CATEGORIES = ['Overall', 'Food', 'Transport', 'Bills', 'Shopping', 'Education', 'Entertainment', 'Healthcare', 'Housing', 'Other'];

export default function Budgets({ page, setPage }) {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ category: 'Overall', monthlyLimit: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadBudgets(); }, []);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/budgets');
      setBudgets(res.data.budgets || []);
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
      if (editingId) {
        await api.put(`/budgets/${editingId}`, { monthlyLimit: parseFloat(form.monthlyLimit), category: form.category });
      } else {
        await api.post('/budgets', { category: form.category, monthlyLimit: parseFloat(form.monthlyLimit) });
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ category: 'Overall', monthlyLimit: '' });
      loadBudgets();
    } catch (err) {
      alert(err.response?.data?.error || 'Error saving budget');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (budget) => {
    setEditingId(budget.id || budget.budgetId);
    setForm({ category: budget.category || 'Overall', monthlyLimit: budget.monthlyLimit?.toString() || '' });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      loadBudgets();
    } catch (err) {
      alert('Error deleting budget');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Budget Planner</h1>
          <p className="text-slate-500">Set and manage spending limits per category</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ category: 'Overall', monthlyLimit: '' }); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-medium">
          {showForm ? <><Plus className="w-5 h-5 rotate-45" /> Cancel</> : <><Plus className="w-5 h-5" /> Add Budget</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{editingId ? 'Edit Budget' : 'New Budget'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none">
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Limit (LKR)</label>
              <input type="number" value={form.monthlyLimit} onChange={(e) => setForm({ ...form, monthlyLimit: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" required />
            </div>
            <button type="submit" disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition">
              {saving ? 'Saving...' : editingId ? 'Update Budget' : 'Create Budget'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg mb-2">No budgets set</p>
          <p className="text-slate-400">Create a budget to track your spending limits</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => {
            const limit = Number(budget.monthlyLimit) || 0;
            return (
              <div key={budget.id || budget.budgetId} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800">{budget.category || 'Overall'}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(budget)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(budget.id || budget.budgetId)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-3xl font-bold text-indigo-600 mb-4">LKR {limit.toLocaleString()}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Limit: LKR {limit.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
