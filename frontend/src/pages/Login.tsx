import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowLeft, KeyRound, CheckCircle, AlertCircle, X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetTokenParam = searchParams.get('resetToken');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [wrongPasswordCount, setWrongPasswordCount] = useState(0);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [forgotLoading, setForgotLoading] = useState(false);

  // Reset password form state (when resetToken is in URL)
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (resetTokenParam) {
      // Focus on reset password flow
    }
  }, [resetTokenParam]);

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
        
        // If profile is incomplete (no phone or avatar), prompt user
        if (!data.user.phone_number || !data.user.avatar_url) {
          sessionStorage.setItem('showProfilePrompt', 'true');
        }
        
        navigate('/');
      } else {
        const errorMsg = data.error || 'Gagal log masuk. Sila semak kelayakan anda.';
        setError(errorMsg);
        
        if (response.status === 403) {
          setShowResend(true);
        } else {
          setShowResend(false);
        }

        // Detect if password was wrong on first or subsequent attempts
        if (response.status === 401 || errorMsg.toLowerCase().includes('kata laluan')) {
          setWrongPasswordCount(prev => prev + 1);
        }
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
        
        // If profile is incomplete, prompt user
        if (!data.user.phone_number || !data.user.avatar_url) {
          sessionStorage.setItem('showProfilePrompt', 'true');
        }

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

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus({ type: '', text: '' });
    setForgotLoading(true);

    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setForgotStatus({ 
          type: 'success', 
          text: data.message || 'Pautan tetapan semula kata laluan telah dihantar ke emel anda.' 
        });
      } else {
        setForgotStatus({ 
          type: 'error', 
          text: data.error || 'Gagal menghantar pautan tetapan semula.' 
        });
      }
    } catch (err) {
      setForgotStatus({ type: 'error', text: 'Ralat pelayan. Sila cuba lagi.' });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage({ type: '', text: '' });

    if (newPassword !== confirmNewPassword) {
      setResetMessage({ type: 'error', text: 'Kata laluan baharu dan pengesahan tidak sepadan.' });
      return;
    }

    if (newPassword.length < 6) {
      setResetMessage({ type: 'error', text: 'Kata laluan mesti sekurang-kurangnya 6 aksara.' });
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetTokenParam,
          newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResetMessage({ type: 'success', text: data.message || 'Kata laluan berjaya dikemaskini!' });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setResetMessage({ type: 'error', text: data.error || 'Gagal menetapkan kata laluan baharu.' });
      }
    } catch (err) {
      setResetMessage({ type: 'error', text: 'Ralat pelayan. Sila cuba lagi.' });
    } finally {
      setResetLoading(false);
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
          <h2>{resetTokenParam ? 'Kata Laluan Baharu' : 'Log Masuk'}</h2>
          <p>Sistem Pengurusan Masjid Al-Hadhari</p>
        </div>

        {/* View 1: Reset Password View (if ?resetToken= is present) */}
        {resetTokenParam ? (
          <form onSubmit={handleResetPasswordSubmit} className="login-form">
            {resetMessage.text && (
              <div className={`login-error`} style={{
                backgroundColor: resetMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: resetMessage.type === 'success' ? '#166534' : '#991b1b',
                border: `1px solid ${resetMessage.type === 'success' ? '#86efac' : '#fca5a5'}`
              }}>
                {resetMessage.text}
              </div>
            )}

            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.25rem', textAlign: 'center' }}>
              Sila masukkan kata laluan baharu anda di bawah:
            </p>

            <div className="form-group">
              <label>Kata Laluan Baharu</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  placeholder="Sekurang-kurangnya 6 aksara"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Sahkan Kata Laluan Baharu</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  value={confirmNewPassword} 
                  onChange={(e) => setConfirmNewPassword(e.target.value)} 
                  required 
                  placeholder="Ulang kata laluan baharu"
                />
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={resetLoading}>
              {resetLoading ? 'Menyimpan...' : 'Simpan Kata Laluan Baharu'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} style={{ color: 'var(--color-primary)', fontWeight: '600' }}>
                Kembali ke Halaman Log Masuk
              </a>
            </p>
          </form>
        ) : (
          /* View 2: Regular Login Form */
          <form onSubmit={handleLogin} className="login-form">
            {error && (
              <div className="login-error">
                <div>{error}</div>
                {wrongPasswordCount > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    Terlupa kata laluan?{' '}
                    <button
                      type="button"
                      onClick={() => { setForgotEmail(email); setShowForgotModal(true); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#b91c1c',
                        textDecoration: 'underline',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Klik di sini untuk set semula
                    </button>
                  </div>
                )}
              </div>
            )}

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
                  placeholder="nama@contoh.com"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ margin: 0 }}>Kata Laluan</label>
                <button 
                  type="button"
                  onClick={() => { setForgotEmail(email); setShowForgotModal(true); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: wrongPasswordCount > 0 ? '#dc2626' : 'var(--color-primary)',
                    fontSize: '0.85rem',
                    fontWeight: wrongPasswordCount > 0 ? '700' : '500',
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline'
                  }}
                >
                  Lupa kata laluan?
                </button>
              </div>
              <div className="input-with-icon" style={{ marginTop: '0.5rem' }}>
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

            <button type="submit" className="login-btn" disabled={loading} style={{ marginTop: '1rem' }}>
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
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => { setShowForgotModal(false); setForgotStatus({ type: '', text: '' }); }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <KeyRound size={28} />
              </div>
              <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontSize: '1.3rem' }}>
                Lupa Kata Laluan?
              </h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Masukkan alamat emel akaun anda. Kami akan menghantar pautan pengesahan untuk menetapkan kata laluan baharu.
              </p>
            </div>

            {forgotStatus.text && (
              <div style={{
                padding: '0.85rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.9rem',
                backgroundColor: forgotStatus.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: forgotStatus.type === 'success' ? '#166534' : '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {forgotStatus.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                <span>{forgotStatus.text}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#334155' }}>Alamat Emel</label>
                <div className="input-with-icon" style={{ marginTop: '0.4rem' }}>
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="nama@contoh.com"
                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = '#047857')}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = '#059669')}
              >
                {forgotLoading ? 'Menghantar...' : 'Hantar Pautan Pemulihan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
