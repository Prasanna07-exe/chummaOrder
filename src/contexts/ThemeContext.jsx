import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize theme immediately from localStorage to prevent flash
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme === 'dark';
    }
    return false;
  });

  useEffect(() => {
    // Apply theme immediately without transition to prevent flash
    document.documentElement.style.transition = 'none';
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Re-enable transitions after a brief delay
    requestAnimationFrame(() => {
      document.documentElement.style.transition = '';
    });
  }, [isDarkMode]);

  const toggleTheme = () => {
    // Disable transitions temporarily for instant theme switch
    document.documentElement.style.transition = 'none';
    
    const newTheme = !isDarkMode;
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    setIsDarkMode(newTheme);
    
    // Re-enable transitions after the theme has been applied
    requestAnimationFrame(() => {
      document.documentElement.style.transition = '';
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
