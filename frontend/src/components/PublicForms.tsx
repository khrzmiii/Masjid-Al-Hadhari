import React, { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import './PublicForms.css';

const PublicForms: React.FC = () => {
  const [formType, setFormType] = useState('umum');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      const response = await fetch('/api/v1/public/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          form_type: formType,
          submitter_name: formData.name,
          submitter_email: formData.email,
          submitter_phone: formData.phone,
          details: { message: formData.message }
        })
      });
      
      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <section className="public-forms-section" id="hubungi">
      <div className="forms-container">
        <div className="forms-info">
          <h2>Hubungi Kami</h2>
          <p>Ada sebarang pertanyaan, cadangan, atau ingin mendaftar sebagai sukarelawan? Isikan borang di sebelah, kami akan maklum balas dengan segera.</p>
          
          <div className="contact-details">
            <div className="contact-item">
              <strong>Alamat:</strong>
              <p>Masjid Al-Hadhari, Jalan Masjid, 89000</p>
            </div>
            <div className="contact-item">
              <strong>Telefon:</strong>
              <p>03-1234 5678</p>
            </div>
            <div className="contact-item">
              <strong>Emel:</strong>
              <p>admin@alhadhari.com</p>
            </div>
          </div>
        </div>

        <div className="forms-form">
          {status === 'success' ? (
            <div className="form-success">
              <CheckCircle size={48} />
              <h3>Terima Kasih!</h3>
              <p>Borang anda telah berjaya dihantar. Pihak kami akan menghubungi anda tidak lama lagi.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Jenis Pertanyaan</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)}>
                  <option value="umum">Pertanyaan Umum</option>
                  <option value="sukarelawan">Daftar Sukarelawan</option>
                  <option value="aduan">Aduan & Cadangan</option>
                  <option value="tempahan">Tempahan Fasiliti</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nama Penuh</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Masukkan nama anda" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nombor Telefon</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="01X-XXXXXXX" />
                </div>
                <div className="form-group">
                  <label>Emel (Pilihan)</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="emel@anda.com" />
                </div>
              </div>

              <div className="form-group">
                <label>Mesej / Butiran</label>
                <textarea name="message" value={formData.message} onChange={handleChange} required rows={4} placeholder="Sila nyatakan pertanyaan atau butiran anda di sini..."></textarea>
              </div>

              <button type="submit" className="submit-btn" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Menghantar...' : (
                  <>
                    Hantar Borang <Send size={18} />
                  </>
                )}
              </button>
              
              {status === 'error' && (
                <p className="form-error">Ralat berlaku. Sila cuba lagi sebentar nanti.</p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default PublicForms;
