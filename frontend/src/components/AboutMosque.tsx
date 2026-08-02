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
          <div className="org-chart-content">
            {/* Simple CSS-based Org Chart layout */}
            <div className="org-level">
              <div className="org-node leader">
                <div className="role">Pengerusi</div>
                <div className="name">Ustaz Ahmad Bin Abdullah</div>
              </div>
            </div>
            
            <div className="org-level">
              <div className="org-node">
                <div className="role">Timbalan Pengerusi</div>
                <div className="name">Haji Mohd Ali</div>
              </div>
            </div>

            <div className="org-connector"></div>

            <div className="org-level split-level">
              <div className="org-node">
                <div className="role">Setiausaha</div>
                <div className="name">En. Syahril</div>
              </div>
              <div className="org-node">
                <div className="role">Bendahari</div>
                <div className="name">En. Rahman</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutMosque;
