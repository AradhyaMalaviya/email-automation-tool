import { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import CodeEditor from '../components/CodeEditor';
import '../styles/Templates.css';

export default function Templates() {
  const { addToast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selection
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: '', subject: '', html_body: '' });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        if (!selectedTemplate && data.length > 0) {
          const defaultTemp = data.find(t => t.is_default) || data[0];
          setSelectedTemplate(defaultTemp);
        } else if (selectedTemplate) {
          const updated = data.find(t => t.id === selectedTemplate.id);
          if (updated) setSelectedTemplate(updated);
        }
      } else {
        addToast('Failed to load templates', 'error');
      }
    } catch (err) {
      addToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({ name: template.name, subject: template.subject, html_body: template.html_body });
    } else {
      setEditingTemplate(null);
      setFormData({ name: '', subject: '', html_body: '<p>Hi {name},</p>\n\n<p>Your message here to {company}</p>' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingTemplate ? 'PUT' : 'POST';
      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        addToast(`Template ${editingTemplate ? 'updated' : 'created'} successfully`, 'success');
        setIsModalOpen(false);
        fetchTemplates();
      } else {
        const error = await res.json();
        addToast(error.error || 'Operation failed', 'error');
      }
    } catch (err) {
      addToast('Error saving template', 'error');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      // Find template
      const temp = templates.find(t => t.id === id);
      if (!temp) return;
      
      const res = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...temp, is_default: true })
      });
      
      if (res.ok) {
        addToast('Default template updated', 'success');
        fetchTemplates();
      }
    } catch (err) {
      addToast('Error setting default', 'error');
    }
  };

  const confirmDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    try {
      const res = await fetch(`/api/templates/${selectedTemplate.id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Template deleted', 'success');
        setIsDeleteModalOpen(false);
        setSelectedTemplate(null);
        fetchTemplates();
      } else {
        const error = await res.json();
        addToast(error.error || 'Failed to delete template', 'error');
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      addToast('Error deleting template', 'error');
    }
  };

  const insertVariable = (variable) => {
    setFormData(prev => ({ ...prev, html_body: prev.html_body + variable }));
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>Email Templates</h1>
        <p className="subtitle">Manage templates for your email campaigns</p>
      </div>

      <div className="templates-layout slide-up" style={{ '--animation-order': 1 }}>
        <div className="templates-sidebar glass">
          <div className="sidebar-header">
            <h3>Your Templates</h3>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenModal()}>
              ➕ New
            </button>
          </div>
          
          <ul className="template-list">
            {templates.map(t => (
              <li 
                key={t.id} 
                className={`template-item ${selectedTemplate?.id === t.id ? 'active' : ''}`}
                onClick={() => setSelectedTemplate(t)}
              >
                <div className="template-item-content">
                  <span className="template-name">{t.name}</span>
                  {t.is_default && <span className="badge badge-success template-badge">Default</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="template-editor-panel glass">
          {selectedTemplate ? (
            <>
              <div className="panel-header">
                <h2>{selectedTemplate.name}</h2>
                <div className="panel-actions">
                  {!selectedTemplate.is_default && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleSetDefault(selectedTemplate.id)}>
                      ⭐ Set Default
                    </button>
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={() => handleOpenModal(selectedTemplate)}>
                    ✏️ Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={confirmDelete}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
              
              <div className="preview-container">
                <div className="preview-subject">
                  <strong>Subject:</strong> {selectedTemplate.subject}
                </div>
                <div className="preview-tabs">
                  <div className="preview-tab active">Preview (with sample data)</div>
                </div>
                <div 
                  className="preview-body"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedTemplate.html_body
                      .replace(/{name}/g, 'John Doe')
                      .replace(/{company}/g, 'TechCorp Inc.') 
                  }}
                />
              </div>
            </>
          ) : (
            <div className="empty-state">
              Select a template to view or create a new one.
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingTemplate ? "Edit Template" : "New Template"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="template-form">
          <div className="form-row">
            <div className="form-group flex-1">
              <label>Template Name</label>
              <input 
                type="text" 
                className="input" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required 
                placeholder="e.g. Standard Application"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Subject Line</label>
            <input 
              type="text" 
              className="input" 
              value={formData.subject} 
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              required 
              placeholder="Internship Application at {company}"
            />
          </div>
          
          <div className="editor-group">
            <div className="editor-toolbar">
              <label>HTML Body</label>
              <div className="variable-helpers">
                <span>Insert variable:</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => insertVariable('{name}')}>{`{name}`}</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => insertVariable('{company}')}>{`{company}`}</button>
              </div>
            </div>
            
            <div className="codemirror-container">
              <CodeEditor 
                value={formData.html_body} 
                onChange={(val) => setFormData({...formData, html_body: val})} 
              />
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Template</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Delete Template"
        size="sm"
      >
        <div className="delete-confirmation">
          <p>Are you sure you want to delete <strong>{selectedTemplate?.name}</strong>?</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
