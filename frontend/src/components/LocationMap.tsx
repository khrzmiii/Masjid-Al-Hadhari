import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import './LocationMap.css';

const LocationMap: React.FC = () => {
  // Coordinates roughly for Masjid Al-Hadhari, Kg. Masolog, Kota Marudu
  const locationName = "Masjid Al-Hadhari Kg Masolog";
  const mapEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY_HERE&q=${encodeURIComponent(locationName + " Kota Marudu Sabah")}`;
  // NOTE: For a real production app without an API key, we can use the generic google maps embed 
  // without an API key by using the regular share link embed, but here's a standard iframe fallback:
  
  const mapIframeUrl = "https://maps.google.com/maps?q=Masjid%20Al-Hadhari%20Kg%20Masolog%20Kota%20Marudu&t=&z=16&ie=UTF8&iwloc=&output=embed";
  
  const googleMapsLink = `https://maps.google.com/?q=${encodeURIComponent(locationName + " Kota Marudu Sabah")}`;
  // Waze uses a different format, usually lat/lng or search query
  const wazeLink = `https://waze.com/ul?q=${encodeURIComponent(locationName + " Kota Marudu")}&navigate=yes`;

  return (
    <section className="location-section" id="hubungi">
      <div className="location-container">
        <div className="location-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2>Hubungi Kami</h2>
          <p>Jika ada sebarang pertanyaan, sila hubungi pihak pengurusan masjid.</p>
        </div>

        <div className="contact-grid">
          {/* Contact Information */}
          <div className="contact-info card">
            <div className="contact-item">
              <div className="contact-icon-wrapper">
                <MapPin className="icon" size={24} color="var(--color-primary)" />
              </div>
              <div className="contact-details">
                <h3>Alamat Penuh</h3>
                <p>Masjid Al-Hadhari,<br />Kg. Masolog,<br />89100 Kota Marudu, Sabah</p>
              </div>
            </div>

            <div className="contact-item" style={{ marginTop: '2rem' }}>
              <div className="contact-icon-wrapper">
                <Navigation className="icon" size={24} color="var(--color-primary)" />
              </div>
              <div className="contact-details">
                <h3>Pengerusi Masjid</h3>
                <p>Nama Pengerusi: <strong>Akan Dikemas Kini</strong></p>
                <p>No. Telefon: <strong>+60 12-345 6789</strong></p>
              </div>
            </div>

            <div className="contact-item" style={{ marginTop: '2rem' }}>
              <div className="contact-icon-wrapper" style={{ backgroundColor: '#e0f2fe' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon" color="#0284c7">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </div>
              <div className="contact-details">
                <h3 style={{ margin: '0 0 0.25rem 0' }}>
                  <a href="https://www.facebook.com/profile.php?id=61576774240855" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
                    Masjid Al Hadhari
                  </a>
                </h3>
                <p>Akaun Facebook Rasmi Kami</p>
              </div>
            </div>

            <div className="contact-item" style={{ marginTop: '1.5rem' }}>
              <div className="contact-icon-wrapper" style={{ backgroundColor: '#fee2e2' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon" color="#dc2626">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path>
                  <path d="m10 15 5-3-5-3z"></path>
                </svg>
              </div>
              <div className="contact-details">
                <h3 style={{ margin: '0 0 0.25rem 0' }}>
                  <a href="https://youtube.com/@al-hadharimediaofficial3646?si=cZWPJdvFr_kY-EWg" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
                    Al-Hadhari Media Official
                  </a>
                </h3>
                <p>Akaun YouTube Rasmi Kami</p>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="map-section">
            <div className="map-wrapper">
              <iframe 
                src={mapIframeUrl}
                width="100%" 
                height="350" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Peta Lokasi Masjid"
              ></iframe>
            </div>

            <div className="nav-buttons">
              <a href={googleMapsLink} target="_blank" rel="noopener noreferrer" className="btn nav-btn google-btn">
                <svg style={{ width: '20px', height: '20px', marginRight: '0.5rem' }} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google Maps</title><path fill="currentColor" d="M19.527 4.799c1.212 2.608.937 5.678-.405 8.173-1.101 2.047-2.744 3.74-4.098 5.614-.619.858-1.244 1.75-1.669 2.727-.141.325-.263.658-.383.992-.121.333-.224.673-.34 1.008-.109.314-.236.684-.627.687h-.007c-.466-.001-.579-.53-.695-.887-.284-.874-.581-1.713-1.019-2.525-.51-.944-1.145-1.817-1.79-2.671L19.527 4.799zM8.545 7.705l-3.959 4.707c.724 1.54 1.821 2.863 2.871 4.18.247.31.494.622.737.936l4.984-5.925-.029.01c-1.741.601-3.691-.291-4.392-1.987a3.377 3.377 0 0 1-.209-.716c-.063-.437-.077-.761-.004-1.198l.001-.007zM5.492 3.149l-.003.004c-1.947 2.466-2.281 5.88-1.117 8.77l4.785-5.689-.058-.05-3.607-3.035zM14.661.436l-3.838 4.563a.295.295 0 0 1 .027-.01c1.6-.551 3.403.15 4.22 1.626.176.319.323.683.377 1.045.068.446.085.773.012 1.22l-.003.016 3.836-4.561A8.382 8.382 0 0 0 14.67.439l-.009-.003zM9.466 5.868L14.162.285l-.047-.012A8.31 8.31 0 0 0 11.986 0a8.439 8.439 0 0 0-6.169 2.766l-.016.018 3.665 3.084z"/></svg>
                Google Maps
              </a>
              <a href={wazeLink} target="_blank" rel="noopener noreferrer" className="btn nav-btn waze-btn">
                <svg style={{ width: '20px', height: '20px', marginRight: '0.5rem' }} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Waze</title><path fill="currentColor" d="M13.218 0C9.915 0 6.835 1.49 4.723 4.148c-1.515 1.913-2.31 4.272-2.31 6.706v1.739c0 .894-.62 1.738-1.862 1.813-.298.025-.547.224-.547.522-.05.82.82 2.31 2.012 3.502.82.844 1.788 1.515 2.832 2.036a3 3 0 0 0 2.955 3.528 2.966 2.966 0 0 0 2.931-2.385h2.509c.323 1.689 2.086 2.856 3.974 2.21 1.64-.546 2.36-2.409 1.763-3.924a12.84 12.84 0 0 0 1.838-1.465 10.73 10.73 0 0 0 3.18-7.65c0-2.882-1.118-5.589-3.155-7.625A10.899 10.899 0 0 0 13.218 0zm0 1.217c2.558 0 4.967.994 6.78 2.807a9.525 9.525 0 0 1 2.807 6.78A9.526 9.526 0 0 1 20 17.585a9.647 9.647 0 0 1-6.78 2.807h-2.46a3.008 3.008 0 0 0-2.93-2.41 3.03 3.03 0 0 0-2.534 1.367v.024a8.945 8.945 0 0 1-2.41-1.788c-.844-.844-1.316-1.614-1.515-2.11a2.858 2.858 0 0 0 1.441-.846 2.959 2.959 0 0 0 .795-2.036v-1.789c0-2.11.696-4.197 2.012-5.861 1.863-2.385 4.62-3.726 7.6-3.726zm-2.41 5.986a1.192 1.192 0 0 0-1.191 1.192 1.192 1.192 0 0 0 1.192 1.193A1.192 1.192 0 0 0 12 8.395a1.192 1.192 0 0 0-1.192-1.192zm7.204 0a1.192 1.192 0 0 0-1.192 1.192 1.192 1.192 0 0 0 1.192 1.193 1.192 1.192 0 0 0 1.192-1.193 1.192 1.192 0 0 0-1.192-1.192zm-7.377 4.769a.596.596 0 0 0-.546.845 4.813 4.813 0 0 0 4.346 2.757 4.77 4.77 0 0 0 4.347-2.757.596.596 0 0 0-.547-.845h-.025a.561.561 0 0 0-.521.348 3.59 3.59 0 0 1-3.254 2.061 3.591 3.591 0 0 1-3.254-2.061.64.64 0 0 0-.546-.348z"/></svg>
                Waze
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationMap;
