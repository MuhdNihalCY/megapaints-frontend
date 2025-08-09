import { createContext, useContext, useState, useEffect } from 'react';

function applyThemeToDom(isDark) {
  const root = document.documentElement;
  const body = document.body;
  if (isDark) {
    root.classList.add('dark');
    body.classList.add('dark');
    root.style.colorScheme = 'dark';
    body.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    body.classList.remove('dark');
    root.style.colorScheme = 'light';
    body.style.colorScheme = 'light';
  }
}

// Apply saved preference ASAP (pre-React) to avoid any mismatch
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  try {
    const saved = localStorage.getItem('theme');
    const preferDark = saved ? saved === 'dark' : true;
    applyThemeToDom(preferDark);
  } catch {}
}

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true; // default to dark
  });

  useEffect(() => {
    applyThemeToDom(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      // Best-effort immediate DOM update for responsiveness
      try { applyThemeToDom(next); } catch {}
      return next;
    });
  };
  const setTheme = (theme) => setIsDark(theme === 'dark');

  const value = {
    isDark,
    theme: isDark ? 'dark' : 'light',
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
