import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { colors, ThemeType } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  theme: ThemeType;
  isDark: boolean;
  setTheme: (mode: 'light' | 'dark') => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: colors.dark,
  isDark: true,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(true); // Default to dark as requested earlier

  useEffect(() => {
    // Load saved theme preference
    AsyncStorage.getItem('theme_mode').then(mode => {
      if (mode) {
        setIsDark(mode === 'dark');
      } else {
        setIsDark(systemScheme === 'dark');
      }
    });
  }, [systemScheme]);

  const setTheme = (mode: 'light' | 'dark') => {
    setIsDark(mode === 'dark');
    AsyncStorage.setItem('theme_mode', mode);
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setTheme(newMode);
  };

  const theme = isDark ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
