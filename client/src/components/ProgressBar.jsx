import './ProgressBar.css';

export default function ProgressBar({ current = 0, total = 100, label, status = 'active' }) {
  const pct = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0;

  return (
    <div className={`progress-bar-wrapper card progress-bar--${status}`}>
      {label && <div className="progress-bar-label">{label}</div>}
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-bar-info">
        <span className="progress-bar-pct">{pct}%</span>
        <span className="progress-bar-count">{current} / {total}</span>
      </div>
    </div>
  );
}
