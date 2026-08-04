import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        navigate('/');
      } else {
        setError(data.error || 'Gagal log masuk. Sila semak kelayakan anda.');
        if (response.status === 403) setShowResend(true);
        else setShowResend(false);
      }
    } catch (err) {
      setError('Ralat pelayan. Sila cuba lagi sebentar nanti.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/v1/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        navigate('/');
      } else {
        setError(data.error || 'Log masuk Google gagal.');
      }
    } catch (err) {
      setError('Ralat pelayan Google. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Log masuk Google gagal.');
  };

  const handleResendVerification = async () => {
    if (!email) { setResendStatus('Sila masukkan emel anda dahulu.'); return; }
    setResendStatus('Menghantar...');
    try {
      const response = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      setResendStatus(data.message || data.error || 'Ralat berlaku.');
    } catch (err) {
      setResendStatus('Ralat pelayan. Sila cuba lagi.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Kembali ke Portal
        </button>
        
        <div className="login-header">
          <div className="login-logo" style={{ backgroundImage: "url('/logo.png')", borderRadius: '50%' }}></div>
          <h2>Log Masuk</h2>
          <p>Sistem Pengurusan Masjid Al-Hadhari</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="login-error">{error}</div>}
          {showResend && (
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
              <button type="button" onClick={handleResendVerification}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.875rem', textDecoration: 'underline' }}>
                Hantar Semula E-mel Pengesahan
              </button>
              {resendStatus && <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>{resendStatus}</p>}
            </div>
          )}
          
          <div className="form-group">
            <label>Alamat Emel</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="admin@alhadhari.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Kata Laluan</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="********"
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Sila Tunggu...' : 'Log Masuk'}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
            <span style={{ padding: '0 1rem', color: '#64748b', fontSize: '0.875rem' }}>atau</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin_with"
              shape="rectangular"
              theme="outline"
              size="large"
            />
          </div>
          
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
            Belum mempunyai akaun? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }} style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Daftar Sekarang</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
