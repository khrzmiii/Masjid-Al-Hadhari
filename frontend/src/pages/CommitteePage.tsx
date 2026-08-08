import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft } from 'lucide-react';
import '../components/AboutMosque.css';

import Navbar from '../components/Navbar';

const CommitteePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <Navbar activePage="jawatankuasa" />

      <main className="main-content" style={{ padding: '4rem 2rem', backgroundColor: '#f8fafc', minHeight: '80vh' }}>

        <div className="about-container" style={{ gridTemplateColumns: '1fr', maxWidth: '800px' }}>
          <div className="about-card org-chart-card">
            <div className="section-header">
              <Users className="icon" size={24} color="var(--color-primary)" />
              <h2>Ahli Jawatankuasa Pengurusan Masjid</h2>
            </div>
            <div className="org-chart-content" style={{ marginTop: '2rem', textAlign: 'center' }}>
              <a href="/banner_ajk.jpg" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block' }}>
                <img 
                  src="/banner_ajk.jpg" 
                  alt="Carta Organisasi Jawatankuasa" 
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '12px', cursor: 'zoom-in', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  title="Klik untuk lihat imej penuh"
                />
              </a>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="footer">
        <div className="copyright">
          &copy; {new Date().getFullYear()} Jawatankuasa Pengurusan Masjid Al-Hadhari, Kg. Masolog.
        </div>
      </footer>
    </div>
  );
};

export default CommitteePage;
