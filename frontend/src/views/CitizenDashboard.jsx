import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { complaintsAPI, analyticsAPI } from '../api/client';
import { 
  ShieldAlert, CheckCircle, Clock, DollarSign, Search, 
  FileText, ArrowUpRight, Eye, AlertTriangle, ShieldCheck, Filter
} from 'lucide-react';

export default function CitizenDashboard({ onOpenComplaintModal, onSelectComplaint }) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, complaintsRes] = await Promise.all([
        analyticsAPI.getCitizenStats(),
        complaintsAPI.list({ search: searchTerm, status: statusFilter })
      ]);
      setMetrics(statsRes.data?.summary || {});
      setComplaints(complaintsRes.data?.complaints || []);
    } catch (err) {
      console.error("Failed to load citizen data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter]);

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
      {/* Welcome Banner */}
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
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--cyber-blue)', fontWeight: 700, letterSpacing: '0.05em' }}>
              Citizen Self-Service Portal
            </span>
            <span className="pulse-indicator" />
          </div>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.35rem 0' }}>
            Welcome, {user?.full_name}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, maxWidth: '580px' }}>
            Track the status of your reported cybercrimes, examine forensic investigation timelines, and submit digital evidence.
          </p>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={onOpenComplaintModal}
          style={{ padding: '0.75rem 1.4rem', fontSize: '0.9rem' }}
        >
          <ShieldAlert size={18} /> Lodge New Cybercrime
        </button>
      </div>

      {/* Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
        <div className="cyber-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>Total Complaints</span>
            <FileText size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)' }}>
            {metrics?.total_complaints ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Filed under your national identity
          </div>
        </div>

        <div className="cyber-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>Under Active Investigation</span>
            <Clock size={18} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#06b6d4', fontFamily: 'var(--font-heading)' }}>
            {metrics?.in_progress ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Assigned to Cyber Police Officers
          </div>
        </div>

        <div className="cyber-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>Resolved Cases</span>
            <CheckCircle size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-heading)' }}>
            {metrics?.resolved ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Successfully recovered / concluded
          </div>
        </div>

        <div className="cyber-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 600 }}>Reported Financial Loss</span>
            <DollarSign size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f87171', fontFamily: 'var(--font-mono)' }}>
            ₹{(metrics?.total_financial_loss || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Subject to bank lien & freeze notice
          </div>
        </div>
      </div>

      {/* Complaints History Section */}
      <div className="cyber-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>My Cybercrime Complaints</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Live status, assigned officers and investigation history
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search by ID, keyword..."
                className="form-control"
                style={{ paddingLeft: '2rem', width: '220px', fontSize: '0.8rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select 
              className="form-control" 
              style={{ width: '170px', fontSize: '0.8rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
          </div>
        </div>

        {/* Complaints Table */}
        <div className="cyber-table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Category</th>
                <th>Incident Date</th>
                <th>Financial Loss</th>
                <th>Priority</th>
                <th>Current Status</th>
                <th>Assigned Officer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                    Loading complaints from MongoDB...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-dim)' }}>
                    No cybercrime complaints matching your filters.
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
                      <span style={{ fontWeight: 500, color: '#fff' }}>{c.category}</span>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>{c.incident_location}</div>
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
                      {c.assigned_officer_name ? (
                        <div>
                          <div style={{ fontWeight: 500, color: '#cbd5e1' }}>{c.assigned_officer_name}</div>
                          <span className="font-mono" style={{ fontSize: '0.675rem', color: 'var(--cyber-blue)' }}>
                            {c.assigned_officer_badge}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                          Pending Assignment
                        </span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => onSelectComplaint(c)}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        <Eye size={13} /> View & Track
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
