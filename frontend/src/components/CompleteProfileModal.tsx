import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, Sparkles, X, ArrowRight, ShieldCheck } from 'lucide-react';

const CompleteProfileModal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Don't show if already on profile page
    if (location.pathname === '/profil' || location.pathname === '/login' || location.pathname === '/register') {
      return;
    }

    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');
    const shouldPrompt = sessionStorage.getItem('showProfilePrompt') === 'true';

    if (token && userStr && shouldPrompt) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || 'Jemaah');
        // Only prompt if phone_number or avatar_url is missing
        if (!user.phone_number || !user.avatar_url) {
          setIsOpen(true);
        } else {
          // Profile is already complete
          sessionStorage.removeItem('showProfilePrompt');
        }
      } catch (e) {
        // ignore
      }
    }
  }, [location.pathname]);

  const handleDismiss = () => {
    sessionStorage.removeItem('showProfilePrompt');
    setIsOpen(false);
  };

  const handleGoToProfile = () => {
    sessionStorage.removeItem('showProfilePrompt');
    setIsOpen(false);
    navigate('/profil');
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
      animation: 'fadeIn 0.25s ease-out'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid #e2e8f0'
      }}>
        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)',
          padding: '2rem 1.5rem 1.5rem',
          textAlign: 'center',
          color: 'white',
          position: 'relative'
        }}>
          <button 
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>

          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            border: '2px solid rgba(255, 255, 255, 0.4)'
          }}>
            <Sparkles size={32} color="#fef08a" />
          </div>

          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: '700' }}>
            Lengkapkan Profil Anda
          </h2>
          <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
            Selamat kembali, <strong>{userName}</strong>!
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem 1.5rem' }}>
          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 1.25rem' }}>
            Untuk memudahkan urusan penyertaan aktiviti masjid, pengesahan kehadiran serta pengeluaran <strong>e-Sijil rasmi</strong>, sila lengkapkan maklumat profil anda:
          </p>

          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#334155', fontSize: '0.9rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }}></div>
              <span>Muat naik <strong>Gambar Profil (Avatar)</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#334155', fontSize: '0.9rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }}></div>
              <span>Masukkan <strong>Nombor Telefon</strong> terkini</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#334155', fontSize: '0.9rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }}></div>
              <span>Akses modul <strong>Aktiviti Disertai & E-Sijil</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={handleGoToProfile}
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = '#047857')}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = '#059669')}
            >
              <span>Lengkapkan Profil Sekarang</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={handleDismiss}
              style={{
                width: '100%',
                padding: '0.7rem',
                backgroundColor: 'transparent',
                color: '#64748b',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '500',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Nanti Sahaja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfileModal;
