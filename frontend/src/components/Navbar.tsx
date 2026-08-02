import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';

interface NavbarProps {
  activePage: 'utama' | 'sejarah' | 'jawatankuasa' | 'aktiviti' | 'hubungi';
}

const Navbar: React.FC<NavbarProps> = ({ activePage }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  let user = null;
  const userStr = localStorage.getItem('adminUser');
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch (e) {}
  }
  const token = localStorage.getItem('adminToken');
  const isLoggedIn = !!(user && token);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/');
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="brand">
        <div className="brand-logo" style={{ backgroundImage: "url('/logo.png')", backgroundSize: 'cover', borderRadius: '50%' }}></div>
        <div className="brand-text">Masjid Al-Hadhari</div>
      </div>

      <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`nav-content ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="nav-links">
          <a href="#" className={activePage === 'utama' ? 'active' : ''} onClick={(e) => { e.preventDefault(); navigate('/'); setIsMobileMenuOpen(false); }}>Laman Utama</a>
          <a href="#" className={activePage === 'sejarah' ? 'active' : ''} onClick={(e) => { e.preventDefault(); navigate('/sejarah'); setIsMobileMenuOpen(false); }}>Sejarah Masjid</a>
          <a href="#" className={activePage === 'jawatankuasa' ? 'active' : ''} onClick={(e) => { e.preventDefault(); navigate('/jawatankuasa'); setIsMobileMenuOpen(false); }}>Ahli Jawatankuasa</a>
          <a href="#" className={activePage === 'aktiviti' ? 'active' : ''} onClick={(e) => { e.preventDefault(); navigate('/aktiviti'); setIsMobileMenuOpen(false); }}>Aktiviti</a>
          <a href="#hubungi" className={activePage === 'hubungi' ? 'active' : ''} onClick={(e) => { 
            e.preventDefault(); 
            setIsMobileMenuOpen(false);
            if (window.location.pathname !== '/') {
              navigate('/#hubungi');
            } else {
              document.getElementById('hubungi')?.scrollIntoView({ behavior: 'smooth' }); 
            }
          }}>Hubungi Kami</a>
        </div>
        
        <div className="nav-actions">
          {!isLoggedIn ? (
            <>
              <button className="btn btn-outline" onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}>Log Masuk</button>
              <button className="btn btn-primary" onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }}>Daftar</button>
            </>
          ) : (
            <>
              {user.role !== 'public' && user.role !== 'pending' && (
                <button 
                  onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}
                  className="nav-admin-btn"
                >
                  <LayoutDashboard size={16} /> Panel Admin
                </button>
              )}
              
              <button 
                onClick={() => { navigate('/profil'); setIsMobileMenuOpen(false); }}
                className="nav-user-info"
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontWeight: '500', padding: '0.5rem' }}
              >
                <User size={18} />
                <span>{user.name || 'Pengguna'}</span>
              </button>
              
              <button 
                onClick={handleLogout}
                className="nav-logout-btn"
              >
                <LogOut size={16} /> Log Keluar
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
