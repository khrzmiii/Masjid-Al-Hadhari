import React from 'react';
import { Heart, CreditCard, Download } from 'lucide-react';
import './DonationQR.css';

const DonationQR: React.FC = () => {

  return (
    <div className="donation-widget card">
      <div className="donation-header">
        <Heart className="icon" size={24} color="var(--color-accent)" />
        <h2>Salurkan Sumbangan</h2>
      </div>
      
      <p className="donation-subtitle">
        Imbas kod QR di bawah menggunakan aplikasi perbankan anda (DuitNow QR).
      </p>

      <div className="donation-content" style={{ flexDirection: 'column', alignItems: 'center' }}>
        <div className="qr-container" style={{ width: '100%', maxWidth: '400px', marginBottom: '1.5rem' }}>
          <img 
            src="/qr-poster.jpg" 
            alt="QR Code Masjid" 
            style={{ width: '100%', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
          />
        </div>
        
        <div className="donation-info" style={{ width: '100%' }}>
          <div className="info-alert">
            <CreditCard size={18} />
            <span>
              Transaksi ini diproses sepenuhnya melalui aplikasi perbankan anda. 
              Sila pastikan nama penerima adalah <strong>Masjid Al-Hadhari</strong>.
            </span>
          </div>
          <a href="/qr-poster.jpg" download className="btn btn-outline full-width" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textDecoration: 'none' }}>
            Muat Turun Poster QR <Download size={16} style={{ marginLeft: '0.5rem' }} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default DonationQR;
