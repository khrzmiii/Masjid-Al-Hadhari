import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import './ActivityCalendar.css';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  venue: string;
}

const ActivityCalendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/public/events')
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          setEvents(json.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load events:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="calendar-loading">Memuatkan aktiviti...</div>;
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <section className="activity-calendar" id="calendar">
      <div className="section-header">
        <h2>Aktiviti & Program</h2>
        <p>Sertai pelbagai program yang dianjurkan oleh Masjid Al-Hadhari</p>
      </div>

      <div className="events-grid">
        {events.map(event => {
          const dateObj = new Date(event.event_date);
          const dateStr = dateObj.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
          const timeStr = dateObj.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={event.id} className="event-card">
              <div className="event-date-badge">
                <span className="event-day">{dateObj.getDate()}</span>
                <span className="event-month">{dateObj.toLocaleDateString('ms-MY', { month: 'short' })}</span>
              </div>
              <div className="event-details">
                <h3>{event.title}</h3>
                <p className="event-description">{event.description}</p>
                <div className="event-meta">
                  <span className="meta-item">
                    <Clock size={16} /> {timeStr}
                  </span>
                  <span className="meta-item">
                    <MapPin size={16} /> {event.venue || 'Masjid Al-Hadhari'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ActivityCalendar;
