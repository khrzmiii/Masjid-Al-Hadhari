import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, XCircle, Loader } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token pengesahan tidak dijumpai.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/v1/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Pengesahan gagal.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Ralat pelayan.');
      }
    };

    verifyToken();
  }, [token, navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
      <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        {status === 'loading' && (
          <>
            <Loader size={48} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#0f172a' }}>Mengesahkan E-mel...</h2>
            <p style={{ color: '#64748b' }}>Sila tunggu sebentar.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <ShieldCheck size={48} color="#10b981" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#0f172a' }}>Pengesahan Berjaya!</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{message}</p>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Anda akan dibawa ke halaman log masuk...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#0f172a' }}>Pengesahan Gagal</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{message}</p>
            <button onClick={() => navigate('/login')} className="btn-primary" style={{ width: '100%' }}>
              Kembali ke Log Masuk
            </button>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VerifyEmail;
