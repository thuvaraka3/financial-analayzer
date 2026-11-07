import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import api from '../api';
import {
  LayoutDashboard, Receipt, Target, DollarSign, BarChart3,
  MessageSquare, Camera, FileText, Settings, LogOut, Menu, X,
  Wallet, Bell, Search, User, Sparkles, CheckCheck, AlertTriangle,
  TrendingUp, Loader2
} from 'lucide-react';
import ChatWidget from './ChatWidget';

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'transactions', icon: Receipt, label: 'Transactions' },
  { id: 'budgets', icon: Target, label: 'Budgets' },
  { id: 'goals', icon: DollarSign, label: 'Savings Goals' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'chatbot', icon: MessageSquare, label: 'AI Assistant' },
  { id: 'receipts', icon: Camera, label: 'Receipt Scanner' },
  { id: 'reports', icon: FileText, label: 'Reports' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

const RESULT_ICONS = {
  transaction: Receipt,
  budget: Target,
  goal: DollarSign,
};

const SEVERITY_DOT = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  success: 'bg-green-500',
  low: 'bg-indigo-500',
};

function readReadIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem('notif.read') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function Layout({ pageComponent: PageComponent, user }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout } = useAuth();
  const { notifications: notifPrefs } = usePreferences();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState(readReadIds);

  const searchRef = useRef(null);
  const notifRef = useRef(null);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (notifOpen) loadNotifications();
  }, [notifOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/search', { params: { q: query } });
        setSearchResults(res.data.results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const persistReadIds = (ids) => {
    const unique = Array.from(new Set(ids));
    setReadIds(unique);
    localStorage.setItem('notif.read', JSON.stringify(unique));
  };

  const visibleNotifications = notifications.filter(
    (notification) => notifPrefs[notification.type] !== false
  );
  const unreadCount = visibleNotifications.filter(
    (notification) => !readIds.includes(notification.id)
  ).length;

  const markAllRead = () => {
    persistReadIds([...readIds, ...visibleNotifications.map((n) => n.id)]);
  };

  const goTo = (page) => {
    setCurrentPage(page);
    setSearchOpen(false);
    setNotifOpen(false);
  };

  const openNotification = (notification) => {
    persistReadIds([...readIds, notification.id]);
    goTo(notification.page || 'dashboard');
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (searchResults.length > 0) {
      goTo(searchResults[0].page);
      setSearchQuery('');
    } else if (searchQuery.trim()) {
      goTo('transactions');
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-white border-r border-slate-200 fixed h-full z-30 transition-all duration-300 overflow-hidden lg:w-64 lg:relative`}>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
              FinSightAI
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  currentPage === item.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-slate-100 rounded-xl">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div ref={searchRef} className="relative hidden sm:block">
              <form onSubmit={handleSearchSubmit}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search transactions, budgets, goals..."
                  className="pl-9 pr-9 py-2 bg-slate-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none transition w-48 lg:w-64"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                )}
              </form>

              {searchOpen && searchQuery.trim().length >= 2 && (
                <div className="absolute left-0 mt-2 w-80 sm:w-96 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 z-30">
                  {searching && searchResults.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">Searching...</p>
                  ) : searchResults.length === 0 ? (
                    <p className="p-4 text-sm text-slate-500">No matches for "{searchQuery.trim()}"</p>
                  ) : (
                    <div className="py-2">
                      {searchResults.map((result, index) => {
                        const Icon = RESULT_ICONS[result.type] || Receipt;
                        return (
                          <button
                            key={`${result.type}-${result.id || index}`}
                            onClick={() => { goTo(result.page); setSearchQuery(''); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{result.title}</p>
                              <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen((open) => !open)}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[28rem] overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 z-30">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 sticky top-0 bg-white">
                    <h3 className="font-semibold text-slate-800">Notifications</h3>
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                    >
                      <CheckCheck className="w-4 h-4" /> Mark all read
                    </button>
                  </div>

                  {visibleNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">No notifications right now</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {visibleNotifications.map((notification) => {
                        const isRead = readIds.includes(notification.id);
                        return (
                          <button
                            key={notification.id}
                            onClick={() => openNotification(notification)}
                            className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition ${isRead ? 'opacity-60' : ''}`}
                          >
                            <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${SEVERITY_DOT[notification.severity] || 'bg-slate-400'}`}></span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800">{notification.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{notification.message}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setCurrentPage('chatbot')}
              className="relative p-2 rounded-xl hover:bg-slate-100 transition"
              title="Ask the AI Assistant"
            >
              <Sparkles className="w-5 h-5 text-slate-600" />
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-slate-800">{user?.fullName || user?.name || 'User'}</p>
                <p className="text-xs text-slate-500">{user?.email || ''}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <PageComponent page={currentPage} setPage={setCurrentPage} />
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
