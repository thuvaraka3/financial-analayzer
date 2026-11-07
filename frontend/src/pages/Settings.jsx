import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import api from '../api';
import {
  User, Shield, Bell, Moon, Sun, LogOut,
  ChevronRight, X, Loader, Check, Lock, Mail, Eye, EyeOff
} from 'lucide-react';

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition flex-shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
      aria-pressed={checked}
    >
      <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition ${checked ? 'right-0.5' : 'left-0.5'}`}></div>
    </button>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-100">
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const inputClass = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition';

function formatMemberSince(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Settings({ page, setPage }) {
  const { user, logout, updateUser } = useAuth();
  const { darkMode, toggleDarkMode, notifications, updateNotification } = usePreferences();
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName || user?.name || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState(false);

  const openModal = (name) => {
    setMessage({ type: '', text: '' });
    if (name === 'profile') {
      setProfileForm({ fullName: user?.fullName || user?.name || '' });
    }
    if (name === 'security') {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswords(false);
    }
    setModal(name);
  };

  const closeModal = () => {
    setModal(null);
    setMessage({ type: '', text: '' });
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!profileForm.fullName.trim()) {
      setMessage({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', { fullName: profileForm.fullName.trim() });
      updateUser(res.data);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setModal(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setModal(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update password.' });
    } finally {
      setSaving(false);
    }
  };

  const enabledNotifications = Object.values(notifications).filter(Boolean).length;
  const memberSince = formatMemberSince(user?.createdAt);

  const sections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Profile Information',
          value: user?.fullName || user?.name || 'User',
          onClick: () => openModal('profile'),
        },
        {
          icon: Shield,
          label: 'Security',
          value: 'Password & Authentication',
          onClick: () => openModal('security'),
        },
        {
          icon: Bell,
          label: 'Notifications',
          value: `${enabledNotifications} of 3 alerts enabled`,
          onClick: () => openModal('notifications'),
        },
      ],
    },
  ];

  const notificationOptions = [
    { key: 'budgetAlerts', label: 'Budget alerts', description: 'Notify me when a budget limit is close or exceeded' },
    { key: 'goalReminders', label: 'Goal reminders', description: 'Remind me to update my savings goals' },
    { key: 'weeklySummary', label: 'Weekly summary', description: 'Send me a weekly spending summary' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500">Manage your account and preferences</p>
      </div>

      {message.text && !modal && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">{user?.fullName || user?.name || 'User'}</h3>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">Member since {memberSince || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">{section.title}</h3>
              <div className="space-y-2">
                {section.items.map(({ icon: Icon, label, value, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-slate-500" />
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{label}</p>
                        <p className="text-xs text-slate-500">{value}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Preferences</h3>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-5 h-5 text-slate-500" /> : <Sun className="w-5 h-5 text-slate-500" />}
                <div>
                  <p className="font-medium text-slate-800 text-sm">Dark Mode</p>
                  <p className="text-xs text-slate-500">{darkMode ? 'On' : 'Off'}</p>
                </div>
              </div>
              <Toggle checked={darkMode} onChange={toggleDarkMode} />
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full py-4 bg-white rounded-2xl border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </div>

      {modal === 'profile' && (
        <Modal title="Profile Information" subtitle="Update your account details" onClose={closeModal}>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ fullName: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  className={`${inputClass} pl-10 opacity-70 cursor-not-allowed`}
                  disabled
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
            </div>
            {message.text && (
              <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{message.text}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeModal} className="flex-1 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition flex items-center justify-center gap-2">
                {saving ? <><Loader className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'security' && (
        <Modal title="Security" subtitle="Change your password" onClose={closeModal}>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className={inputClass}
                autoComplete="current-password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className={inputClass}
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className={inputClass}
                autoComplete="new-password"
                required
              />
            </div>
            <button
              type="button"
              onClick={() => setShowPasswords((v) => !v)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPasswords ? 'Hide passwords' : 'Show passwords'}
            </button>
            {message.text && (
              <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>{message.text}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeModal} className="flex-1 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 transition flex items-center justify-center gap-2">
                {saving ? <><Loader className="w-4 h-4 animate-spin" /> Updating...</> : <><Lock className="w-4 h-4" /> Update</>}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'notifications' && (
        <Modal title="Notifications" subtitle="Choose which alerts you receive" onClose={closeModal}>
          <div className="space-y-2">
            {notificationOptions.map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-800 text-sm">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                </div>
                <Toggle
                  checked={Boolean(notifications[key])}
                  onChange={(value) => updateNotification(key, value)}
                />
              </div>
            ))}
          </div>
          <button onClick={closeModal} className="w-full mt-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition">
            Done
          </button>
        </Modal>
      )}
    </div>
  );
}
