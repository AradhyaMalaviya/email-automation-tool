import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';
import { useToast } from '../components/Toast';
import '../styles/Analytics.css';

const COLORS = {
  sent: '#10b981', // success green
  failed: '#ef4444', // danger red
  pending: '#f59e0b', // warning yellow
  accent: '#6366f1', // primary indigo
  accent2: '#8b5cf6' // secondary violet
};

export default function Analytics() {
  const { addToast } = useToast();
  const [data, setData] = useState({
    timeline: [],
    statusBreakdown: [],
    topTemplates: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/analytics');
        if (res.ok) {
          setData(await res.json());
        } else {
          addToast('Failed to load analytics data', 'error');
        }
      } catch (err) {
        addToast('Error connecting to server', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getStatusColor = (status) => COLORS[status] || COLORS.accent;

  if (loading) {
    return <div className="page fade-in">Loading analytics...</div>;
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>Analytics Dashboard</h1>
        <p className="subtitle">Visual insights into your email campaigns (All Time)</p>
      </div>

      <div className="analytics-grid">
        {/* Timeline Chart */}
        <div className="card analytics-card full-width slide-up" style={{ '--animation-order': 1 }}>
          <h2>Emails Sent Over Time</h2>
          {data.timeline.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.timeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatDate} stroke="var(--text-tertiary)" />
                  <YAxis stroke="var(--text-tertiary)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    labelFormatter={formatDate}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="Emails Sent"
                    stroke={COLORS.accent} 
                    strokeWidth={3}
                    dot={{ r: 4, fill: COLORS.accent, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-chart">Not enough data to display timeline.</div>
          )}
        </div>

        {/* Status Breakdown Donut Chart */}
        <div className="card analytics-card slide-up" style={{ '--animation-order': 2 }}>
          <h2>Status Breakdown</h2>
          {data.statusBreakdown.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.statusBreakdown}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                {data.statusBreakdown.map((entry, index) => (
                  <div key={index} className="legend-item">
                    <span className="legend-color" style={{ backgroundColor: getStatusColor(entry.name) }}></span>
                    <span className="legend-label">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-chart">No status data available.</div>
          )}
        </div>

        {/* Top Templates Bar Chart */}
        <div className="card analytics-card slide-up" style={{ '--animation-order': 3 }}>
          <h2>Top Templates Used</h2>
          {data.topTemplates.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.topTemplates} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                  <XAxis type="number" stroke="var(--text-tertiary)" />
                  <YAxis dataKey="name" type="category" width={100} stroke="var(--text-tertiary)" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    cursor={{ fill: 'var(--bg-tertiary)' }}
                  />
                  <Bar dataKey="count" name="Times Used" fill={COLORS.accent2} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-chart">No template usage data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
