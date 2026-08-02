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
            <div className="org-chart-content" style={{ marginTop: '2rem' }}>
              <div className="org-level">
                <div className="org-node leader">
                  <div className="role">Pengerusi</div>
                  <div className="name">Ustaz Ahmad Bin Abdullah</div>
                </div>
              </div>
              
              <div className="org-connector"></div>
              
              <div className="org-level">
                <div className="org-node">
                  <div className="role">Timbalan Pengerusi</div>
                  <div className="name">Haji Mohd Ali</div>
                </div>
              </div>

              <div className="org-connector"></div>

              <div className="org-level split-level" style={{ flexWrap: 'wrap' }}>
                <div className="org-node">
                  <div className="role">Setiausaha</div>
                  <div className="name">En. Syahril</div>
                </div>
                <div className="org-node">
                  <div className="role">Bendahari</div>
                  <div className="name">En. Rahman</div>
                </div>
                <div className="org-node">
                  <div className="role">AJK Peralatan & Logistik</div>
                  <div className="name">En. Ismail</div>
                </div>
              </div>
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
