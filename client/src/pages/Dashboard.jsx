import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import { useToast } from '../components/Toast';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [stats, setStats] = useState({ totalRecruiters: 0, totalSent: 0, totalFailed: 0, totalPending: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, historyRes] = await Promise.all([
          fetch('/api/emails/stats'),
          fetch('/api/emails/history?limit=10')
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setRecentActivity(historyData.data || []);
        }
      } catch (err) {
        addToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    if (status === 'sent') return <span className="badge badge-success">Sent</span>;
    if (status === 'failed') return <span className="badge badge-danger">Failed</span>;
    return <span className="badge badge-pending">Pending</span>;
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHrs > 0) return `${diffHrs}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  if (loading) {
    return <div className="page fade-in">Loading dashboard...</div>;
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p className="subtitle">Overview of your email campaigns</p>
      </div>

      <div className="stats-grid slide-up" style={{ '--animation-order': 1 }}>
        <StatsCard title="Total Recruiters" value={stats.totalRecruiters} icon="👥" color="#6366f1" />
        <StatsCard title="Emails Sent" value={stats.totalSent} icon="✅" color="#10b981" />
        <StatsCard title="Emails Failed" value={stats.totalFailed} icon="❌" color="#ef4444" />
        <StatsCard title="Emails Pending" value={stats.totalPending} icon="⏳" color="#f59e0b" />
      </div>

      <div className="dashboard-content slide-up" style={{ '--animation-order': 2 }}>
        <div className="card recent-activity">
          <h2>Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="empty-state">No emails sent yet.</p>
          ) : (
            <ul className="activity-list">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="activity-item">
                  <div className="activity-details">
                    <span className="activity-name">{activity.name}</span>
                    <span className="activity-company">at {activity.company}</span>
                  </div>
                  <div className="activity-meta">
                    {getStatusBadge(activity.status)}
                    <span className="activity-time">{getTimeAgo(activity.sent_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="btn btn-secondary action-btn" onClick={() => navigate('/recruiters')}>
              <span className="icon">➕</span> Add Recruiter
            </button>
            <button className="btn btn-primary action-btn" onClick={() => navigate('/send')}>
              <span className="icon">📧</span> Send to Unsent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
