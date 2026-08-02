import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, MapPin, ArrowLeft, Share2 } from 'lucide-react';
import Navbar from '../components/Navbar';

interface EventData {
  id: string;
  title: string;
  description: string;
  image_url: string;
  event_date: string;
  venue: string;
}

const ActivitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [upcomingEvents, setUpcomingEvents] = useState<EventData[]>([]);
  const [pastEvents, setPastEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  // Auth state for join button
  let isLoggedIn = false;
  let userRole = 'public';
  try {
    const token = localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('adminUser');
    if (token && userStr) {
      isLoggedIn = true;
      const user = JSON.parse(userStr);
      userRole = user.role || 'public';
    }
  } catch (e) {}

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/v1/public/events');
      const data = await response.json();
      if (response.ok && Array.isArray(data.data)) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        
        const upcoming = data.data.filter((ev: EventData) => new Date(ev.event_date) >= now);
        const past = data.data.filter((ev: EventData) => new Date(ev.event_date) < now);
        
        past.sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
        
        setUpcomingEvents(upcoming);
        setPastEvents(past);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleWhatsAppShare = (event: EventData) => {
    const activityLink = `${window.location.origin}/aktiviti`;
    const text = `Sertai aktiviti ini di Masjid Al-Hadhari!\n\n*${event.title}*\nTarikh: ${new Date(event.event_date).toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}\nTempat: ${event.venue || 'Masjid Al-Hadhari'}\n\n${event.description}\n\nDaftar sekarang di: ${activityLink}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleJoinClick = async (event: EventData) => {
    if (!isLoggedIn) {
      alert('Sila log masuk atau daftar untuk menyertai aktiviti ini.');
      navigate('/login');
      return;
    }
    
    if (userRole === 'pending') {
      alert('Akaun anda sedang menunggu kelulusan. Anda tidak boleh menyertai aktiviti buat masa ini.');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch(`/api/v1/events/${event.id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert(`Penyertaan anda untuk "${event.title}" telah berjaya direkodkan!`);
        setSelectedEvent(null);
      } else {
        const err = await response.json();
        alert(err.error || 'Gagal menyertai aktiviti.');
      }
    } catch (err) {
      alert('Ralat pelayan. Sila cuba lagi.');
    }
  };

  return (
    <div className="app-container">
      <Navbar activePage="aktiviti" />

      <main className="main-content" style={{ padding: '4rem 2rem', backgroundColor: '#f8fafc', minHeight: '80vh', position: 'relative' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <CalendarIcon size={32} color="var(--color-primary)" />
            <h1 style={{ color: 'var(--color-primary)', fontSize: '2.5rem', margin: 0 }}>Aktiviti & Program</h1>
          </div>

          {loading ? (
            <p>Memuatkan aktiviti...</p>
          ) : upcomingEvents.length === 0 && pastEvents.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.2rem', color: '#64748b' }}>Tiada aktiviti yang dijadualkan pada masa ini.</p>
            </div>
          ) : (
            <>
              {/* Upcoming Events Section */}
              <div style={{ marginBottom: '4rem' }}>
                <h2 style={{ color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '2rem' }}>Aktiviti Akan Datang</h2>
                {upcomingEvents.length === 0 ? (
                  <p style={{ color: '#64748b' }}>Tiada aktiviti akan datang dijadualkan.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {upcomingEvents.map(ev => (
                      <div 
                        key={ev.id} 
                        className="card" 
                        style={{ overflow: 'hidden', padding: 0, cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid var(--color-border)' }}
                        onClick={() => setSelectedEvent(ev)}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        {ev.image_url ? (
                          <div style={{ width: '100%', height: '200px', backgroundImage: `url(${ev.image_url})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#f8fafc' }}></div>
                        ) : (
                          <div style={{ width: '100%', height: '200px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CalendarIcon size={48} color="#94a3b8" />
                          </div>
                        )}
                        <div style={{ padding: '1.5rem' }}>
                          <h3 style={{ margin: '0 0 1rem 0', color: 'var(--color-primary)' }}>{ev.title}</h3>
                          <p style={{ color: '#475569', marginBottom: '1rem', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.description}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            <CalendarIcon size={16} />
                            <span>{new Date(ev.event_date).toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Events Section */}
              {pastEvents.length > 0 && (
                <div>
                  <h2 style={{ color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '2rem' }}>Aktiviti Terdahulu</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {pastEvents.map(ev => (
                      <div 
                        key={ev.id} 
                        className="card" 
                        style={{ overflow: 'hidden', padding: 0, cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid var(--color-border)', opacity: 0.8 }}
                        onClick={() => setSelectedEvent(ev)}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        {ev.image_url ? (
                          <div style={{ width: '100%', height: '200px', backgroundImage: `url(${ev.image_url})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#f8fafc', filter: 'grayscale(50%)' }}></div>
                        ) : (
                          <div style={{ width: '100%', height: '200px', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CalendarIcon size={48} color="#94a3b8" />
                          </div>
                        )}
                        <div style={{ padding: '1.5rem' }}>
                          <h3 style={{ margin: '0 0 1rem 0', color: '#475569' }}>{ev.title}</h3>
                          <p style={{ color: '#64748b', marginBottom: '1rem', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.description}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            <CalendarIcon size={16} />
                            <span>{new Date(ev.event_date).toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Perincian Aktiviti */}
        {selectedEvent && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', zIndex: 1000, padding: '1rem'
          }}>
            <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 0 }}>
              {selectedEvent.image_url && (
                <div style={{ width: '100%', height: '250px', backgroundImage: `url(${selectedEvent.image_url})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#f8fafc' }}></div>
              )}
              <div style={{ padding: '2rem' }}>
                <h2 style={{ color: 'var(--color-primary)', marginTop: 0, fontSize: '1.8rem' }}>{selectedEvent.title}</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1.5rem 0', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569' }}>
                    <CalendarIcon size={20} color="var(--color-primary)" />
                    <strong>Tarikh:</strong> {new Date(selectedEvent.event_date).toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {selectedEvent.venue && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#475569' }}>
                      <MapPin size={20} color="var(--color-primary)" />
                      <strong>Tempat:</strong> {selectedEvent.venue}
                    </div>
                  )}
                </div>

                <div style={{ color: '#334155', lineHeight: 1.8, marginBottom: '2rem', whiteSpace: 'pre-wrap' }}>
                  {selectedEvent.description}
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#25D366', color: '#25D366' }} onClick={() => handleWhatsAppShare(selectedEvent)}>
                    <Share2 size={18} /> Kongsi ke WhatsApp
                  </button>
                  <button className="btn btn-outline" onClick={() => setSelectedEvent(null)}>Tutup</button>
                  {new Date(selectedEvent.event_date) >= new Date(new Date().setHours(0,0,0,0)) && (
                    <button className="btn btn-primary" onClick={() => handleJoinClick(selectedEvent)}>Sertai Aktiviti Ini</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="footer">
        <div className="copyright">
          &copy; {new Date().getFullYear()} Jawatankuasa Pengurusan Masjid Al-Hadhari, Kg. Masolog.
        </div>
      </footer>
    </div>
  );
};

export default ActivitiesPage;
