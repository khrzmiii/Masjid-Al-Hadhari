import React from 'react';
import { History, Users } from 'lucide-react';
import './AboutMosque.css';

const AboutMosque: React.FC = () => {
  return (
    <section className="about-section" id="jawatankuasa">
      <div className="about-container">
        <div className="about-card history-card">
          <div className="section-header">
            <History className="icon" size={24} color="var(--color-primary)" />
            <h2>Sejarah Masjid</h2>
          </div>
          <div className="history-content">
            <p>
              Masjid Al-Hadhari, yang terletak di Kg. Masolog, Kota Marudu, Sabah, merupakan nadi keagamaan dan kemasyarakatan bagi penduduk setempat. Ia mula dibina hasil daripada muafakat dan semangat gotong-royong masyarakat kampung yang mendambakan sebuah pusat ibadah yang selesa.
            </p>
            <p>
              Seiring dengan peredaran masa, masjid ini telah mengalami beberapa fasa penambahbaikan untuk menampung jemaah yang semakin bertambah. Kini, ia bukan sahaja berfungsi sebagai tempat menunaikan solat lima waktu dan solat Jumaat, tetapi juga sebagai pusat ilmu, kebajikan, dan pembangunan ummah.
            </p>
          </div>
        </div>

        <div className="about-card org-chart-card">
          <div className="section-header">
            <Users className="icon" size={24} color="var(--color-primary)" />
            <h2>Ahli Jawatankuasa</h2>
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
    </section>
  );
};

export default AboutMosque;
