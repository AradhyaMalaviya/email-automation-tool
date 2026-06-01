import { useState, useEffect } from 'react';
import ProgressBar from '../components/ProgressBar';
import { useToast } from '../components/Toast';
import '../styles/SendEmails.css';

export default function SendEmails() {
  const { addToast } = useToast();
  
  const [recruiters, setRecruiters] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [sendLog, setSendLog] = useState([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recRes, tempRes] = await Promise.all([
        fetch('/api/recruiters'),
        fetch('/api/templates')
      ]);

      if (recRes.ok) {
        const data = await recRes.json();
        setRecruiters(data);
      }
      
      if (tempRes.ok) {
        const data = await tempRes.json();
        setTemplates(data);
        const defaultTemp = data.find(t => t.is_default);
        if (defaultTemp) setSelectedTemplateId(defaultTemp.id.toString());
        else if (data.length > 0) setSelectedTemplateId(data[0].id.toString());
      }
    } catch (err) {
      addToast('Failed to load data', 'error');
    }
  };

  const filteredRecruiters = recruiters.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unsentRecruiters = recruiters.filter(r => !r.emailed);

  const handleSelectAllUnsent = (e) => {
    if (e.target.checked) {
      const newSelected = new Set(selectedIds);
      unsentRecruiters.forEach(r => newSelected.add(r.id));
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      unsentRecruiters.forEach(r => newSelected.delete(r.id));
      setSelectedIds(newSelected);
    }
  };

  const handleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const getSelectedTemplate = () => {
    return templates.find(t => t.id.toString() === selectedTemplateId);
  };

  const generatePreview = () => {
    const template = getSelectedTemplate();
    if (!template) return { subject: '', body: '' };

    // Sample data for preview
    const sampleName = 'Jane Doe';
    const sampleCompany = 'TechCorp Inc.';

    const subject = template.subject
      .replace(/{name}/g, sampleName)
      .replace(/{company}/g, sampleCompany);
      
    const body = template.html_body
      .replace(/{name}/g, sampleName)
      .replace(/{company}/g, sampleCompany);

    return { subject, body };
  };

  const startSending = async (payload) => {
    if (!selectedTemplateId) {
      addToast('Please select a template first', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to start sending emails? This process cannot be paused.')) {
      return;
    }

    payload.templateId = parseInt(selectedTemplateId);

    setIsSending(true);
    setIsComplete(false);
    setProgress({ current: 0, total: payload.sendUnsent ? unsentRecruiters.length : payload.recruiterIds.length });
    setSendLog([]);

    // Setup SSE listener
    const eventSource = new EventSource('/api/emails/progress');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'complete') {
        setIsSending(false);
        setIsComplete(true);
        eventSource.close();
        addToast('Email sending completed!', 'success');
        fetchData(); // Refresh list
        setSelectedIds(new Set()); // Clear selection
        return;
      }

      setProgress({ current: data.current, total: data.total });
      setSendLog(prev => [{
        email: data.recruiterEmail,
        status: data.status,
        timestamp: new Date().toISOString(),
        error: data.error
      }, ...prev]);
    };

    eventSource.onerror = () => {
      eventSource.close();
      if (isSending) {
        addToast('Lost connection to progress updates, but sending may continue in background', 'warning');
      }
    };

    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error('Failed to start sending process');
      }
    } catch (err) {
      addToast(err.message, 'error');
      setIsSending(false);
      eventSource.close();
    }
  };

  const preview = generatePreview();

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>Send Emails</h1>
        <p className="subtitle">Select recipients and send personalized emails</p>
      </div>

      {(isSending || isComplete) && (
        <div className="progress-section slide-up" style={{ '--animation-order': 1 }}>
          <ProgressBar 
            current={progress.current} 
            total={progress.total} 
            label="Sending Emails" 
            status={isComplete ? 'complete' : 'active'} 
          />
          
          <div className="card log-card">
            <h3>Sending Log</h3>
            <div className="log-container">
              {sendLog.map((log, i) => (
                <div key={i} className={`log-entry ${log.status}`}>
                  <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="log-badge">{log.status === 'sent' ? '✅' : '❌'}</span>
                  <span className="log-email">{log.email}</span>
                  {log.error && <span className="log-error">- {log.error}</span>}
                </div>
              ))}
              {sendLog.length === 0 && <p className="log-empty">Waiting to send first email...</p>}
            </div>
          </div>
          
          {isComplete && (
            <button className="btn btn-primary" onClick={() => setIsComplete(false)}>
              Send More Emails
            </button>
          )}
        </div>
      )}

      {!isSending && !isComplete && (
        <div className="send-layout slide-up" style={{ '--animation-order': 2 }}>
          <div className="selection-panel glass">
            <div className="panel-header">
              <h2>Select Recipients</h2>
              <span className="selected-count">{selectedIds.size} selected</span>
            </div>
            
            <div className="selection-controls">
              <input 
                type="text" 
                className="input" 
                placeholder="Search recruiters..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAllUnsent}
                  checked={unsentRecruiters.length > 0 && selectedIds.size >= unsentRecruiters.length}
                />
                Select All Unsent ({unsentRecruiters.length})
              </label>
            </div>

            <div className="recruiter-list">
              {filteredRecruiters.map(r => (
                <label key={r.id} className="recruiter-list-item">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(r.id)}
                    onChange={() => handleSelect(r.id)}
                  />
                  <div className="item-details">
                    <span className="item-name">{r.name}</span>
                    <span className="item-company">{r.company}</span>
                  </div>
                  {r.emailed && <span className="badge badge-success">Emailed</span>}
                </label>
              ))}
              {filteredRecruiters.length === 0 && (
                <p className="empty-state">No recruiters found.</p>
              )}
            </div>
          </div>

          <div className="preview-panel glass">
            <div className="panel-header">
              <h2>Email Preview</h2>
            </div>
            
            <div className="template-select-wrapper">
              <label>Select Template</label>
              <select 
                className="select" 
                value={selectedTemplateId} 
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                <option value="" disabled>-- Select a Template --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {selectedTemplateId ? (
              <div className="email-preview-box">
                <div className="preview-subject">
                  <strong>Subject:</strong> {preview.subject}
                </div>
                <div 
                  className="preview-body"
                  dangerouslySetInnerHTML={{ __html: preview.body }}
                />
              </div>
            ) : (
              <div className="preview-placeholder">
                <p>Select a template to see preview</p>
              </div>
            )}

            <div className="send-actions">
              <button 
                className="btn btn-secondary" 
                onClick={() => startSending({ sendUnsent: true })}
                disabled={unsentRecruiters.length === 0 || !selectedTemplateId}
              >
                📧 Send to All Unsent ({unsentRecruiters.length})
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => startSending({ recruiterIds: Array.from(selectedIds) })}
                disabled={selectedIds.size === 0 || !selectedTemplateId}
              >
                🚀 Send to Selected ({selectedIds.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
