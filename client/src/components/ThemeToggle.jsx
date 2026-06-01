import { useState, useEffect } from 'react';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return true; // default dark
  });

  useEffect(() => {
    const theme = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [dark]);

  return (
    <button
      className="theme-toggle"
      onClick={() => setDark((d) => !d)}
      aria-label="Toggle theme"
    >
      <span className="theme-toggle-icon">{dark ? '🌙' : '☀️'}</span>
      <span className="theme-toggle-label">{dark ? 'Dark Mode' : 'Light Mode'}</span>
      <span className={`theme-toggle-pill${dark ? ' theme-toggle-pill--dark' : ''}`} />
    </button>
  );
}
