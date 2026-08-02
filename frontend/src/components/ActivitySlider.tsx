import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import './ActivitySlider.css';

interface EventData {
  id: string;
  title: string;
  image_url: string;
  event_date: string;
}

const ActivitySlider: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/v1/public/events')
      .then(res => res.json())
      .then(json => {
        if (json.data && Array.isArray(json.data)) {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          const upcoming = json.data.filter((ev: EventData) => new Date(ev.event_date) >= now);
          setEvents(upcoming.slice(0, 5));
        }
      })
      .catch(err => console.error("Failed to fetch events for slider", err))
      .finally(() => setLoading(false));
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="activity-slider-widget card">
      <div className="slider-header">
        <div className="slider-title">
          <Calendar className="icon" size={24} />
          <h2>Hebahan Aktiviti</h2>
        </div>
        <div className="slider-controls">
          <button onClick={scrollLeft} className="control-btn" aria-label="Kiri"><ChevronLeft size={20} /></button>
          <button onClick={scrollRight} className="control-btn" aria-label="Kanan"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="slider-container" ref={scrollRef}>
        {loading ? (
          <div className="slider-loading">Memuatkan hebahan...</div>
        ) : events.length === 0 ? (
          <div className="slider-empty">
            <p>Tiada hebahan terkini</p>
          </div>
        ) : (
          events.map(ev => (
            <div 
              key={ev.id} 
              className="slider-item" 
              onClick={() => navigate('/aktiviti')}
            >
              <div 
                className="slider-image" 
                style={{ 
                  backgroundImage: ev.image_url ? `url(${ev.image_url})` : 'none',
                  backgroundColor: ev.image_url ? 'transparent' : '#e2e8f0'
                }}
              >
                {!ev.image_url && <Calendar size={48} color="#94a3b8" />}
              </div>
              <div className="slider-item-content">
                <h4>{ev.title}</h4>
                <p>{new Date(ev.event_date).toLocaleDateString('ms-MY')}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivitySlider;
