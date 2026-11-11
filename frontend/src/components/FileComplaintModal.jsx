import React, { useState, useEffect } from 'react';
import { complaintsAPI, evidenceAPI, adminAPI } from '../api/client';
import { 
  X, ShieldAlert, CheckCircle, UploadCloud, Calendar, 
  MapPin, DollarSign, UserX, AlertCircle, FileText, Check 
} from 'lucide-react';

export default function FileComplaintModal({ onClose, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Form states
  const [category, setCategory] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split('T')[0]);
  const [incidentTime, setIncidentTime] = useState('12:00');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [description, setDescription] = useState('');
  const [financialLoss, setFinancialLoss] = useState('');
  const [priority, setPriority] = useState('Medium');

  // Suspect fields
  const [suspectName, setSuspectName] = useState('');
  const [suspectPhone, setSuspectPhone] = useState('');
  const [suspectEmail, setSuspectEmail] = useState('');
  const [suspectUpi, setSuspectUpi] = useState('');
  const [suspectBankAccount, setSuspectBankAccount] = useState('');
  const [suspectWebsite, setSuspectWebsite] = useState('');
  const [suspectNotes, setSuspectNotes] = useState('');

  // Evidence files
  const [files, setFiles] = useState([]);
  const [evidenceType, setEvidenceType] = useState('Screenshot');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submittedComplaint, setSubmittedComplaint] = useState(null);

  useEffect(() => {
    async function loadCats() {
      try {
        const res = await adminAPI.getCategories();
        setCategories(res.data || []);
        if (res.data && res.data.length > 0) {
          setCategory(res.data[0].name);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoadingCats(false);
      }
    }
    loadCats();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please provide a detailed description of the incident.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const complaintData = {
        category,
        incident_date: incidentDate,
        incident_time: incidentTime,
        incident_location: incidentLocation || 'Online / Cyber Space',
        description,
        financial_loss: financialLoss ? parseFloat(financialLoss) : 0.0,
        priority,
        suspect_name: suspectName,
        suspect_phone: suspectPhone,
        suspect_email: suspectEmail,
        suspect_upi: suspectUpi,
        suspect_bank_account: suspectBankAccount,
        suspect_website: suspectWebsite,
        suspect_notes: suspectNotes
      };

      // 1. Create Complaint
      const res = await complaintsAPI.create(complaintData);
      const created = res.data;

      // 2. Upload Evidence Files to GridFS
      if (files.length > 0 && created._id) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('evidence_type', evidenceType);
          formData.append('description', `Initial submission evidence: ${file.name}`);
          try {
            await evidenceAPI.upload(created._id, formData);
          } catch (uploadErr) {
            console.error("Evidence upload warning:", uploadErr);
          }
        }
      }

      setSubmittedComplaint(created);
      if (onSuccess) onSuccess(created);
    } catch (err) {
      setError(err.message || "Failed to lodge cybercrime complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '780px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              <ShieldAlert size={18} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Lodge Cybercrime Complaint</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Official National Incident Registration • Form 43A Compliant
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem' }}>
          {submittedComplaint ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}>
                <CheckCircle size={36} color="#10b981" />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.5rem' }}>
                Complaint Registered Successfully!
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                Your complaint has been logged into the National Cyber Crime database and queued for investigation.
              </p>

              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '12px',
                padding: '1.25rem',
                maxWidth: '420px',
                margin: '0 auto 1.75rem auto'
              }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                  Unique Complaint Reference ID
                </div>
                <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.05em' }}>
                  {submittedComplaint.complaint_id}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem' }}>
                  Keep this ID safe for tracking status & legal correspondence.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button className="btn btn-primary" onClick={onClose}>
                  Done & View Dashboard
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  ⚠ {error}
                </div>
              )}

              {/* SECTION 1: CRIME CLASSIFICATION & INCIDENT DETAILS */}
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cyber-blue)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                1. Incident Classification & Details
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Crime Category *</label>
                  <select 
                    className="form-control"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    {loadingCats ? (
                      <option>Loading categories from MongoDB...</option>
                    ) : (
                      categories.map(c => (
                        <option key={c._id} value={c.name}>{c.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Platform / Location *</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. WhatsApp, UPI / GPay, NetBanking, Instagram"
                    value={incidentLocation}
                    onChange={(e) => setIncidentLocation(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Incident Date *</label>
                  <input 
                    type="date" 
                    className="form-control"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Approximate Time</label>
                  <input 
                    type="time" 
                    className="form-control"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Financial Loss (INR)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    placeholder="0.00"
                    min="0"
                    value={financialLoss}
                    onChange={(e) => setFinancialLoss(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Incident Narrative *</label>
                <textarea 
                  className="form-control"
                  rows={4}
                  placeholder="Provide chronological events: how scammer contacted you, links clicked, deceptive claims made, OTP or credentials entered..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* SECTION 2: SUSPECT DETAILS (OPTIONAL) */}
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cyber-blue)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '1.25rem 0 0.75rem 0' }}>
                2. Suspect / Accused Identifiers (Optional)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Suspect Name / Online Handle</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="e.g. Fake Customer Care / @scam_user"
                    value={suspectName}
                    onChange={(e) => setSuspectName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Suspect Phone / WhatsApp No.</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="+91 XXXXX XXXXX"
                    value={suspectPhone}
                    onChange={(e) => setSuspectPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Suspect UPI ID / VPA</label>
                  <input 
                    type="text" 
                    className="form-control font-mono"
                    placeholder="e.g. fraudulent.merchant@okaxis"
                    value={suspectUpi}
                    onChange={(e) => setSuspectUpi(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Suspect Bank Account Number / IFSC</label>
                  <input 
                    type="text" 
                    className="form-control font-mono"
                    placeholder="e.g. 501002938192 (HDFC0001234)"
                    value={suspectBankAccount}
                    onChange={(e) => setSuspectBankAccount(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phishing / Scam Website URL</label>
                <input 
                  type="text" 
                  className="form-control font-mono"
                  placeholder="https://malicious-netbanking-portal.xyz"
                  value={suspectWebsite}
                  onChange={(e) => setSuspectWebsite(e.target.value)}
                />
              </div>

              {/* SECTION 3: DIGITAL EVIDENCE UPLOAD (GridFS) */}
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cyber-blue)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '1.25rem 0 0.75rem 0' }}>
                3. Digital Evidence Attachments (MongoDB GridFS Storage)
              </div>

              <div style={{
                border: '1px dashed rgba(56, 189, 248, 0.4)',
                borderRadius: '10px',
                padding: '1.25rem',
                background: 'rgba(11, 17, 32, 0.6)',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <UploadCloud size={24} color="#38bdf8" />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                      Upload Screenshots, Bank Statements, or PDF Reports
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Accepted formats: PNG, JPG, PDF, TXT, CSV (Up to 16MB) • Stored with SHA-256 Checksum
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                  <input 
                    type="file" 
                    multiple 
                    className="form-control"
                    onChange={handleFileChange}
                    style={{ padding: '0.4rem' }}
                  />
                  <select 
                    className="form-control"
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value)}
                  >
                    <option value="Screenshot">Screenshot / Screen Grab</option>
                    <option value="Bank Statement">Bank Statement / Payment Receipt</option>
                    <option value="Chat Log">Chat Conversation / SMS Export</option>
                    <option value="Email Header">Email Headers / Technical Logs</option>
                    <option value="Other">Other Supporting Document</option>
                  </select>
                </div>

                {files.length > 0 && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#38bdf8' }}>
                    Selected {files.length} file(s): {files.map(f => f.name).join(', ')}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting & Indexing into MongoDB...' : 'Lodge Cybercrime Complaint'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
