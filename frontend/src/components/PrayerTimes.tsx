import React, { useState, useEffect } from 'react';
import { Clock, MapPin, AlertCircle } from 'lucide-react';
import './PrayerTimes.css';

interface PrayerData {
  fajr: string;
  syuruk: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

const PrayerTimes: React.FC = () => {
  // Mock data as fallback/default
  const [times, setTimes] = useState<PrayerData>({
    fajr: '04:50',
    syuruk: '06:15',
    dhuhr: '12:20',
    asr: '15:40',
    maghrib: '18:25',
    isha: '19:35'
  });
  const [date, setDate] = useState<string>('');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [currentPrayer, setCurrentPrayer] = useState<string>('');
  const [liveTime, setLiveTime] = useState<string>('');
  const [hijriDate, setHijriDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('ms-MY', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setDate(today.toLocaleDateString('ms-MY', options));
    
    try {
      const hijriFormatter = new Intl.DateTimeFormat('ms-MY-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' });
      const formattedHijri = hijriFormatter.format(today);
      // Ensure 'H' or 'AH' is appended if not present
      setHijriDate(formattedHijri.includes('H') ? formattedHijri : `${formattedHijri} H`);
    } catch (e) {
      setHijriDate('');
    }
    
    // Check network status
    if (!navigator.onLine) {
      setIsOffline(true);
    }

    // Fetch from backend API
    fetch('/api/v1/public/prayer-times?zone=SBH05')
      .then(res => res.json())
      .then(json => {
        if (json.data && json.data.times) {
          // ensure syuruk exists
          setTimes({
            fajr: json.data.times.fajr || json.data.times.subuh || times.fajr,
            syuruk: json.data.times.syuruk || times.syuruk,
            dhuhr: json.data.times.dhuhr || json.data.times.zohor || times.dhuhr,
            asr: json.data.times.asr || json.data.times.asar || times.asr,
            maghrib: json.data.times.maghrib || times.maghrib,
            isha: json.data.times.isha || json.data.times.isyak || times.isha
          });
        }
      })
      .catch(err => {
        console.error("Failed to fetch prayer times", err);
        setIsOffline(true);
      });
  }, []);

  // Update current prayer every minute
  useEffect(() => {
    const determineCurrentPrayer = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTime = currentHours + currentMinutes / 60;
      
      const parseTime = (timeStr: string) => {
        if (!timeStr) return 0;
        const parts = timeStr.split(':');
        if (parts.length !== 2) return 0;
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        return h + m / 60;
      };

      const p = [
        { name: 'Subuh', t: parseTime(times.fajr) },
        { name: 'Syuruk', t: parseTime(times.syuruk) },
        { name: 'Zohor', t: parseTime(times.dhuhr) },
        { name: 'Asar', t: parseTime(times.asr) },
        { name: 'Maghrib', t: parseTime(times.maghrib) },
        { name: 'Isyak', t: parseTime(times.isha) }
      ];

      let current = 'Isyak'; // Default if before Subuh
      for (let i = 0; i < p.length; i++) {
        if (currentTime >= p[i].t) {
          current = p[i].name;
        } else {
          break;
        }
      }
      
      setCurrentPrayer(current);
    };
    
    determineCurrentPrayer();
    const interval = setInterval(determineCurrentPrayer, 60000);
    return () => clearInterval(interval);
  }, [times]);

  const prayers = [
    { name: 'Subuh', time: times.fajr },
    { name: 'Syuruk', time: times.syuruk },
    { name: 'Zohor', time: times.dhuhr },
    { name: 'Asar', time: times.asr },
    { name: 'Maghrib', time: times.maghrib },
    { name: 'Isyak', time: times.isha }
  ];

  return (
    <div className="prayer-times-widget">
      <div className="prayer-header">
        <div className="prayer-title">
          <Clock className="icon" size={24} />
          <h2>Waktu Solat</h2>
        </div>
        <div className="prayer-location">
          <MapPin size={16} />
          <span>Zon: Tandek, Kota Marudu (SBH05)</span>
        </div>
        
        <div className="live-clock-container">
          <div className="live-time">{liveTime}</div>
          <div className="dates-container">
            <span className="gregorian-date">{date}</span>
            {hijriDate && <span className="date-divider">•</span>}
            {hijriDate && <span className="hijri-date">{hijriDate}</span>}
          </div>
        </div>
        
        {isOffline && (
          <div className="offline-badge">
            <AlertCircle size={14} />
            <span>Mod Luar Talian</span>
          </div>
        )}
      </div>
      
      <div className="prayer-grid">
        {prayers.map((prayer, idx) => (
          <div key={idx} className={`prayer-item ${currentPrayer === prayer.name ? 'active-prayer' : ''}`}>
            <span className="prayer-name">{prayer.name}</span>
            <span className="prayer-time">{prayer.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrayerTimes;
