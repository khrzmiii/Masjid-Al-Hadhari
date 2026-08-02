import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PublicPortal from './pages/PublicPortal';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import HistoryPage from './pages/HistoryPage';
import CommitteePage from './pages/CommitteePage';
import ActivitiesPage from './pages/ActivitiesPage';
import VerifyEmail from './pages/VerifyEmail';
import ProfilePage from './pages/ProfilePage';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = '783033815393-v7ov3t2urut7aa30o7b37cuaaberd8pg.apps.googleusercontent.com';function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicPortal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/sejarah" element={<HistoryPage />} />
          <Route path="/jawatankuasa" element={<CommitteePage />} />
          <Route path="/aktiviti" element={<ActivitiesPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
