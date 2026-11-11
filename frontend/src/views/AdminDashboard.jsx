import React, { useState, useEffect } from 'react';
import { analyticsAPI, complaintsAPI, adminAPI } from '../api/client';
import { 
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, 
  LinearScale, BarElement, PointElement, LineElement, Title 
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { 
  ShieldAlert, Clock, CheckCircle, AlertTriangle, DollarSign, 
  Users, UserCheck, Activity, Download, Plus, Eye, Search, 
  RefreshCw, Layers, Shield, FileText, Check, X
} from 'lucide-react';

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, 
  LinearScale, BarElement, PointElement, LineElement, Title
);

export default function AdminDashboard({ onSelectComplaint, activeSubTab = 'overview' }) {
  const [tab, setTab] = useState(activeSubTab); // 'overview' | 'complaints' | 'officers' | 'citizens' | 'categories' | 'audit_logs'
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data lists
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [categories, setCategories] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Modals
  const [showAddOfficer, setShowAddOfficer] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [assigningComplaint, setAssigningComplaint] = useState(null);
  const [selectedOfficerForAssign, setSelectedOfficerForAssign] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  // Form states
  const [newOfficer, setNewOfficer] = useState({
    full_name: '', email: '', badge_number: '', rank: 'Inspector',
    department: 'Financial Cyber Fraud Wing', phone: '', specialization: 'Phishing, UPI Fraud'
  });
  const [newCategory, setNewCategory] = useState({
    name: '', description: '', default_severity: 'Medium', sla_days: 5
  });

  // Filters
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintStatus, setComplaintStatus] = useState('');
  const [complaintPriority, setComplaintPriority] = useState('');

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTab(activeSubTab);
  }, [activeSubTab]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.getAdminStats();
      setMetrics(res.data || {});
      setOfficers(res.data?.officer_workload || []);
    } catch (err) {
      console.error("Failed to load admin metrics:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await complaintsAPI.list({
        search: complaintSearch,
        status: complaintStatus,
        priority: complaintPriority,
        limit: 50
      });
      setComplaints(res.data?.complaints || []);
    } catch (err) {
      console.error("Failed to load complaints:", err);
    }
  };

  const fetchOfficers = async () => {
    try {
      const res = await adminAPI.getOfficers();
      setOfficers(res.data || []);
    } catch (err) {
      console.error("Failed to load officers:", err);
    }
  };

  const fetchCitizens = async () => {
    try {
      const res = await adminAPI.getUsers({ role: 'citizen', limit: 50 });
      setCitizens(res.data?.users || []);
    } catch (err) {
      console.error("Failed to load citizens:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await adminAPI.getCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await adminAPI.getAuditLogs({ limit: 50 });
      setAuditLogs(res.data?.logs || []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (tab === 'complaints') fetchComplaints();
    if (tab === 'officers') fetchOfficers();
    if (tab === 'citizens') fetchCitizens();
    if (tab === 'categories') fetchCategories();
    if (tab === 'audit_logs') fetchAuditLogs();
  }, [tab, complaintSearch, complaintStatus, complaintPriority]);

  const handleToggleUserStatus = async (userId) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      fetchCitizens();
      setMessage("User status updated successfully");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createOfficer({
        ...newOfficer,
        specialization: newOfficer.specialization.split(',').map(s => s.trim())
      });
      setShowAddOfficer(false);
      fetchOfficers();
      fetchOverview();
      setMessage("Officer account created successfully");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createCategory(newCategory);
      setShowAddCategory(false);
      fetchCategories();
      setMessage("Crime category added successfully");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuickAssign = async (e) => {
    e.preventDefault();
    if (!selectedOfficerForAssign || !assigningComplaint) return;
    try {
      await complaintsAPI.assign(assigningComplaint._id, {
        officer_id: selectedOfficerForAssign,
        notes: assignNotes
      });
      setAssigningComplaint(null);
      fetchComplaints();
      fetchOverview();
      setMessage("Officer assigned successfully");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Chart Data Preparation
  const categoryLabels = (metrics?.category_distribution || []).map(c => c.category);
  const categoryCounts = (metrics?.category_distribution || []).map(c => c.count);
  const doughnutData = {
    labels: categoryLabels,
    datasets: [{
      data: categoryCounts,
      backgroundColor: [
        '#38bdf8', '#06b6d4', '#6366f1', '#a855f7', '#ec4899', 
        '#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#8b5cf6'
      ],
      borderWidth: 1,
      borderColor: '#0f172a'
    }]
  };

  const monthlyLabels = (metrics?.monthly_trends || []).map(m => m.month);
  const monthlyTotal = (metrics?.monthly_trends || []).map(m => m.count);
  const monthlyResolved = (metrics?.monthly_trends || []).map(m => m.resolved);
  const monthlyBarData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Total Lodged Cases',
        data: monthlyTotal,
        backgroundColor: 'rgba(56, 189, 248, 0.7)',
        borderRadius: 4
      },
      {
        label: 'Resolved & Recovered',
        data: monthlyResolved,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 4
      }
    ]
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

  const summary = metrics?.summary || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Admin Command Center Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(14, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.7) 100%)',
        border: '1px solid var(--border-card)',
        borderRadius: '14px',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--cyber-blue)', fontWeight: 700, letterSpacing: '0.08em' }}>
              National Cyber Command & Control Center
            </span>
            <span className="pulse-indicator" />
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem 0' }}>
            Cybercrime Analytics & Operations Matrix
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Powered by MongoDB Aggregation Pipelines, Compound Indexing, and GridFS Forensics
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a 
            href={adminAPI.exportComplaintsUrl()} 
            className="btn btn-secondary" 
            download
            style={{ fontSize: '0.825rem' }}
          >
            <Download size={15} /> Export Complaints CSV
          </a>
          <button 
            className="btn btn-primary" 
            onClick={() => { fetchOverview(); fetchComplaints(); }}
            style={{ fontSize: '0.825rem' }}
          >
            <RefreshCw size={15} /> Refresh MongoDB Pipelines
          </button>
        </div>
      </div>

      {message && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#34d399', fontSize: '0.85rem' }}>
          ✓ {message}
        </div>
      )}
      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem' }}>
          ⚠ {error}
        </div>
      )}

      {/* Admin Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-card)',
        background: 'rgba(11, 17, 32, 0.6)',
        padding: '0 1rem',
        borderRadius: '8px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'overview', label: 'Command Metrics & Visual Charts' },
          { id: 'complaints', label: `Complaints Queue (${summary.total_complaints || 0})` },
          { id: 'officers', label: 'Officer Workload & Roster' },
          { id: 'citizens', label: 'Citizen Directory' },
          { id: 'categories', label: 'Crime Categories' },
          { id: 'audit_logs', label: 'System Security Audit Logs' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              padding: '0.85rem 1.25rem',
              border: 'none',
              background: 'none',
              color: tab === item.id ? 'var(--cyber-blue)' : 'var(--text-muted)',
              fontWeight: tab === item.id ? 600 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              borderBottom: tab === item.id ? '2px solid var(--cyber-blue)' : '2px solid transparent',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & CHARTS */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Key Pipeline Counters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="cyber-card">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>Total Complaints</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)', marginTop: '0.25rem' }}>
                {summary.total_complaints || 0}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--cyber-blue)' }}>MongoDB Indexed Collection</div>
            </div>

            <div className="cyber-card">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>Pending Cases</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-heading)', marginTop: '0.25rem' }}>
                {summary.pending_cases || 0}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Submitted + Under Review</div>
            </div>

            <div className="cyber-card">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>Under Investigation</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#06b6d4', fontFamily: 'var(--font-heading)', marginTop: '0.25rem' }}>
                {summary.under_investigation || 0}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Assigned to Forensics/Officers</div>
            </div>

            <div className="cyber-card">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>Resolved Cases</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-heading)', marginTop: '0.25rem' }}>
                {summary.resolved_cases || 0}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#10b981' }}>Clearance Rate: {summary.total_complaints ? Math.round((summary.resolved_cases / summary.total_complaints) * 100) : 0}%</div>
            </div>

            <div className="cyber-card">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>High / Critical Cases</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-heading)', marginTop: '0.25rem' }}>
                {summary.high_priority_cases || 0}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#f87171' }}>Urgent Action Mandate</div>
            </div>

            <div className="cyber-card">
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>Reported Financial Loss</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
                ₹{(summary.total_financial_loss || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Avg: ₹{(summary.avg_financial_loss || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Interactive Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="cyber-card" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Crime Category Distribution</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Calculated dynamically via MongoDB <code>$group</code> Aggregation Pipeline
                </p>
              </div>
              <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {categoryLabels.length > 0 ? (
                  <Doughnut 
                    data={doughnutData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'right', labels: { color: '#cbd5e1', font: { size: 11 } } }
                      }
                    }} 
                  />
                ) : (
                  <div style={{ color: 'var(--text-dim)' }}>No complaint records available</div>
                )}
              </div>
            </div>

            <div className="cyber-card" style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Monthly Trend: Lodged vs Resolved</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Aggregated with <code>$dateToString</code> & conditional sums
                </p>
              </div>
              <div style={{ height: '260px' }}>
                {monthlyLabels.length > 0 ? (
                  <Bar 
                    data={monthlyBarData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { labels: { color: '#cbd5e1', font: { size: 11 } } }
                      },
                      scales: {
                        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
                      }
                    }} 
                  />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                    No monthly trend data
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Officer Workload Breakdown Table */}
          <div className="cyber-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Officer Workload & Case Clearance Rate</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Generated using MongoDB <code>$lookup</code> on <code>officers</code> and <code>complaints</code>
                </p>
              </div>
              <button className="btn btn-secondary" onClick={() => setTab('officers')} style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
                Manage Officers
              </button>
            </div>

            <div className="cyber-table-container">
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>Officer Name</th>
                    <th>Badge Number</th>
                    <th>Rank / Designation</th>
                    <th>Department</th>
                    <th>Active Cases</th>
                    <th>Resolved Cases</th>
                    <th>Clearance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(metrics?.officer_workload || []).map(off => {
                    const total = (off.active_cases_count || 0) + (off.resolved_cases_count || 0);
                    const rate = total > 0 ? Math.round((off.resolved_cases_count / total) * 100) : 0;
                    return (
                      <tr key={off.officer_id}>
                        <td style={{ fontWeight: 600, color: '#fff' }}>{off.name}</td>
                        <td className="font-mono" style={{ color: '#38bdf8' }}>{off.badge_number}</td>
                        <td>{off.rank}</td>
                        <td>{off.department}</td>
                        <td>
                          <span className="badge badge-assigned">{off.active_cases_count || 0} Active</span>
                        </td>
                        <td>
                          <span className="badge badge-resolved">{off.resolved_cases_count || 0} Concluded</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${rate}%`, height: '100%', background: '#10b981' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPLAINTS & ASSIGNMENT */}
      {tab === 'complaints' && (
        <div className="cyber-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>System Complaints Master Index</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Filter, triage, and assign investigation officers to cybercrime reports
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  placeholder="Search ID, citizen, suspect..."
                  className="form-control"
                  style={{ paddingLeft: '2rem', width: '220px', fontSize: '0.8rem' }}
                  value={complaintSearch}
                  onChange={(e) => setComplaintSearch(e.target.value)}
                />
              </div>

              <select 
                className="form-control" 
                style={{ width: '160px', fontSize: '0.8rem' }}
                value={complaintStatus}
                onChange={(e) => setComplaintStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Assigned">Assigned</option>
                <option value="Investigation in Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
                <option value="Closed">Closed</option>
              </select>

              <select 
                className="form-control" 
                style={{ width: '150px', fontSize: '0.8rem' }}
                value={complaintPriority}
                onChange={(e) => setComplaintPriority(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Category</th>
                  <th>Complainant</th>
                  <th>Incident Date</th>
                  <th>Loss (INR)</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned Officer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-dim)' }}>
                      No complaints found matching criteria.
                    </td>
                  </tr>
                ) : (
                  complaints.map(c => (
                    <tr key={c._id}>
                      <td className="font-mono" style={{ fontWeight: 700, color: '#38bdf8' }}>{c.complaint_id}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{c.category}</span>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{c.incident_location}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: '#cbd5e1' }}>{c.citizen_name || 'Anonymous'}</div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{c.citizen_email}</div>
                      </td>
                      <td>{new Date(c.incident_date).toLocaleDateString()}</td>
                      <td>
                        {c.financial_loss > 0 ? (
                          <span className="font-mono" style={{ color: '#f87171', fontWeight: 600 }}>
                            ₹{c.financial_loss.toLocaleString('en-IN')}
                          </span>
                        ) : '—'}
                      </td>
                      <td>{getPriorityBadge(c.priority)}</td>
                      <td>{getStatusBadge(c.status)}</td>
                      <td>
                        {c.assigned_officer_name ? (
                          <div>
                            <span style={{ fontWeight: 500, color: '#cbd5e1' }}>{c.assigned_officer_name}</span>
                            <div className="font-mono" style={{ fontSize: '0.675rem', color: 'var(--cyber-blue)' }}>{c.assigned_officer_badge}</div>
                          </div>
                        ) : (
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => { setAssigningComplaint(c); setSelectedOfficerForAssign(''); setAssignNotes(''); }}
                            style={{ fontSize: '0.725rem', padding: '0.25rem 0.6rem', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.4)' }}
                          >
                            + Assign Officer
                          </button>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => onSelectComplaint(c)}
                            style={{ fontSize: '0.725rem', padding: '0.35rem 0.65rem' }}
                          >
                            <Eye size={13} /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OFFICERS ROSTER */}
      {tab === 'officers' && (
        <div className="cyber-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Investigation Officers Directory</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Active cyber forensics personnel, badges, and departmental workload distribution
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddOfficer(true)} style={{ fontSize: '0.825rem' }}>
              <Plus size={16} /> Register New Officer
            </button>
          </div>

          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Badge No</th>
                  <th>Officer Name</th>
                  <th>Rank</th>
                  <th>Department</th>
                  <th>Specialization</th>
                  <th>Active Cases</th>
                  <th>Resolved Cases</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {officers.map(o => (
                  <tr key={o._id || o.officer_id}>
                    <td className="font-mono" style={{ fontWeight: 700, color: '#38bdf8' }}>{o.badge_number}</td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>
                      {o.name}
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{o.email}</div>
                    </td>
                    <td>{o.rank}</td>
                    <td>{o.department}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {(o.specialization || []).map((s, idx) => (
                          <span key={idx} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td><span className="badge badge-assigned">{o.active_cases_count || 0}</span></td>
                    <td><span className="badge badge-resolved">{o.resolved_cases_count || 0}</span></td>
                    <td>
                      <span className="badge badge-resolved" style={{ fontSize: '0.7rem' }}>Active Duty</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CITIZENS DIRECTORY */}
      {tab === 'citizens' && (
        <div className="cyber-card" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Registered Citizens Directory</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Manage registered citizen portals and account activity
            </p>
          </div>

          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>ID Proof</th>
                  <th>Address</th>
                  <th>Registration Date</th>
                  <th>Account Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {citizens.map(c => (
                  <tr key={c._id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{c.full_name}</td>
                    <td style={{ color: '#38bdf8' }}>{c.email}</td>
                    <td>{c.phone || 'N/A'}</td>
                    <td>{c.id_proof_type ? `${c.id_proof_type} (${c.id_proof_number || ''})` : 'Self-verified'}</td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.address || '—'}</td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      {c.is_active ? (
                        <span className="badge badge-resolved">Active</span>
                      ) : (
                        <span className="badge badge-rejected">Suspended</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className={`btn ${c.is_active ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggleUserStatus(c._id)}
                        style={{ fontSize: '0.725rem', padding: '0.3rem 0.65rem' }}
                      >
                        {c.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CRIME CATEGORIES */}
      {tab === 'categories' && (
        <div className="cyber-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Cybercrime Classifications & SLA Matrix</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                MongoDB Schema-validated cybercrime categories with default SLA response targets
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddCategory(true)} style={{ fontSize: '0.825rem' }}>
              <Plus size={16} /> Add Category
            </button>
          </div>

          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Default Severity</th>
                  <th>Target SLA</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat._id}>
                    <td style={{ fontWeight: 700, color: '#38bdf8' }}>{cat.name}</td>
                    <td style={{ color: '#cbd5e1', fontSize: '0.825rem', maxWidth: '380px' }}>{cat.description}</td>
                    <td>{getPriorityBadge(cat.default_severity || 'Medium')}</td>
                    <td>
                      <span className="font-mono" style={{ color: '#fbbf24', fontWeight: 600 }}>
                        {cat.sla_days || 7} Days
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-resolved">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: SYSTEM AUDIT LOGS */}
      {tab === 'audit_logs' && (
        <div className="cyber-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>System Security Audit Trails</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Tamper-evident logs of authentication, status modifications, and evidence operations
              </p>
            </div>
            <a href={adminAPI.exportAuditLogsUrl()} className="btn btn-secondary" download style={{ fontSize: '0.825rem' }}>
              <Download size={15} /> Export Audit CSV
            </a>
          </div>

          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Actor Email</th>
                  <th>Role</th>
                  <th>Target Entity</th>
                  <th>IP Address</th>
                  <th>Audit Context Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log._id}>
                    <td className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ color: '#fff', fontSize: '0.8rem' }}>{log.user_email}</td>
                    <td><span className="badge badge-submitted">{log.user_role}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{log.target_entity} ({log.target_id || 'sys'})</td>
                    <td className="font-mono" style={{ fontSize: '0.75rem', color: '#10b981' }}>{log.ip_address}</td>
                    <td style={{ fontSize: '0.75rem', color: '#cbd5e1', maxWidth: '240px' }}>
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK ASSIGN OFFICER MODAL */}
      {assigningComplaint && (
        <div className="modal-overlay" onClick={() => setAssigningComplaint(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Assign Investigation Officer</h3>
              <button onClick={() => setAssigningComplaint(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleQuickAssign} style={{ padding: '1.25rem' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Case Reference</div>
                <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8' }}>{assigningComplaint.complaint_id}</div>
                <div style={{ fontSize: '0.8rem', color: '#fff' }}>{assigningComplaint.category} • Loss: ₹{(assigningComplaint.financial_loss || 0).toLocaleString('en-IN')}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Select Officer</label>
                <select 
                  className="form-control"
                  value={selectedOfficerForAssign}
                  onChange={(e) => setSelectedOfficerForAssign(e.target.value)}
                  required
                >
                  <option value="">-- Choose from Officer Roster --</option>
                  {officers.map(o => (
                    <option key={o._id || o.officer_id} value={o._id || o.officer_id}>
                      {o.name} ({o.badge_number}) - {o.rank} • Active: {o.active_cases_count || 0}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Special Directives / Priority Notes</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Issue Section 91 notice to payment gateway immediately"
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssigningComplaint(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Officer Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER NEW OFFICER MODAL */}
      {showAddOfficer && (
        <div className="modal-overlay" onClick={() => setShowAddOfficer(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Register New Cyber Police Officer</h3>
              <button onClick={() => setShowAddOfficer(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateOfficer} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Officer Full Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={newOfficer.full_name} 
                    onChange={(e) => setNewOfficer({ ...newOfficer, full_name: e.target.value })}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Official Email *</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={newOfficer.email} 
                    onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value })}
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Badge Number *</label>
                  <input 
                    type="text" 
                    className="form-control font-mono" 
                    placeholder="CYBER-OFF-004"
                    value={newOfficer.badge_number} 
                    onChange={(e) => setNewOfficer({ ...newOfficer, badge_number: e.target.value })}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rank / Designation</label>
                  <select 
                    className="form-control"
                    value={newOfficer.rank}
                    onChange={(e) => setNewOfficer({ ...newOfficer, rank: e.target.value })}
                  >
                    <option value="Inspector">Inspector</option>
                    <option value="Sub-Inspector">Sub-Inspector</option>
                    <option value="Cyber Forensics Specialist">Cyber Forensics Specialist</option>
                    <option value="Assistant Commissioner">Assistant Commissioner</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Department / Wing</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newOfficer.department} 
                  onChange={(e) => setNewOfficer({ ...newOfficer, department: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Specializations (Comma separated)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="UPI Fraud, Phishing, Social Media Hacking"
                  value={newOfficer.specialization} 
                  onChange={(e) => setNewOfficer({ ...newOfficer, specialization: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddOfficer(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Officer Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CRIME CATEGORY MODAL */}
      {showAddCategory && (
        <div className="modal-overlay" onClick={() => setShowAddCategory(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Add Crime Category</h3>
              <button onClick={() => setShowAddCategory(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} style={{ padding: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Ransomware Extortion"
                  value={newCategory.name} 
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category Description</label>
                <textarea 
                  className="form-control" 
                  rows={2}
                  placeholder="Technical definition and qualifying parameters..."
                  value={newCategory.description} 
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Default Severity</label>
                  <select 
                    className="form-control"
                    value={newCategory.default_severity}
                    onChange={(e) => setNewCategory({ ...newCategory, default_severity: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Target SLA (Days)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="1"
                    value={newCategory.sla_days} 
                    onChange={(e) => setNewCategory({ ...newCategory, sla_days: parseInt(e.target.value) || 5 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCategory(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
