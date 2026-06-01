import { useState, useEffect, useRef } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import '../styles/Recruiters.css';

export default function Recruiters() {
  const { addToast } = useToast();
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Form state
  const [editingRecruiter, setEditingRecruiter] = useState(null);
  const [formData, setFormData] = useState({ name: '', company: '', email: '' });
  const fileInputRef = useRef(null);

  const fetchRecruiters = async (search = '') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/recruiters?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        setRecruiters(await res.json());
      } else {
        addToast('Failed to load recruiters', 'error');
      }
    } catch (err) {
      addToast('Error connecting to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchRecruiters(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleOpenModal = (recruiter = null) => {
    if (recruiter) {
      setEditingRecruiter(recruiter);
      setFormData({ name: recruiter.name, company: recruiter.company, email: recruiter.email });
    } else {
      setEditingRecruiter(null);
      setFormData({ name: '', company: '', email: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecruiter(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingRecruiter ? 'PUT' : 'POST';
      const url = editingRecruiter ? `/api/recruiters/${editingRecruiter.id}` : '/api/recruiters';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        addToast(`Recruiter ${editingRecruiter ? 'updated' : 'added'} successfully`, 'success');
        handleCloseModal();
        fetchRecruiters(searchQuery);
      } else {
        const error = await res.json();
        addToast(error.error || 'Operation failed', 'error');
      }
    } catch (err) {
      addToast('Error saving recruiter', 'error');
    }
  };

  const confirmDelete = (recruiter) => {
    setEditingRecruiter(recruiter);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/recruiters/${editingRecruiter.id}`, { method: 'DELETE' });
      if (res.ok) {
        addToast('Recruiter deleted', 'success');
        setIsDeleteModalOpen(false);
        setEditingRecruiter(null);
        fetchRecruiters(searchQuery);
      } else {
        addToast('Failed to delete recruiter', 'error');
      }
    } catch (err) {
      addToast('Error deleting recruiter', 'error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      addToast('Importing CSV...', 'info');
      const res = await fetch('/api/recruiters/import', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const result = await res.json();
        addToast(`Imported ${result.imported}. Skipped ${result.skipped} duplicates.`, 'success');
        fetchRecruiters(searchQuery);
      } else {
        const error = await res.json();
        addToast(error.error || 'Import failed', 'error');
      }
    } catch (err) {
      addToast('Error uploading file', 'error');
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
    window.location.href = '/api/recruiters/export';
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'company', label: 'Company' },
    { key: 'email', label: 'Email' },
    { 
      key: 'status', 
      label: 'Status',
      render: (row) => row.emailed 
        ? <span className="badge badge-success">Emailed</span> 
        : <span className="badge badge-pending">Not Emailed</span>
    },
    { 
      key: 'created_at', 
      label: 'Added',
      render: (row) => new Date(row.created_at).toLocaleDateString()
    }
  ];

  const actions = [
    {
      label: '✏️',
      onClick: handleOpenModal,
      className: 'btn-icon'
    },
    {
      label: '🗑️',
      onClick: confirmDelete,
      className: 'btn-icon btn-danger'
    }
  ];

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>Recruiters</h1>
        <p className="subtitle">Manage your recruiter contacts</p>
      </div>

      <div className="action-bar glass slide-up" style={{ '--animation-order': 1 }}>
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            className="input search-input" 
            placeholder="Search by name, company, or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="action-buttons">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            style={{ display: 'none' }} 
          />
          <button className="btn btn-secondary" onClick={handleImportClick}>
            📤 Import CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExport}>
            📥 Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            ➕ Add Recruiter
          </button>
        </div>
      </div>

      <div className="slide-up" style={{ '--animation-order': 2 }}>
        <DataTable 
          columns={columns} 
          data={recruiters} 
          loading={loading} 
          emptyMessage={searchQuery ? "No recruiters found matching your search." : "No recruiters added yet."}
          actions={actions}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingRecruiter ? "Edit Recruiter" : "Add Recruiter"}
      >
        <form onSubmit={handleSubmit} className="recruiter-form">
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text" 
              name="name" 
              className="input" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Company</label>
            <input 
              type="text" 
              name="company" 
              className="input" 
              value={formData.company} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email" 
              className="input" 
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Recruiter</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Confirm Delete"
        size="sm"
      >
        <div className="delete-confirmation">
          <p>Are you sure you want to delete <strong>{editingRecruiter?.name}</strong>?</p>
          <p className="warning-text">This will also delete their email history.</p>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
