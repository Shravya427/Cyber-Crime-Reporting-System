import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { complaintsAPI, analyticsAPI } from '../api/client';
import { 
  ShieldCheck, ShieldAlert, Clock, CheckCircle, AlertTriangle, Search, 
  FileText, Eye, Activity, Filter, Layers, User
} from 'lucide-react';

export default function OfficerDashboard({ onSelectComplaint }) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, complaintsRes] = await Promise.all([
        analyticsAPI.getOfficerStats(),
        complaintsAPI.list({
          scope: 'my',
          search: searchTerm,
          status: statusFilter,
          priority: priorityFilter
        })
      ]);
      setMetrics(statsRes.data?.summary || {});
      setComplaints(complaintsRes.data?.complaints || []);
    } catch (err) {
      console.error("Failed to load officer data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter, priorityFilter]);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Officer Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(14, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.5) 100%)',
        border: '1px solid var(--border-card)',
        borderRadius: '14px',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="font-mono" style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--cyber-blue)', fontWeight: 700 }}>
              {user?.badge_number || 'CYBER-OFF'} • {user?.rank || 'Inspector'}
            </span>
            <span className="pulse-indicator" />
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.35rem 0' }}>
            Officer Workspace: {user?.full_name}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            {user?.department || 'Cyber Crime Police Station'} • Forensic case triage, digital evidence inspection, and status management.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span className="badge badge-assigned" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            Active Duty • Jurisdiction Cyber Cell
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="cyber-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>Assigned Cases</span>
            <FileText size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)' }}>
            {metrics?.total_cases ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Lifetime assignments
          </div>
        </div>

        <div className="cyber-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>Active In-Progress</span>
            <Clock size={18} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#06b6d4', fontFamily: 'var(--font-heading)' }}>
            {metrics?.active_cases ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Active forensic inquiries
          </div>
        </div>

        <div className="cyber-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>Under Review</span>
            <AlertTriangle size={18} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-heading)' }}>
            {metrics?.under_review ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Pending preliminary triage
          </div>
        </div>

        <div className="cyber-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>Resolved Cases</span>
            <CheckCircle size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-heading)' }}>
            {metrics?.resolved_cases ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Chargesheeted / Recovered
          </div>
        </div>

        <div className="cyber-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>Critical Priority</span>
            <ShieldAlert size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-heading)' }}>
            {metrics?.critical_cases ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Urgent financial / life safety
          </div>
        </div>
      </div>

      {/* Case Management Docket */}
      <div className="cyber-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Assigned Investigation Docket</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Manage assigned cybercrime complaints, attach forensic notes, and update statuses
            </p>
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search ID, suspect, text..."
                className="form-control"
                style={{ paddingLeft: '2rem', width: '210px', fontSize: '0.8rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select 
              className="form-control" 
              style={{ width: '150px', fontSize: '0.8rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="Investigation in Progress">In Progress</option>
              <option value="Under Review">Under Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
              <option value="Closed">Closed</option>
            </select>

            <select 
              className="form-control" 
              style={{ width: '140px', fontSize: '0.8rem' }}
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="cyber-table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Category</th>
                <th>Complainant</th>
                <th>Incident Date</th>
                <th>Financial Loss</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                    Loading case files from MongoDB...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-dim)' }}>
                    No assigned cases matching the filters.
                  </td>
                </tr>
              ) : (
                complaints.map(c => (
                  <tr key={c._id}>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 700, color: '#38bdf8' }}>
                        {c.complaint_id}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{c.category}</span>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{c.incident_location}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#cbd5e1' }}>{c.citizen_name || 'Anonymous'}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{c.citizen_phone || c.citizen_email}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem' }}>
                        {new Date(c.incident_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      {c.financial_loss > 0 ? (
                        <span className="font-mono" style={{ color: '#f87171', fontWeight: 600 }}>
                          ₹{c.financial_loss.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>—</span>
                      )}
                    </td>
                    <td>{getPriorityBadge(c.priority)}</td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => onSelectComplaint(c)}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        <Eye size={13} /> Manage Case
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
