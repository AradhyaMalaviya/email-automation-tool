import { useState, useEffect, useRef } from 'react';
import { useToast } from '../components/Toast';
import '../styles/Settings.css';

export default function Settings() {
  const { addToast } = useToast();
  const [settings, setSettings] = useState({ delay_ms: '', sender_name: '', resume_filename: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        setSettings(await res.json());
      } else {
        addToast('Failed to load settings', 'error');
      }
    } catch (err) {
      addToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (res.ok) {
        addToast('Settings saved successfully', 'success');
      } else {
        addToast('Failed to save settings', 'error');
      }
    } catch (err) {
      addToast('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      addToast('Please upload a PDF file', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    try {
      addToast('Uploading resume...', 'info');
      const res = await fetch('/api/settings/resume', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        addToast('Resume uploaded successfully', 'success');
        setSettings({ ...settings, resume_filename: result.filename });
      } else {
        const error = await res.json();
        addToast(error.error || 'Upload failed', 'error');
      }
    } catch (err) {
      addToast('Error uploading resume', 'error');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="subtitle">Configure your email automation preferences</p>
      </div>

      <div className="settings-layout slide-up" style={{ '--animation-order': 1 }}>
        <div className="card settings-card">
          <h2>General Configuration</h2>
          
          <form onSubmit={handleSaveSettings} className="settings-form">
            <div className="form-group">
              <label>Sender Name</label>
              <input 
                type="text" 
                name="sender_name" 
                className="input" 
                value={settings.sender_name || ''} 
                onChange={handleChange}
                placeholder="e.g. John Doe"
              />
              <p className="help-text">This name will appear as the sender in your emails.</p>
            </div>
            
            <div className="form-group">
              <label>Sending Delay (milliseconds)</label>
              <input 
                type="number" 
                name="delay_ms" 
                className="input" 
                value={settings.delay_ms || ''} 
                onChange={handleChange}
                min="1000"
                step="1000"
              />
              <p className="help-text">Time to wait between sending emails (minimum 1000ms / 1 second). Default is 60000ms (60s) to avoid spam detection.</p>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving || loading}>
                {saving ? 'Saving...' : '💾 Save Settings'}
              </button>
            </div>
          </form>
        </div>

        <div className="card settings-card slide-up" style={{ '--animation-order': 2 }}>
          <h2>Resume Attachment</h2>
          
          <div className="resume-section">
            <div className="current-resume">
              <div className="resume-icon">📄</div>
              <div className="resume-info">
                <h4>Current Resume</h4>
                <p>{settings.resume_filename || 'No resume attached'}</p>
              </div>
            </div>
            
            <div className="upload-actions">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleResumeUpload} 
                accept=".pdf" 
                style={{ display: 'none' }} 
              />
              <button 
                className="btn btn-secondary" 
                onClick={() => fileInputRef.current?.click()}
              >
                📤 Upload New Resume (PDF)
              </button>
              <p className="help-text">This file will be attached to all outgoing emails.</p>
            </div>
          </div>
        </div>
        
        <div className="card settings-card slide-up" style={{ '--animation-order': 3 }}>
          <h2>SMTP Configuration</h2>
          <div className="smtp-info">
            <p className="info-text">
              SMTP credentials (Email address and App Password) are securely loaded from your <code>.env</code> file.
            </p>
            <div className="env-example">
              <code>Email=your.email@gmail.com</code><br/>
              <code>EMAIL_PASS=your_app_password</code>
            </div>
            <p className="help-text warning-text">
              To change these credentials, please update the <code>server/.env</code> file directly and restart the server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
