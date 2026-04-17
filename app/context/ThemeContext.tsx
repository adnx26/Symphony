import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  dark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ dark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('symphony-theme') === 'dark';
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('symphony-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('symphony-theme', 'light');
    }
  }, [dark]);

  const toggle = () => setDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
