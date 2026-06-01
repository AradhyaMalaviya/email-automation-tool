import './StatsCard.css';

export default function StatsCard({ title, value, icon, trend, color = 'var(--accent-primary)' }) {
  return (
    <div className="stats-card card">
      <div className="stats-card-header">
        <div className="stats-card-icon" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
          {icon}
        </div>
        {trend !== undefined && trend !== null && (
          <span className={`stats-card-trend ${trend >= 0 ? 'stats-card-trend--up' : 'stats-card-trend--down'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stats-card-value">{value}</div>
      <div className="stats-card-title">{title}</div>
    </div>
  );
}
