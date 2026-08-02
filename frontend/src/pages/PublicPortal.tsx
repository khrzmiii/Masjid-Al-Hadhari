import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import Announcements from '../components/Announcements';
import LocationMap from '../components/LocationMap';
import PrayerTimes from '../components/PrayerTimes';
import DonationQR from '../components/DonationQR';
import ActivitySlider from '../components/ActivitySlider';

import Navbar from '../components/Navbar';

const PublicPortal: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      {/* Emergency / Important Ticker */}
      <Announcements />

      <Navbar activePage="utama" />

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-content">
          <h1>Solat & Ukhwah Memajukan Ummah</h1>
          <p>
            Selamat datang ke portal rasmi Masjid Al-Hadhari, Kg. Masolog. 
            Portal rasmi untuk rujukan setempat jadual waktu solat, program keagamaan, 
            dan maklumat terkini aktiviti masjid.
          </p>
          <div className="hero-buttons">
            <button onClick={() => navigate('/aktiviti')} className="btn btn-accent">Lihat Aktiviti Terkini</button>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="main-content" style={{ padding: '2rem 1rem', backgroundColor: '#FDFBF7' }}>
        
        {/* Waktu Solat Horizontal Bar */}
        <div style={{ maxWidth: '1200px', margin: '0 auto 3rem' }}>
          <PrayerTimes />
        </div>

        {/* Activities and Donation Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem', maxWidth: '1200px', margin: '0 auto 4rem' }}>
          <ActivitySlider />
          <DonationQR />
        </div>

        {/* Location Map */}
        <LocationMap />
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-logo">Masjid Al-Hadhari</div>
        <div className="footer-links">
          <a href="#">Privasi</a>
          <a href="#">Terma & Syarat</a>
          <a href="#">Bantuan</a>
        </div>
        <div className="copyright">
          &copy; {new Date().getFullYear()} Jawatankuasa Pengurusan Masjid Al-Hadhari, Kg. Masolog. Hak Cipta Terpelihara.
        </div>
      </footer>
    </div>
  );
};

export default PublicPortal;
