import { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import { useToast } from '../components/Toast';
import '../styles/History.css';

export default function History() {
  const { addToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination and filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 20;

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/emails/history?page=${page}&limit=${limit}&status=${statusFilter}`);
      
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
        setTotalPages(Math.ceil(data.total / limit) || 1);
      } else {
        addToast('Failed to load email history', 'error');
      }
    } catch (err) {
      addToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, statusFilter]);

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1); // Reset to first page on filter change
  };

  const columns = [
    { key: 'recipient', label: 'Recipient', render: (row) => (
      <div className="recipient-col">
        <span className="fw-500">{row.name}</span>
        <span className="text-sm text-tertiary">{row.email}</span>
      </div>
    )},
    { key: 'company', label: 'Company' },
    { key: 'subject', label: 'Subject', render: (row) => (
      <span className="subject-text" title={row.subject}>{row.subject}</span>
    )},
    { key: 'status', label: 'Status', render: (row) => {
      if (row.status === 'sent') return <span className="badge badge-success">Sent</span>;
      if (row.status === 'failed') return <span className="badge badge-danger">Failed</span>;
      return <span className="badge badge-pending">Pending</span>;
    }},
    { key: 'sent_at', label: 'Date', render: (row) => (
      <span className="date-text">
        {row.sent_at ? new Date(row.sent_at).toLocaleString() : '-'}
      </span>
    )},
    { key: 'error', label: 'Error (if failed)', render: (row) => (
      <span className="error-text" title={row.error_message}>{row.error_message || '-'}</span>
    )}
  ];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>Email History</h1>
        <p className="subtitle">View all previously sent emails and their status</p>
      </div>

      <div className="history-controls glass slide-up" style={{ '--animation-order': 1 }}>
        <div className="filter-group">
          <label htmlFor="statusFilter">Filter by Status:</label>
          <select 
            id="statusFilter" 
            className="select" 
            value={statusFilter} 
            onChange={handleStatusChange}
          >
            <option value="">All</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        
        <button className="btn btn-secondary" onClick={fetchHistory}>
          🔄 Refresh
        </button>
      </div>

      <div className="slide-up" style={{ '--animation-order': 2 }}>
        <DataTable 
          columns={columns} 
          data={logs} 
          loading={loading} 
          emptyMessage="No email history found."
        />
        
        {!loading && logs.length > 0 && (
          <div className="pagination">
            <button 
              className="btn btn-secondary btn-sm" 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span className="page-info">
              Page {page} of {totalPages}
            </span>
            <button 
              className="btn btn-secondary btn-sm" 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
