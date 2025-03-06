'use client';

import React, { useState, useEffect } from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    // This runs only on the client after mounting.
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    setDarkMode(isDark);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (darkMode) {
        document.documentElement.setAttribute('theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.setAttribute('theme', 'light');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [darkMode, mounted]);

  // Until mounted, render nothing to prevent hydration issues.
  if (!mounted) return null;

  return (
    <button
      className="theme-toggle"
      onClick={() => setDarkMode(!darkMode)}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
    </button>
  );
}

export default ThemeToggle;
