import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ArrowLeft, Image as ImageIcon, MapPin, Users, Building } from 'lucide-react';
import Navbar from '../components/Navbar';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <Navbar activePage="sejarah" />

      <main className="main-content" style={{ padding: '3rem 1rem', backgroundColor: '#f8fafc', minHeight: '80vh' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '4rem', padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ backgroundColor: '#e0f2fe', padding: '1rem', borderRadius: '50%' }}>
              <History size={40} color="#0284c7" />
            </div>
          </div>
          <h1 style={{ fontSize: '2.5rem', color: '#0f172a', marginBottom: '1rem' }}>Menelusuri Sejarah Masjid Al-Hadhari</h1>
          <p style={{ color: '#64748b', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
            Dari sebuah struktur kayu asas yang dibina secara gotong-royong, kini berkembang megah sebagai pusat komuniti kebanggaan penduduk Kg. Masolog, Kota Marudu.
          </p>
        </div>

        {/* Timeline Container */}
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
          {/* Vertical Line */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '100%', backgroundColor: '#e2e8f0', zIndex: 0, display: window.innerWidth > 768 ? 'block' : 'none' }}></div>

          {/* Fasa 1: Pembinaan Awal */}
          <div style={{ display: 'flex', flexDirection: window.innerWidth > 768 ? 'row' : 'column', alignItems: 'center', marginBottom: '4rem', position: 'relative', zIndex: 1 }}>
            <div style={{ flex: 1, padding: '1rem', textAlign: window.innerWidth > 768 ? 'right' : 'left' }}>
              <span style={{ display: 'inline-block', backgroundColor: '#fef3c7', color: '#d97706', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Fasa Awal</span>
              <h2 style={{ color: '#1e293b', marginBottom: '1rem' }}>Titik Permulaan</h2>
              <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '1rem' }}>
                Pada asalnya, pembinaan masjid ini bermula dengan sebuah struktur yang sederhana hasil keringat dan muafakat penduduk kampung. Dibina secara gotong-royong, masjid pertama ini menggunakan kayu dan bahan binaan asas, namun sarat dengan keikhlasan jemaah awal Kg. Masolog.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                <Users size={16} /> <span>Gotong-royong masyarakat setempat</span>
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#0ea5e9', borderRadius: '50%', border: '4px solid white', margin: window.innerWidth > 768 ? '0 2rem' : '1rem 0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', flexShrink: 0 }}></div>
            <div style={{ flex: 1, padding: '1rem', width: '100%' }}>
              <div style={{ backgroundColor: '#e2e8f0', height: '250px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #94a3b8', color: '#64748b' }}>
                <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <span style={{ fontWeight: '500' }}>[Ruang Gambar Masjid Lama]</span>
                <span style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Gambar akan dimuat naik kelak</span>
              </div>
            </div>
          </div>

          {/* Fasa 2: Bangunan Baru */}
          <div style={{ display: 'flex', flexDirection: window.innerWidth > 768 ? 'row-reverse' : 'column', alignItems: 'center', marginBottom: '4rem', position: 'relative', zIndex: 1 }}>
            <div style={{ flex: 1, padding: '1rem', textAlign: 'left' }}>
              <span style={{ display: 'inline-block', backgroundColor: '#e0e7ff', color: '#4f46e5', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Era Transformasi</span>
              <h2 style={{ color: '#1e293b', marginBottom: '1rem' }}>Pembinaan Bangunan Baharu</h2>
              <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '1rem' }}>
                Seiring dengan pertambahan populasi penduduk dan jemaah, keperluan untuk ruang ibadah yang lebih besar dan selesa menjadi keutamaan. Struktur lama telah digantikan dengan sebuah bangunan masjid konkrit yang serba baharu, lengkap dengan pelbagai kemudahan moden untuk keselesaan semua.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                <Building size={16} /> <span>Peralihan kepada struktur konkrit</span>
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#4f46e5', borderRadius: '50%', border: '4px solid white', margin: window.innerWidth > 768 ? '0 2rem' : '1rem 0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', flexShrink: 0 }}></div>
            <div style={{ flex: 1, padding: '1rem', width: '100%' }}>
              <div style={{ backgroundColor: '#e2e8f0', height: '250px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #94a3b8', color: '#64748b' }}>
                <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <span style={{ fontWeight: '500' }}>[Ruang Gambar Bangunan Baharu]</span>
                <span style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Gambar akan dimuat naik kelak</span>
              </div>
            </div>
          </div>

          {/* Fasa 3: Masa Kini */}
          <div style={{ display: 'flex', flexDirection: window.innerWidth > 768 ? 'row' : 'column', alignItems: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
            <div style={{ flex: 1, padding: '1rem', textAlign: window.innerWidth > 768 ? 'right' : 'left' }}>
              <span style={{ display: 'inline-block', backgroundColor: '#dcfce7', color: '#16a34a', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Kini</span>
              <h2 style={{ color: '#1e293b', marginBottom: '1rem' }}>Masjid Al-Hadhari Hari Ini</h2>
              <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '1rem' }}>
                Kini, Masjid Al-Hadhari bukan sahaja berfungsi sebagai pusat ibadah utama untuk menunaikan solat lima waktu dan solat Jumaat, tetapi turut memainkan peranan penting sebagai nadi pembangunan ummah, pusat ilmu, dan penganjuran pelbagai aktiviti kemasyarakatan yang mengeratkan ukhuwah penduduk Kg. Masolog.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                <MapPin size={16} /> <span>Pusat Komuniti Kg. Masolog</span>
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#10b981', borderRadius: '50%', border: '4px solid white', margin: window.innerWidth > 768 ? '0 2rem' : '1rem 0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', flexShrink: 0 }}></div>
            <div style={{ flex: 1, padding: '1rem', width: '100%' }}>
              <div style={{ backgroundColor: '#e2e8f0', height: '250px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #94a3b8', color: '#64748b' }}>
                <ImageIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <span style={{ fontWeight: '500' }}>[Ruang Gambar Terkini Masjid]</span>
                <span style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Gambar akan dimuat naik kelak</span>
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

export default HistoryPage;
