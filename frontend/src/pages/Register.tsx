import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, ArrowLeft, CheckCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import './Login.css'; // Reusing login styles for consistency

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Pendaftaran gagal. Sila cuba lagi.');
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
        setError(data.error || 'Pendaftaran Google gagal.');
      }
    } catch (err) {
      setError('Ralat pelayan Google. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Pendaftaran Google gagal.');
  };

  return (
    <div className="login-page">
      {success && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2.5rem',
            borderRadius: '12px',
            textAlign: 'center',
            maxWidth: '400px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            <CheckCircle size={48} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>Pendaftaran Berjaya!</h2>
            <p style={{ color: '#4b5563', marginBottom: '2rem', lineHeight: '1.5' }}>
              Akaun anda telah didaftarkan. Sila semak peti masuk e-mel anda untuk pautan pengesahan sebelum log masuk.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setSuccess(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Tutup
              </button>
              <button 
                onClick={() => navigate('/login')}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--color-primary)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Log Masuk Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="login-container">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Kembali
        </button>
        
        <div className="login-header">
          <div className="login-logo" style={{ backgroundImage: "url('/logo.png')", borderRadius: '50%' }}></div>
          <h2>Daftar Akaun</h2>
          <p>Sistem Pengurusan Masjid Al-Hadhari</p>
        </div>

        <form onSubmit={handleRegister} className="login-form">
          {error && <div className="login-error">{error}</div>}
          
          <div className="form-group">
            <label>Nama Penuh</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="Ali bin Abu"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Alamat Emel</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="ali@example.com"
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

          <button type="submit" className="login-btn" disabled={loading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            {loading ? 'Sila Tunggu...' : <><UserPlus size={18} /> Daftar Sekarang</>}
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
              text="signup_with"
              shape="rectangular"
              theme="outline"
              size="large"
            />
          </div>
          
          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
            Sudah mempunyai akaun? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Log Masuk</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
