import { NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './Sidebar.css';

const navItems = [
  { to: '/',           icon: '📊', label: 'Dashboard' },
  { to: '/recruiters', icon: '👥', label: 'Recruiters' },
  { to: '/send',       icon: '📧', label: 'Send Emails' },
  { to: '/history',    icon: '📜', label: 'History' },
  { to: '/templates',  icon: '✏️', label: 'Templates' },
  { to: '/settings',   icon: '⚙️', label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar glass">
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">✉️</span>
        <span className="sidebar-brand-text">EmailPro</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
            }
          >
            <span className="sidebar-link-icon">{icon}</span>
            <span className="sidebar-link-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <ThemeToggle />
      </div>
    </aside>
  );
}
