import { AuthProvider, useAuth } from './context/AuthContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { Layout } from './components/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Analytics from './pages/Analytics';
import ChatBot from './pages/ChatBot';
import ReceiptScanner from './pages/ReceiptScanner';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const PAGES = {
  dashboard: Dashboard,
  transactions: Transactions,
  budgets: Budgets,
  goals: Goals,
  analytics: Analytics,
  chatbot: ChatBot,
  receipts: ReceiptScanner,
  reports: Reports,
  settings: Settings,
};

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <AuthenticatedApp />;
}

function PageRenderer({ page, setPage }) {
  const Component = PAGES[page] || Dashboard;
  return <Component page={page} setPage={setPage} />;
}

function AuthenticatedApp() {
  const { user } = useAuth();

  return <Layout pageComponent={PageRenderer} user={user} />;
}

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </PreferencesProvider>
  );
}
