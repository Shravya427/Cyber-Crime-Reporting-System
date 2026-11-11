import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, Lock, Mail, User, Phone, MapPin, 
  CreditCard, ArrowRight, ShieldCheck, UserCheck, KeyRound 
} from 'lucide-react';

export default function LoginPage() {
  const { login, register, quickDemoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form state
  const [regData, setRegData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    id_proof_type: 'Aadhaar',
    id_proof_number: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regData.full_name || !regData.email || !regData.password) {
      setError("Name, email, and password are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register({ ...regData, role: 'citizen' });
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role) => {
    setLoading(true);
    setError(null);
    try {
      await quickDemoLogin(role);
    } catch (err) {
      setError(err.message || "Demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative'
    }}>
      {/* Background Decorative Grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: isRegister ? '560px' : '460px',
        background: 'rgba(14, 23, 42, 0.88)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-card)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 35px rgba(56, 189, 248, 0.12)',
        position: 'relative',
        zIndex: 1,
        transition: 'all 0.3s ease'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(6, 182, 212, 0.4))',
            border: '1px solid var(--cyber-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.35)'
          }}>
            <Shield size={30} color="#38bdf8" />
          </div>

          <h1 style={{ fontSize: '1.4rem', letterSpacing: '0.02em', margin: '0 0 0.35rem 0' }}>
            CYBERSHIELD <span style={{ color: 'var(--cyber-blue)' }}>PORTAL</span>
          </h1>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
            Advanced Cyber Crime Reporting & Investigation Management System
          </p>
        </div>

        {/* 1-Click Demo Quick Logins for Evaluator */}
        <div style={{
          background: 'rgba(11, 17, 32, 0.8)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '10px',
          padding: '0.85rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cyber-blue)', letterSpacing: '0.05em', marginBottom: '0.5rem', textAlign: 'center' }}>
            ⚡ 1-Click Demo Access for Evaluation:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleDemo('citizen')}
              disabled={loading}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.45rem 0.25rem' }}
            >
              🛡️ Citizen
            </button>
            <button
              type="button"
              onClick={() => handleDemo('officer')}
              disabled={loading}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.45rem 0.25rem' }}
            >
              🔍 Officer
            </button>
            <button
              type="button"
              onClick={() => handleDemo('admin')}
              disabled={loading}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.45rem 0.25rem' }}
            >
              ⚡ Admin
            </button>
          </div>
        </div>

        {/* Tabs: Login vs Register */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '1.5rem'
        }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            style={{
              flex: 1,
              padding: '0.65rem',
              background: 'none',
              border: 'none',
              borderBottom: !isRegister ? '2px solid var(--cyber-blue)' : '2px solid transparent',
              color: !isRegister ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Secure Login
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            style={{
              flex: 1,
              padding: '0.65rem',
              background: 'none',
              border: 'none',
              borderBottom: isRegister ? '2px solid var(--cyber-blue)' : '2px solid transparent',
              color: isRegister ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Citizen Registration
          </button>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '0.825rem',
            marginBottom: '1.25rem'
          }}>
            ⚠ {error}
          </div>
        )}

        {!isRegister ? (
          /* LOGIN FORM */
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="Enter your legal full name"
                  value={regData.full_name}
                  onChange={(e) => setRegData({ ...regData, full_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="user@gmail.com"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Mobile Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+91 XXXXX XXXXX"
                  value={regData.phone}
                  onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">ID Proof Type</label>
                <select
                  className="form-control"
                  value={regData.id_proof_type}
                  onChange={(e) => setRegData({ ...regData, id_proof_type: e.target.value })}
                >
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">ID Proof Document Number</label>
              <input
                type="text"
                className="form-control font-mono"
                placeholder="e.g. XXXX-XXXX-1234 or ABCDE1234F"
                value={regData.id_proof_number}
                onChange={(e) => setRegData({ ...regData, id_proof_number: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Residential Address</label>
              <input
                type="text"
                className="form-control"
                placeholder="City, State, Postal code"
                value={regData.address}
                onChange={(e) => setRegData({ ...regData, address: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
            >
              {loading ? 'Registering...' : 'Register Citizen Account'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          Encrypted with Bcrypt & Signed with JWT • MongoDB GridFS Protected
        </div>
      </div>
    </div>
  );
}
