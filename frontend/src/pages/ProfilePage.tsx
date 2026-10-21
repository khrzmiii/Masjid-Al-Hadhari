import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, ArrowLeft, Save, AlertCircle, CheckCircle, Camera, Phone, Mail, 
  Shield, KeyRound, Calendar as CalendarIcon, Award, Download, Eye, X, 
  MapPin, Clock, ExternalLink 
} from 'lucide-react';
import jsPDF from 'jspdf';
import Navbar from '../components/Navbar';
import '../App.css';

interface UserEvent {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  event_date: string;
  venue?: string;
  status?: string;
  has_certificate?: boolean;
  joined_at?: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User state
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [authProvider, setAuthProvider] = useState('local');

  // UI state
  const [activeTab, setActiveTab] = useState<'profil' | 'aktiviti' | 'keselamatan'>('profil');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // User events state
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEventModal, setSelectedEventModal] = useState<UserEvent | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }

    fetchUserProfile(token);
    fetchUserEvents(token);
  }, [navigate]);

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
          setName(data.user.name || '');
          setPhoneNumber(data.user.phone_number || '');
          setAvatarUrl(data.user.avatar_url || '');
          setAuthProvider(data.user.auth_provider || 'local');
          localStorage.setItem('adminUser', JSON.stringify(data.user));
        }
      } else {
        // Fallback to localStorage
        const userStr = localStorage.getItem('adminUser');
        if (userStr) {
          const parsed = JSON.parse(userStr);
          setUser(parsed);
          setName(parsed.name || '');
          setPhoneNumber(parsed.phone_number || '');
          setAvatarUrl(parsed.avatar_url || '');
          setAuthProvider(parsed.auth_provider || 'local');
        }
      }
    } catch (e) {
      console.error('Failed to fetch profile', e);
    }
  };

  const fetchUserEvents = async (token: string) => {
    setEventsLoading(true);
    try {
      const response = await fetch('/api/v1/user/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch user events', e);
    } finally {
      setEventsLoading(false);
    }
  };

  // Avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Sila pilih fail imej sahaja (JPEG/PNG).' });
      return;
    }

    setUploadingAvatar(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data.url);
        setMessage({ type: 'success', text: 'Gambar profil sedia untuk disimpan. Sila klik "Simpan Perubahan".' });
      } else {
        setMessage({ type: 'error', text: 'Gagal memuat naik gambar. Sila cuba lagi.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Ralat pelayan semasa memuat naik gambar.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/v1/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name, 
          phone_number: phoneNumber, 
          avatar_url: avatarUrl 
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Profil berjaya dikemaskini!' });
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        setUser(data.user);
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal kemaskini profil.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Ralat pelayan. Sila cuba lagi.' });
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Kata laluan baharu dan pengesahan tidak sepadan.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Kata laluan baharu mesti sekurang-kurangnya 6 aksara.' });
      return;
    }

    setPasswordLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/v1/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPasswordMessage({ type: 'success', text: 'Kata laluan berjaya dikemaskini!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Gagal menukar kata laluan.' });
      }
    } catch (err) {
      setPasswordMessage({ type: 'error', text: 'Ralat pelayan. Sila cuba lagi.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Download e-Certificate
  const handleDownloadCertificate = (ev: UserEvent) => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const width = doc.internal.pageSize.getWidth(); // 297mm
      const height = doc.internal.pageSize.getHeight(); // 210mm

      // Outer decorative border (Dark Green #065f46)
      doc.setDrawColor(6, 95, 70);
      doc.setLineWidth(3);
      doc.rect(10, 10, width - 20, height - 20);

      // Inner decorative border (Gold #d97706)
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.8);
      doc.rect(13, 13, width - 26, height - 26);

      // Corner flourishes
      doc.setFillColor(6, 95, 70);
      doc.rect(9, 9, 8, 8, 'F');
      doc.rect(width - 17, 9, 8, 8, 'F');
      doc.rect(9, height - 17, 8, 8, 'F');
      doc.rect(width - 17, height - 17, 8, 8, 'F');

      // Header Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(6, 95, 70);
      doc.text('MASJID AL-HADHARI', width / 2, 35, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('KAMPUNG MASOLOG, 89108 KOTA MARUDU, SABAH', width / 2, 42, { align: 'center' });

      // Divider line
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.5);
      doc.line(width / 2 - 50, 47, width / 2 + 50, 47);

      // Certificate title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(217, 119, 6);
      doc.text('SIJIL PENYERTAAN', width / 2, 65, { align: 'center' });

      // Introductory Text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(51, 65, 85);
      doc.text('Dengan ini diperakui bahawa', width / 2, 82, { align: 'center' });

      // Participant Name (Big, bold, uppercase)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42);
      const participantName = (user?.name || name || 'Peserta').toUpperCase();
      doc.text(participantName, width / 2, 98, { align: 'center' });

      // Underline for name
      const nameWidth = doc.getTextWidth(participantName);
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.5);
      doc.line(width / 2 - Math.max(nameWidth / 2, 40), 101, width / 2 + Math.max(nameWidth / 2, 40), 101);

      // Body Text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(51, 65, 85);
      doc.text('telah menyertai dan menjayakan program / aktiviti:', width / 2, 115, { align: 'center' });

      // Event Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(6, 95, 70);
      doc.text(`"${ev.title.toUpperCase()}"`, width / 2, 127, { align: 'center' });

      // Date and Venue
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(71, 85, 105);
      const eventDateFormatted = new Date(ev.event_date).toLocaleDateString('ms-MY', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const venueText = ev.venue ? `bertempat di ${ev.venue}` : 'bertempat di Masjid Al-Hadhari, Kg. Masolog';
      doc.text(`Pada ${eventDateFormatted} ${venueText}`, width / 2, 137, { align: 'center' });

      // Signatures Section at bottom
      const sigY = 168;

      // Left side: Tarikh Pengeluaran
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('Tarikh Dikeluarkan:', 45, sigY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }), 45, sigY + 6);
      doc.setDrawColor(203, 213, 225);
      doc.line(45, sigY + 8, 95, sigY + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Pengesahan Sistem Digital', 45, sigY + 13);

      // Right side: Pengerusi
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('......................................................', width - 85, sigY + 4, { align: 'center' });
      doc.text('PENGERUSI', width - 85, sigY + 9, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Jawatankuasa Pengurusan Masjid Al-Hadhari', width - 85, sigY + 14, { align: 'center' });

      // Save the PDF
      const cleanTitle = ev.title.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`E-Sijil_${cleanTitle}.pdf`);
    } catch (err) {
      console.error('Failed to generate certificate', err);
      alert('Gagal menjana e-Sijil. Sila cuba lagi.');
    }
  };

  if (!user) return null;

  return (
    <div className="app-container" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Navbar activePage="utama" />

      <main style={{ maxWidth: '950px', margin: '2rem auto', padding: '0 1rem 4rem' }}>
        {/* Header Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ 
              background: 'white', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              color: '#64748b',
              boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.8rem', fontWeight: '700' }}>
            Profil Pengguna
          </h1>
        </div>

        {/* User Profile Hero Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '2rem'
        }}>
          {/* Avatar with Upload Button */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              border: '3px solid #059669',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={name || 'Avatar'} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <User size={48} color="#059669" />
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              title="Tukar Gambar Profil"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: '#059669',
                color: 'white',
                border: '2px solid white',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
              }}
            >
              <Camera size={16} />
            </button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handleAvatarChange} 
              style={{ display: 'none' }} 
            />
          </div>

          {/* User Info Overview */}
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: '700' }}>
                {name || 'Nama Pengguna'}
              </h2>
              <span style={{
                backgroundColor: '#ecfdf5',
                color: '#065f46',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                textTransform: 'capitalize',
                border: '1px solid #a7f3d0'
              }}>
                {user.role ? user.role.replace('_', ' ') : 'Jemaah'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} color="#94a3b8" />
                <span>{user.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} color="#94a3b8" />
                <span>{phoneNumber || 'Nombor telefon belum didaftarkan'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '2rem',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}>
          <button
            onClick={() => setActiveTab('profil')}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'profil' ? '3px solid #059669' : '3px solid transparent',
              color: activeTab === 'profil' ? '#059669' : '#64748b',
              fontWeight: activeTab === 'profil' ? '700' : '500',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap'
            }}
          >
            <User size={18} />
            <span>Maklumat Profil</span>
          </button>

          <button
            onClick={() => setActiveTab('aktiviti')}
            style={{
              padding: '0.75rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'aktiviti' ? '3px solid #059669' : '3px solid transparent',
              color: activeTab === 'aktiviti' ? '#059669' : '#64748b',
              fontWeight: activeTab === 'aktiviti' ? '700' : '500',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Award size={18} />
            <span>Aktiviti Disertai & E-Sijil ({events.length})</span>
          </button>

          {authProvider === 'local' && (
            <button
              onClick={() => setActiveTab('keselamatan')}
              style={{
                padding: '0.75rem 1.25rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'keselamatan' ? '3px solid #059669' : '3px solid transparent',
                color: activeTab === 'keselamatan' ? '#059669' : '#64748b',
                fontWeight: activeTab === 'keselamatan' ? '700' : '500',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap'
              }}
            >
              <KeyRound size={18} />
              <span>Ubah Kata Laluan</span>
            </button>
          )}
        </div>

        {/* Tab 1: Maklumat Profil */}
        {activeTab === 'profil' && (
          <div className="card" style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0' }}>
            {message.text && (
              <div style={{ 
                padding: '1rem', 
                marginBottom: '1.5rem', 
                borderRadius: '8px',
                backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: message.type === 'success' ? '#166534' : '#991b1b',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                border: `1px solid ${message.type === 'success' ? '#86efac' : '#fca5a5'}`
              }}>
                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
                  Nama Penuh
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    placeholder="Nama penuh seperti dalam kad pengenalan"
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem 0.75rem 0.75rem 2.5rem', 
                      borderRadius: '8px', 
                      border: '1px solid #cbd5e1', 
                      fontSize: '1rem' 
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
                  Alamat Emel
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="email" 
                    value={user.email} 
                    disabled
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem 0.75rem 0.75rem 2.5rem', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0', 
                      backgroundColor: '#f8fafc',
                      color: '#64748b',
                      fontSize: '1rem',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>
                <small style={{ color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                  Alamat emel tidak boleh diubah kerana dipautkan kepada identiti akaun anda.
                </small>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
                  Nombor Telefon (WhatsApp)
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="tel" 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value)} 
                    placeholder="cth: 012-3456789"
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem 0.75rem 0.75rem 2.5rem', 
                      borderRadius: '8px', 
                      border: '1px solid #cbd5e1', 
                      fontSize: '1rem' 
                    }}
                  />
                </div>
                <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>
                  Digunakan oleh pihak pengurusan masjid untuk menghubungi anda bagi tujuan aktiviti atau program.
                </small>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
                  Peranan / Status Akaun
                </label>
                <div style={{ 
                  padding: '0.75rem 1rem', 
                  backgroundColor: '#f1f5f9', 
                  borderRadius: '8px', 
                  color: '#475569', 
                  textTransform: 'capitalize',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Shield size={18} color="#059669" />
                  <span>{user.role ? user.role.replace('_', ' ') : 'Jemaah'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.75rem' }}
                >
                  <Save size={18} />
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Aktiviti Disertai & E-Sijil */}
        {activeTab === 'aktiviti' && (
          <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem', color: '#0f172a', fontSize: '1.25rem', fontWeight: '700' }}>
                  Aktiviti Yang Disertai
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                  Senarai program kariah yang anda daftarkan. Klik pada aktiviti untuk melihat butiran atau muat turun e-Sijil penyertaan anda.
                </p>
              </div>
              <button 
                onClick={() => navigate('/aktiviti')}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>Lihat Semua Aktiviti</span>
                <ExternalLink size={14} />
              </button>
            </div>

            {eventsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <p style={{ color: '#64748b' }}>Memuatkan aktiviti anda...</p>
              </div>
            ) : events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: '#94a3b8' }}>
                  <CalendarIcon size={32} />
                </div>
                <h4 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontSize: '1.1rem' }}>Anda belum menyertai sebarang aktiviti</h4>
                <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
                  Sertai aktiviti dan program anjuran Masjid Al-Hadhari untuk mendapatkan ilmu serta e-Sijil penyertaan rasmi.
                </p>
                <button 
                  onClick={() => navigate('/aktiviti')}
                  style={{
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Sertai Aktiviti Sekarang
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.5rem' }}>
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                    }}
                  >
                    {/* Event Banner */}
                    <div 
                      onClick={() => setSelectedEventModal(ev)}
                      style={{ 
                        height: '140px', 
                        backgroundColor: '#f1f5f9',
                        backgroundImage: ev.image_url ? `url(${ev.image_url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {!ev.image_url && <CalendarIcon size={36} color="#94a3b8" />}
                      <span style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: 'rgba(6, 95, 70, 0.9)',
                        color: 'white',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        Telah Disertai
                      </span>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h4 
                        onClick={() => setSelectedEventModal(ev)}
                        style={{ margin: '0 0 0.5rem', color: '#0f172a', fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        {ev.title}
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={15} color="#059669" />
                          <span>{new Date(ev.event_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <MapPin size={15} color="#059669" />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ev.venue || 'Masjid Al-Hadhari'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setSelectedEventModal(ev)}
                          style={{
                            flex: 1,
                            padding: '0.6rem',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            color: '#334155',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Eye size={15} />
                          <span>Butiran</span>
                        </button>

                        <button
                          onClick={() => handleDownloadCertificate(ev)}
                          style={{
                            flex: 1.2,
                            padding: '0.6rem',
                            backgroundColor: '#059669',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
                          }}
                          onMouseOver={e => (e.currentTarget.style.backgroundColor = '#047857')}
                          onMouseOut={e => (e.currentTarget.style.backgroundColor = '#059669')}
                        >
                          <Download size={15} />
                          <span>E-Sijil</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Ubah Kata Laluan (Local Auth Only) */}
        {activeTab === 'keselamatan' && authProvider === 'local' && (
          <div className="card" style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0', maxWidth: '600px' }}>
            <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontSize: '1.3rem', fontWeight: '700' }}>
              Ubah Kata Laluan
            </h3>
            <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
              Pastikan kata laluan baharu anda sekurang-kurangnya 6 aksara dan mengandungi gabungan huruf serta nombor untuk keselamatan.
            </p>

            {passwordMessage.text && (
              <div style={{ 
                padding: '1rem', 
                marginBottom: '1.5rem', 
                borderRadius: '8px',
                backgroundColor: passwordMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: passwordMessage.type === 'success' ? '#166534' : '#991b1b',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                border: `1px solid ${passwordMessage.type === 'success' ? '#86efac' : '#fca5a5'}`
              }}>
                {passwordMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>
                  Kata Laluan Semasa
                </label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  required 
                  placeholder="Masukkan kata laluan semasa anda"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>
                  Kata Laluan Baharu
                </label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  placeholder="Sekurang-kurangnya 6 aksara"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>
                  Sahkan Kata Laluan Baharu
                </label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  placeholder="Ulang kata laluan baharu"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={passwordLoading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <KeyRound size={18} />
                {passwordLoading ? 'Menyimpan...' : 'Kemas Kini Kata Laluan'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Activity Details Modal */}
      {selectedEventModal && (
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
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setSelectedEventModal(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#334155',
                zIndex: 10,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <X size={18} />
            </button>

            {selectedEventModal.image_url && (
              <div style={{
                height: '220px',
                backgroundImage: `url(${selectedEventModal.image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px'
              }} />
            )}

            <div style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                <CalendarIcon size={16} />
                <span>{new Date(selectedEventModal.event_date).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>

              <h3 style={{ margin: '0 0 1rem', color: '#0f172a', fontSize: '1.4rem', fontWeight: '700' }}>
                {selectedEventModal.title}
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                <MapPin size={16} color="#059669" />
                <span>{selectedEventModal.venue || 'Masjid Al-Hadhari, Kg. Masolog'}</span>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', color: '#334155', fontSize: '0.95rem', lineHeight: '1.6' }}>
                {selectedEventModal.description || 'Tiada keterangan lanjut mengenai aktiviti ini.'}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => handleDownloadCertificate(selectedEventModal)}
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)'
                  }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = '#047857')}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = '#059669')}
                >
                  <Download size={18} />
                  <span>Muat Turun E-Sijil (PDF)</span>
                </button>

                <button
                  onClick={() => setSelectedEventModal(null)}
                  style={{
                    padding: '0.85rem 1.25rem',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
