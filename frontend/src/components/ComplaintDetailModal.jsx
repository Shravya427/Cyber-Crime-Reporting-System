import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { complaintsAPI, evidenceAPI } from '../api/client';
import { 
  X, ShieldAlert, Clock, User, Phone, Mail, Globe, 
  CreditCard, FileText, Download, CheckCircle, AlertTriangle, 
  Send, UploadCloud, Copy, Check, ChevronRight, Hash, ShieldCheck
} from 'lucide-react';

export default function ComplaintDetailModal({ complaint, onClose, onRefresh, officers = [] }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'timeline' | 'evidence' | 'officer_actions'
  const [copied, setCopied] = useState(false);

  // Status update form state
  const [newStatus, setNewStatus] = useState(complaint.status);
  const [statusNotes, setStatusNotes] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [priorityUpdate, setPriorityUpdate] = useState(complaint.priority);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Investigation Note form state
  const [noteType, setNoteType] = useState('EVIDENCE_ANALYSIS');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDetails, setNoteDetails] = useState('');
  const [noteFindings, setNoteFindings] = useState('');
  const [noteAction, setNoteAction] = useState('');
  const [noteNextSteps, setNoteNextSteps] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Assignment state (for Admin)
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Evidence upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [evidenceType, setEvidenceType] = useState('Screenshot');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const isOfficerOrAdmin = user?.role === 'officer' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const handleCopyId = () => {
    navigator.clipboard.writeText(complaint.complaint_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setSubmittingStatus(true);
    setError(null);
    setMessage(null);
    try {
      await complaintsAPI.updateStatus(complaint._id, {
        status: newStatus,
        notes: statusNotes,
        resolution_summary: resolutionSummary,
        rejection_reason: rejectionReason,
        priority: priorityUpdate
      });
      setMessage(`Case status successfully updated to ${newStatus}`);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleAddInvestigationNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim()) {
      setError("Investigation note title is required");
      return;
    }
    setSubmittingNote(true);
    setError(null);
    setMessage(null);
    try {
      await complaintsAPI.addInvestigationNote(complaint._id, {
        activity_type: noteType,
        title: noteTitle,
        details: noteDetails,
        findings: noteFindings,
        action_taken: noteAction,
        next_steps: noteNextSteps
      });
      setMessage("Investigation forensic entry recorded successfully");
      setNoteTitle('');
      setNoteDetails('');
      setNoteFindings('');
      setNoteAction('');
      setNoteNextSteps('');
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleAssignOfficer = async (e) => {
    e.preventDefault();
    if (!selectedOfficer) {
      setError("Please select an investigation officer");
      return;
    }
    setSubmittingAssign(true);
    setError(null);
    setMessage(null);
    try {
      await complaintsAPI.assign(complaint._id, {
        officer_id: selectedOfficer,
        notes: assignNotes
      });
      setMessage("Officer assigned successfully");
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setError("Please select a file to upload");
      return;
    }
    setUploadingEvidence(true);
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('evidence_type', evidenceType);
      formData.append('description', evidenceDesc);

      await evidenceAPI.upload(complaint._id, formData);
      setMessage("Evidence successfully committed to MongoDB GridFS with SHA-256 integrity hash.");
      setUploadFile(null);
      setEvidenceDesc('');
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingEvidence(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase().replace(/\s+/g, '-');
    const map = {
      'submitted': 'badge-submitted',
      'under-review': 'badge-review',
      'assigned': 'badge-assigned',
      'investigation-in-progress': 'badge-investigating',
      'resolved': 'badge-resolved',
      'rejected': 'badge-rejected',
      'closed': 'badge-closed'
    };
    return <span className={`badge ${map[s] || 'badge-submitted'}`}>{status}</span>;
  };

  const getPriorityBadge = (p) => {
    const map = {
      'Critical': 'badge-priority-critical',
      'High': 'badge-priority-high',
      'Medium': 'badge-priority-medium',
      'Low': 'badge-priority-low'
    };
    return <span className={`badge ${map[p] || 'badge-priority-medium'}`}>{p}</span>;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '820px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-card)',
          background: 'rgba(15, 23, 42, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>
                {complaint.complaint_id}
              </span>
              <button 
                onClick={handleCopyId}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                title="Copy Complaint ID"
              >
                {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
              </button>
              {getStatusBadge(complaint.status)}
              {getPriorityBadge(complaint.priority)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Category: <strong style={{ color: '#fff' }}>{complaint.category}</strong> • Incident on {new Date(complaint.incident_date).toLocaleDateString()}
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(11, 17, 32, 0.7)',
          padding: '0 1rem'
        }}>
          {[
            { id: 'overview', label: 'Case Overview' },
            { id: 'timeline', label: `Timeline (${complaint.investigation_history?.length || 0})` },
            { id: 'evidence', label: `Evidence Vault (${complaint.evidence_details?.length || 0})` },
            ...(isOfficerOrAdmin ? [{ id: 'officer_actions', label: 'Investigation & Actions' }] : [])
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: 'none',
                color: activeTab === tab.id ? 'var(--cyber-blue)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid var(--cyber-blue)' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '1.5rem' }}>
          {message && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#34d399', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              ✓ {message}
            </div>
          )}
          {error && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              ⚠ {error}
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Financial Loss Callout */}
              {complaint.financial_loss > 0 && (
                <div style={{
                  background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.12), rgba(15, 23, 42, 0.6))',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#fca5a5', fontWeight: 600 }}>Reported Financial Loss</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-mono)' }}>
                      ₹{complaint.financial_loss.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <ShieldAlert size={36} color="#ef4444" style={{ opacity: 0.8 }} />
                </div>
              )}

              {/* Resolution or Rejection Callouts */}
              {complaint.resolution_summary && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <CheckCircle size={16} /> Official Resolution Summary
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: 0 }}>
                    {complaint.resolution_summary}
                  </p>
                </div>
              )}

              {complaint.rejection_reason && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <AlertTriangle size={16} /> Rejection Reason
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#fca5a5', margin: 0 }}>
                    {complaint.rejection_reason}
                  </p>
                </div>
              )}

              {/* Description */}
              <div className="cyber-card">
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Incident Description
                </h4>
                <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                  {complaint.description}
                </p>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <div>Incident Platform / Location: <strong style={{ color: '#cbd5e1' }}>{complaint.incident_location}</strong></div>
                  <div>Reported Date: <strong style={{ color: '#cbd5e1' }}>{new Date(complaint.created_at).toLocaleString()}</strong></div>
                </div>
              </div>

              {/* Citizen Details & Assigned Officer Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="cyber-card">
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={14} /> Complainant Details
                  </h4>
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div><span style={{ color: 'var(--text-dim)' }}>Name:</span> <strong style={{ color: '#fff' }}>{complaint.citizen_name || 'Anonymous'}</strong></div>
                    <div><span style={{ color: 'var(--text-dim)' }}>Email:</span> <span style={{ color: '#38bdf8' }}>{complaint.citizen_email}</span></div>
                    <div><span style={{ color: 'var(--text-dim)' }}>Phone:</span> <span style={{ color: '#e2e8f0' }}>{complaint.citizen_phone || 'Not provided'}</span></div>
                  </div>
                </div>

                <div className="cyber-card">
                  <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={14} /> Assigned Officer
                  </h4>
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {complaint.assigned_officer_name ? (
                      <>
                        <div><span style={{ color: 'var(--text-dim)' }}>Officer:</span> <strong style={{ color: '#fff' }}>{complaint.assigned_officer_name}</strong></div>
                        <div><span style={{ color: 'var(--text-dim)' }}>Badge No:</span> <span className="font-mono" style={{ color: '#38bdf8' }}>{complaint.assigned_officer_badge}</span></div>
                        <div><span style={{ color: 'var(--text-dim)' }}>Status:</span> <span style={{ color: '#10b981' }}>Active Investigation</span></div>
                      </>
                    ) : (
                      <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                        No investigation officer assigned yet. Case is currently under initial queue triage.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Suspect Information Card */}
              <div className="cyber-card">
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Globe size={14} /> Suspect / Accused Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.825rem' }}>
                  <div><span style={{ color: 'var(--text-dim)' }}>Name / Alias:</span> <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{complaint.suspect_info?.name || 'Unknown'}</div></div>
                  <div><span style={{ color: 'var(--text-dim)' }}>Phone / Contact:</span> <div style={{ color: '#e2e8f0' }}>{complaint.suspect_info?.phone || 'N/A'}</div></div>
                  <div><span style={{ color: 'var(--text-dim)' }}>Suspect UPI ID:</span> <div className="font-mono" style={{ color: '#f59e0b' }}>{complaint.suspect_info?.upi_id || 'N/A'}</div></div>
                  <div><span style={{ color: 'var(--text-dim)' }}>Suspect Bank Info:</span> <div className="font-mono" style={{ color: '#f59e0b' }}>{complaint.suspect_info?.bank_account || 'N/A'}</div></div>
                  <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-dim)' }}>Fraudulent Website / URL:</span> <div className="font-mono" style={{ color: '#38bdf8' }}>{complaint.suspect_info?.website_url || 'N/A'}</div></div>
                  {complaint.suspect_info?.other_details && (
                    <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-dim)' }}>Additional Suspect Notes:</span> <div style={{ color: '#cbd5e1' }}>{complaint.suspect_info.other_details}</div></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVESTIGATION TIMELINE */}
          {activeTab === 'timeline' && (
            <div>
              <div className="timeline">
                {(complaint.investigation_history || []).map((step, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-node" />
                    <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-card)', borderRadius: '10px', padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#38bdf8' }}>
                          {step.action || step.stage}
                        </div>
                        <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {new Date(step.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0.4rem 0' }}>
                        {step.notes}
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.4rem', marginTop: '0.5rem' }}>
                        <span>Logged by: <strong style={{ color: '#fff' }}>{step.performed_by_name}</strong> ({step.performed_by_role})</span>
                        <span>State: <strong style={{ color: 'var(--cyber-blue)' }}>{step.status}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EVIDENCE VAULT (GridFS) */}
          {activeTab === 'evidence' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  MongoDB GridFS Digital Evidence Registry
                </h4>
                <span className="badge badge-submitted">
                  Forensic Chain of Custody Verified
                </span>
              </div>

              {/* Upload New Evidence Form */}
              <form onSubmit={handleUploadEvidence} style={{ background: 'rgba(11, 17, 32, 0.8)', border: '1px dashed rgba(56, 189, 248, 0.4)', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <UploadCloud size={16} /> Securely Deposit Additional Evidence File
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Select File (PNG, JPG, PDF, TXT)</label>
                    <input 
                      type="file" 
                      className="form-control" 
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      style={{ padding: '0.4rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Evidence Classification</label>
                    <select 
                      className="form-control"
                      value={evidenceType}
                      onChange={(e) => setEvidenceType(e.target.value)}
                    >
                      <option value="Screenshot">Screenshot / Screen Capture</option>
                      <option value="Bank Statement">Bank Statement / Payment Receipt</option>
                      <option value="Chat Log">Chat Conversation Export</option>
                      <option value="Email Header">Email MIME Headers / Logs</option>
                      <option value="Other">Forensic Memory Dump / Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                  <label className="form-label">Evidence Context / Note</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Transaction reference SMS screenshot or phishing URL headers"
                    value={evidenceDesc}
                    onChange={(e) => setEvidenceDesc(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={uploadingEvidence} style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}>
                  {uploadingEvidence ? 'Encrypting & Storing in GridFS...' : 'Upload & Commit to GridFS'}
                </button>
              </form>

              {/* Evidence File Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(!complaint.evidence_details || complaint.evidence_details.length === 0) ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    No digital evidence files deposited for this complaint yet.
                  </div>
                ) : (
                  complaint.evidence_details.map(ev => (
                    <div 
                      key={ev._id} 
                      className="cyber-card" 
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.25rem' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          background: 'rgba(56, 189, 248, 0.1)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FileText size={22} color="#38bdf8" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                            {ev.original_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Type: <span style={{ color: 'var(--cyber-blue)' }}>{ev.evidence_type}</span> • Size: {(ev.file_size / 1024).toFixed(1)} KB • {new Date(ev.created_at).toLocaleDateString()}
                          </div>
                          {ev.sha256_hash && (
                            <div className="font-mono" style={{ fontSize: '0.675rem', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Hash size={11} color="#10b981" /> SHA-256: {ev.sha256_hash.substring(0, 24)}...
                            </div>
                          )}
                        </div>
                      </div>

                      <a 
                        href={evidenceAPI.getFileUrl(ev._id)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.775rem', padding: '0.4rem 0.85rem' }}
                      >
                        <Download size={14} /> Download / View
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: OFFICER & ADMIN ACTIONS */}
          {activeTab === 'officer_actions' && isOfficerOrAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Admin Assignment Section */}
              {isAdmin && (
                <form onSubmit={handleAssignOfficer} className="cyber-card">
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--cyber-blue)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={16} /> Officer Assignment & Re-allocation
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Assign To Investigation Officer</label>
                      <select 
                        className="form-control"
                        value={selectedOfficer}
                        onChange={(e) => setSelectedOfficer(e.target.value)}
                        required
                      >
                        <option value="">-- Select Officer from Roster --</option>
                        {officers.map(o => (
                          <option key={o._id} value={o._id}>
                            {o.name} ({o.badge_number}) - Active: {o.active_cases_count} cases
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Assignment Directive / Remarks</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="e.g. Expedite bank lien mark and IP trace"
                        value={assignNotes}
                        onChange={(e) => setAssignNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={submittingAssign} style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>
                    {submittingAssign ? 'Assigning Officer...' : 'Confirm Assignment'}
                  </button>
                </form>
              )}

              {/* Status Update & Case Resolution / Rejection Form */}
              <form onSubmit={handleStatusUpdate} className="cyber-card">
                <h4 style={{ fontSize: '0.85rem', color: '#fff', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={16} color="#38bdf8" /> Case Lifecycle Status Transition
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Update Status</label>
                    <select 
                      className="form-control"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="Under Review">Under Review</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Investigation in Progress">Investigation in Progress</option>
                      <option value="Resolved">Resolved (Case Concluded)</option>
                      <option value="Rejected">Rejected (Not actionable / Outside jurisdiction)</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Adjust Case Priority</label>
                    <select 
                      className="form-control"
                      value={priorityUpdate}
                      onChange={(e) => setPriorityUpdate(e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                {newStatus === 'Rejected' && (
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#f87171' }}>Rejection Reason (Mandatory)</label>
                    <textarea 
                      className="form-control"
                      rows={2}
                      placeholder="Specify clear legal/jurisdictional grounds for rejecting this complaint..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      required
                    />
                  </div>
                )}

                {newStatus === 'Resolved' && (
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#34d399' }}>Resolution Summary & Findings</label>
                    <textarea 
                      className="form-control"
                      rows={2}
                      placeholder="Details of funds recovered, domains blocked, or legal notice issued..."
                      value={resolutionSummary}
                      onChange={(e) => setResolutionSummary(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Status Transition Log Notes</label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="Brief progress note appended to audit trail..."
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={submittingStatus} style={{ fontSize: '0.8rem' }}>
                  {submittingStatus ? 'Updating Case Status...' : 'Apply Status Update'}
                </button>
              </form>

              {/* Add Investigation Forensic Note Form */}
              <form onSubmit={handleAddInvestigationNote} className="cyber-card">
                <h4 style={{ fontSize: '0.85rem', color: '#fff', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Send size={16} color="#38bdf8" /> Record Forensic Investigation Note
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Activity Type</label>
                    <select 
                      className="form-control"
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value)}
                    >
                      <option value="EVIDENCE_ANALYSIS">Evidence Forensic Analysis</option>
                      <option value="SUSPECT_INTERROGATION">Suspect Interrogation</option>
                      <option value="BANK_NOTICE_SENT">Bank Section 91 CrPC Notice</option>
                      <option value="IP_TRACE">IP & ISP Geolocation Trace</option>
                      <option value="FORENSIC_REPORT">Forensic Report Filing</option>
                      <option value="CASE_NOTE">Case Progress Milestone Note</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Milestone Title</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. Bank Account Lien Notice Served"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Investigation Findings</label>
                  <textarea 
                    className="form-control"
                    rows={2}
                    placeholder="Forensic details discovered during investigation..."
                    value={noteFindings}
                    onChange={(e) => setNoteFindings(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Action Taken</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. Domain blocked via CERT-In"
                      value={noteAction}
                      onChange={(e) => setNoteAction(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Next Steps</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. Awaiting CDR call records from telecom operator"
                      value={noteNextSteps}
                      onChange={(e) => setNoteNextSteps(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-secondary" disabled={submittingNote} style={{ fontSize: '0.8rem' }}>
                  {submittingNote ? 'Saving Entry...' : 'Save Forensic Log Entry'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
