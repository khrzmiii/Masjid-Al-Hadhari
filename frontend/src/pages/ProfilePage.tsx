import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import '../App.css';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('adminUser');
    const token = localStorage.getItem('adminToken');
    
    if (!userStr || !token) {
      navigate('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      setName(parsedUser.name || '');
    } catch (e) {
      navigate('/login');
    }
  }, [navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/v1/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Profil berjaya dikemaskini.' });
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        setUser(data.user);
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal kemaskini profil.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Ralat pelayan. Sila cuba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="app-container" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Navbar activePage="utama" />

      <main style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <User size={28} color="var(--color-primary)" />
            Profil Pengguna
          </h1>
        </div>

        <div className="card" style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          {message.text && (
            <div style={{ 
              padding: '1rem', 
              marginBottom: '1.5rem', 
              borderRadius: '8px',
              backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: message.type === 'success' ? '#166534' : '#991b1b',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}>
              <AlertCircle size={20} />
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155' }}>
                Nama Penuh
              </label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                style={{ 
                  width: '100%', padding: '0.75rem', borderRadius: '8px', 
                  border: '1px solid #cbd5e1', fontSize: '1rem' 
                }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155' }}>
                Peranan / Status Akaun
              </label>
              <div style={{ 
                padding: '0.75rem', backgroundColor: '#f1f5f9', 
                borderRadius: '8px', color: '#475569', textTransform: 'capitalize',
                fontWeight: '600'
              }}>
                {user.role.replace('_', ' ')}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                Peranan akaun anda menentukan tahap akses ke dalam sistem.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                disabled={loading || name === user.name}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
              >
                <Save size={18} />
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
