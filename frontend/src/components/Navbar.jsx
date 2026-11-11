import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../api/client';
import { 
  Shield, Bell, LogOut, CheckCheck, Clock, AlertCircle, 
  UserCheck, ShieldAlert, FileText, ChevronDown 
} from 'lucide-react';

export default function Navbar({ onOpenNewComplaint }) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoadingNotifs(true);
      const res = await notificationsAPI.list();
      const list = res.data || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000); // Polling every 25s
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="badge badge-priority-critical"><ShieldAlert size={12} /> System Administrator</span>;
      case 'officer':
        return <span className="badge badge-assigned"><UserCheck size={12} /> Investigation Officer</span>;
      default:
        return <span className="badge badge-submitted"><FileText size={12} /> Registered Citizen</span>;
    }
  };

  return (
    <header style={{
      background: 'rgba(11, 17, 32, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-card)',
      padding: '0.75rem 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(6, 182, 212, 0.4))',
          border: '1px solid var(--cyber-blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(56, 189, 248, 0.25)'
        }}>
          <Shield size={22} color="#38bdf8" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.1rem', letterSpacing: '0.02em', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              CYBER<span style={{ color: 'var(--cyber-blue)' }}>SHIELD</span>
            </h1>
            <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
              DBMS CORE
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            Centralized Cybercrime Reporting & Investigation Portal
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user?.role === 'citizen' && onOpenNewComplaint && (
          <button 
            className="btn btn-primary" 
            onClick={onOpenNewComplaint}
            style={{ fontSize: '0.825rem', padding: '0.5rem 1rem' }}
          >
            <ShieldAlert size={16} /> Lodge Complaint
          </button>
        )}

        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            style={{
              background: 'rgba(30, 41, 59, 0.6)',
              border: '1px solid var(--border-subtle)',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'all 0.2s'
            }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                borderRadius: '9999px',
                minWidth: '17px',
                height: '17px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: '360px',
              maxHeight: '440px',
              overflowY: 'auto',
              background: 'var(--bg-modal)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 15px 35px -5px rgba(0,0,0,0.8), 0 0 20px rgba(56,189,248,0.15)',
              zIndex: 110,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.95)'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>
                  Notifications ({unreadCount} new)
                </span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    style={{ background: 'none', border: 'none', color: 'var(--cyber-blue)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div style={{ overflowY: 'auto', maxHeight: '350px' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n._id}
                      onClick={(e) => !n.is_read && handleMarkAsRead(n._id, e)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: n.is_read ? 'transparent' : 'rgba(56, 189, 248, 0.06)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        display: 'flex',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ marginTop: '3px' }}>
                        <AlertCircle size={15} color={n.is_read ? '#64748b' : '#38bdf8'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: n.is_read ? '#cbd5e1' : '#fff' }}>
                          {n.title}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>
                          {n.message}
                        </p>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Clock size={11} /> {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border-subtle)' }}>
          <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
              {user?.full_name}
            </div>
            <div>
              {getRoleBadge(user?.role)}
            </div>
          </div>

          <button
            onClick={logout}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '0.5rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
