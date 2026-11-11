import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginPage from './views/LoginPage';
import CitizenDashboard from './views/CitizenDashboard';
import OfficerDashboard from './views/OfficerDashboard';
import AdminDashboard from './views/AdminDashboard';
import ComplaintDetailModal from './components/ComplaintDetailModal';
import FileComplaintModal from './components/FileComplaintModal';
import { complaintsAPI, adminAPI } from './api/client';
import { Search, ShieldAlert, FileText, CheckCircle } from 'lucide-react';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [officersList, setOfficersList] = useState([]);
  const [trackSearchId, setTrackSearchId] = useState('');
  const [trackError, setTrackError] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);

  // Set initial active tab based on role
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') setActiveTab('admin_overview');
      else if (user.role === 'officer') setActiveTab('officer_overview');
      else setActiveTab('citizen_overview');

      // Pre-load officers list for assignment dropdowns
      if (user.role === 'admin' || user.role === 'officer') {
        adminAPI.getOfficers().then(res => setOfficersList(res.data || [])).catch(() => {});
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="pulse-indicator" style={{ width: '16px', height: '16px', marginBottom: '1rem' }} />
          <div style={{ color: 'var(--cyber-blue)', fontSize: '0.9rem', fontWeight: 600 }}>
            Initializing Cyber Command Shell...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleSelectComplaint = async (complaint) => {
    try {
      // Fetch full details with evidence & notes
      const res = await complaintsAPI.getById(complaint._id || complaint.complaint_id);
      setSelectedComplaint(res.data);
    } catch (err) {
      setSelectedComplaint(complaint);
    }
  };

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!trackSearchId.trim()) return;
    setTrackLoading(true);
    setTrackError(null);
    try {
      const res = await complaintsAPI.getById(trackSearchId.trim());
      if (res.data) {
        setSelectedComplaint(res.data);
      } else {
        setTrackError("Complaint reference ID not found.");
      }
    } catch (err) {
      setTrackError(err.message || "Failed to find complaint.");
    } finally {
      setTrackLoading(false);
    }
  };

  const refreshSelectedComplaint = async () => {
    if (!selectedComplaint) return;
    try {
      const res = await complaintsAPI.getById(selectedComplaint._id);
      setSelectedComplaint(res.data);
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Top Navbar */}
      <Navbar onOpenNewComplaint={() => setShowFileModal(true)} />

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content Pane */}
        <main style={{ flex: 1, padding: '1.75rem', overflowY: 'auto', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
          {/* CITIZEN VIEWS */}
          {user.role === 'citizen' && (
            <>
              {activeTab === 'citizen_overview' && (
                <CitizenDashboard 
                  onOpenComplaintModal={() => setShowFileModal(true)}
                  onSelectComplaint={handleSelectComplaint}
                />
              )}

              {activeTab === 'my_complaints' && (
                <CitizenDashboard 
                  onOpenComplaintModal={() => setShowFileModal(true)}
                  onSelectComplaint={handleSelectComplaint}
                />
              )}

              {activeTab === 'file_complaint' && (
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('citizen_overview')} style={{ marginBottom: '1rem' }}>
                    ← Back to Dashboard
                  </button>
                  <div className="cyber-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <ShieldAlert size={26} color="#38bdf8" />
                      <div>
                        <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Lodge Cybercrime Complaint</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                          Submit incident report with evidence for police investigation
                        </p>
                      </div>
                    </div>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => setShowFileModal(true)}
                      style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem' }}
                    >
                      Open Official Complaint Registration Form
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'track_complaint' && (
                <div style={{ maxWidth: '650px', margin: '2rem auto' }}>
                  <div className="cyber-card" style={{ padding: '2rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '12px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.75rem auto'
                      }}>
                        <Search size={24} color="#38bdf8" />
                      </div>
                      <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Track Cybercrime Case Status</h2>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        Enter your unique complaint reference ID (e.g. <code>CC-202610-8491</code>)
                      </p>
                    </div>

                    <form onSubmit={handleTrackSubmit}>
                      <div className="form-group">
                        <label className="form-label">Complaint Reference ID</label>
                        <input 
                          type="text" 
                          className="form-control font-mono"
                          placeholder="CC-YYYYMM-XXXX"
                          value={trackSearchId}
                          onChange={(e) => setTrackSearchId(e.target.value)}
                          required
                          style={{ fontSize: '1.1rem', letterSpacing: '0.05em' }}
                        />
                      </div>

                      {trackError && (
                        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
                          ⚠ {trackError}
                        </div>
                      )}

                      <button type="submit" className="btn btn-primary" disabled={trackLoading} style={{ width: '100%', padding: '0.75rem' }}>
                        {trackLoading ? 'Searching MongoDB Collections...' : 'Track Forensic Investigation'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}

          {/* OFFICER VIEWS */}
          {user.role === 'officer' && (
            <>
              {activeTab === 'officer_overview' && (
                <OfficerDashboard onSelectComplaint={handleSelectComplaint} />
              )}
              {activeTab === 'assigned_cases' && (
                <OfficerDashboard onSelectComplaint={handleSelectComplaint} />
              )}
              {activeTab === 'all_complaints' && (
                <OfficerDashboard onSelectComplaint={handleSelectComplaint} />
              )}
            </>
          )}

          {/* ADMIN VIEWS */}
          {user.role === 'admin' && (
            <AdminDashboard 
              onSelectComplaint={handleSelectComplaint} 
              activeSubTab={
                activeTab === 'admin_overview' ? 'overview' : 
                activeTab === 'all_complaints' ? 'complaints' : 
                activeTab === 'officer_management' ? 'officers' : 
                activeTab === 'citizen_management' ? 'citizens' : 
                activeTab === 'crime_categories' ? 'categories' : 
                activeTab === 'audit_logs' ? 'audit_logs' : 'overview'
              }
            />
          )}
        </main>
      </div>

      {/* COMPLAINT DETAIL MODAL */}
      {selectedComplaint && (
        <ComplaintDetailModal 
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onRefresh={refreshSelectedComplaint}
          officers={officersList}
        />
      )}

      {/* FILE COMPLAINT MODAL */}
      {showFileModal && (
        <FileComplaintModal 
          onClose={() => setShowFileModal(false)}
          onSuccess={(newComplaint) => {
            // refresh
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
