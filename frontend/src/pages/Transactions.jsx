import { useState, useEffect } from 'react';
import api from '../api';
import { Receipt, Plus, ArrowUpRight, ArrowDownRight, Trash2, X, Filter } from 'lucide-react';

const INCOME_CATEGORIES = ['Salary', 'Business', 'Freelancing', 'Investments', 'Allowance', 'Other'];
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Education', 'Entertainment', 'Healthcare', 'Housing', 'Other'];

export default function Transactions({ page, setPage }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ type: 'expense', category: 'Food', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'all') params.type = filter;
      const res = await api.get('/transactions', { params });
      setTransactions(res.data.transactions || []);
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
      await api.post('/transactions', form);
      setShowForm(false);
      setForm({ type: 'expense', category: 'Food', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
      loadTransactions();
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      loadTransactions();
    } catch (err) {
      alert('Error deleting transaction');
    }
  };

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transactions</h1>
          <p className="text-slate-500">Manage your income and expenses</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition font-medium">
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Cancel' : 'Add Transaction'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-fade-in">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">New Transaction</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              {['income', 'expense'].map((t) => (
                <button key={t} type="button" onClick={() => setForm({ ...form, type: t, category: t === 'income' ? 'Salary' : 'Food' })}
                  className={`flex-1 py-3 rounded-xl font-medium capitalize transition ${form.type === t ? (t === 'income' ? 'bg-green-600 text-white' : 'bg-red-600 text-white') : 'bg-slate-100 text-slate-600'}`}>
                  {t}
                </button>
              ))}
            </div>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none">
              {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
            <input type="number" placeholder="Amount (LKR)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" required />
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" required />
            <input type="text" placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none" />
            <button type="submit" disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition">
              {saving ? 'Saving...' : 'Save Transaction'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {['all', 'income', 'expense'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap text-sm font-medium transition ${filter === f ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {f === 'all' ? <><Filter className="w-4 h-4 inline mr-1" />All</> : f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No transactions found</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-indigo-600 font-medium hover:underline">Add your first transaction</button>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id || tx.transactionId} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5 text-green-600" /> : <ArrowDownRight className="w-5 h-5 text-red-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{tx.description || tx.category}</p>
                    <p className="text-sm text-slate-500">{tx.category} &middot; {tx.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}LKR {Number(tx.amount).toLocaleString()}
                  </span>
                  <button onClick={() => handleDelete(tx.id || tx.transactionId)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
