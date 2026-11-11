import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, ShieldAlert, FileText, Search, Database, 
  Users, UserCheck, Shield, Activity, FileSpreadsheet, Layers, Lock
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  const role = user?.role || 'citizen';

  const citizenNav = [
    { id: 'citizen_overview', label: 'My Dashboard', icon: LayoutDashboard },
    { id: 'my_complaints', label: 'Complaint History', icon: FileText },
    { id: 'file_complaint', label: 'Lodge Cyber Complaint', icon: ShieldAlert },
    { id: 'track_complaint', label: 'Track Case Status', icon: Search },
  ];

  const officerNav = [
    { id: 'officer_overview', label: 'Officer Dashboard', icon: LayoutDashboard },
    { id: 'assigned_cases', label: 'Assigned Cases', icon: FileText },
    { id: 'all_complaints', label: 'All Jurisdictional Cases', icon: Search },
  ];

  const adminNav = [
    { id: 'admin_overview', label: 'Command Center', icon: LayoutDashboard },
    { id: 'all_complaints', label: 'Complaints & Assignment', icon: FileText },
    { id: 'officer_management', label: 'Officer Roster', icon: UserCheck },
    { id: 'citizen_management', label: 'Citizen Directory', icon: Users },
    { id: 'crime_categories', label: 'Crime Categories', icon: Layers },
    { id: 'audit_logs', label: 'System Audit Logs', icon: Activity },
  ];

  const currentNav = role === 'admin' ? adminNav : (role === 'officer' ? officerNav : citizenNav);

  return (
    <aside style={{
      width: '260px',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-card)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '1.25rem 0.85rem',
      minHeight: 'calc(100vh - 65px)',
      flexShrink: 0
    }}>
      <div>
        <div style={{ padding: '0 0.5rem 1rem 0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.08em', fontWeight: 700 }}>
            {role.toUpperCase()} WORKSPACE
          </span>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cyber-blue)', marginTop: '0.2rem' }}>
            {role === 'officer' ? `${user?.badge_number || 'CYBER-OFF'} | ${user?.rank || 'Officer'}` : (role === 'admin' ? 'Super Admin Portal' : 'Citizen Services')}
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {currentNav.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '8px',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                  background: isActive ? 'linear-gradient(90deg, rgba(56, 189, 248, 0.15), rgba(6, 182, 212, 0.05))' : 'transparent',
                  color: isActive ? '#38bdf8' : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '3px',
                    borderRadius: '0 4px 4px 0',
                    background: 'var(--cyber-blue)',
                    boxShadow: '0 0 8px var(--cyber-blue)'
                  }} />
                )}
                <Icon size={18} color={isActive ? '#38bdf8' : '#94a3b8'} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Database & Security Architecture Card in Footer */}
      <div style={{
        background: 'rgba(14, 23, 42, 0.8)',
        border: '1px solid rgba(56, 189, 248, 0.15)',
        borderRadius: '10px',
        padding: '0.85rem',
        marginTop: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Database size={15} color="#38bdf8" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f1f5f9' }}>
            MongoDB Engine
          </span>
          <span className="pulse-indicator" style={{ marginLeft: 'auto' }} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Atlas/Server:</span>
            <span style={{ color: '#10b981' }}>Connected</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>GridFS Storage:</span>
            <span style={{ color: '#38bdf8' }}>Active</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Aggregation Core:</span>
            <span style={{ color: '#a855f7' }}>Enabled</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
