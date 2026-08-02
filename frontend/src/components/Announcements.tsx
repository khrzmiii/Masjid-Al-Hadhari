import React, { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';
import './Announcements.css';

interface Announcement {
  id: string;
  title: string;
  message: string;
  severity: 'normal' | 'important' | 'emergency';
  link?: string;
}

const Announcements: React.FC = () => {
  // Mock data representing the latest high-priority announcement
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    fetch('/api/v1/public/announcements')
      .then(res => res.json())
      .then(json => {
        if (json.data && json.data.length > 0) {
          setAnnouncement(json.data[0]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch announcements", err);
      });
  }, []);

  if (!announcement) return null;

  return (
    <div className={`ticker-container severity-${announcement.severity}`}>
      <div className="ticker-content">
        <div className="ticker-icon">
          <Megaphone size={20} />
        </div>
        <div className="ticker-text">
          <strong>{announcement.title}:</strong> {announcement.message}
          {announcement.link && (
            <a href={announcement.link} className="ticker-link">Baca Lanjut</a>
          )}
        </div>
        <button 
          className="ticker-close" 
          onClick={() => setAnnouncement(null)}
          aria-label="Tutup"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default Announcements;
