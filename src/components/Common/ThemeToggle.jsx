import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  const handleToggle = () => {
    // Add a class to prevent transitions during theme switch
    document.documentElement.classList.add('theme-transitioning');
    
    toggleTheme();
    
    // Remove the class after theme has been applied
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 50);
  };
  return (
    <button
      onClick={handleToggle}
      className="p-3 rounded-xl transition-all duration-200 hover:scale-105 text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 active:scale-95"
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5 text-yellow-500 transition-transform duration-200" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700 transition-transform duration-200" />
      )}
    </button>
  );
};

export default ThemeToggle;
