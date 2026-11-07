import { createContext, useContext, useEffect, useState } from 'react';

const PreferencesContext = createContext(null);

const DEFAULT_NOTIFICATIONS = {
  budgetAlerts: true,
  goalReminders: true,
  weeklySummary: false,
};

function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

export function PreferencesProvider({ children }) {
  const [darkMode, setDarkModeState] = useState(() => {
    const stored = localStorage.getItem('prefs.darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  const [notifications, setNotifications] = useState(() =>
    readStored('prefs.notifications', DEFAULT_NOTIFICATIONS)
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('prefs.darkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('prefs.notifications', JSON.stringify(notifications));
  }, [notifications]);

  const setDarkMode = (value) => setDarkModeState(Boolean(value));
  const toggleDarkMode = () => setDarkModeState((prev) => !prev);
  const updateNotification = (key, value) =>
    setNotifications((prev) => ({ ...prev, [key]: value }));

  return (
    <PreferencesContext.Provider
      value={{ darkMode, setDarkMode, toggleDarkMode, notifications, updateNotification }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}

export default PreferencesContext;
