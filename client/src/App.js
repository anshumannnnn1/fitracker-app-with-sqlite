import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Steps from './pages/Steps';
import Calories from './pages/Calories';
import Workout from './pages/Workout';
import Water from './pages/Water';
import Schedule from './pages/Schedule';
import Diet from './pages/Diet';
import Profile from './pages/Profile';

function AppRoutes() {
  const { loading } = useProfile();

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', fontSize: 16, color: '#6B7280'
    }}>
      Loading...
    </div>
  );

  return (
    <Layout>
      <Routes>
        <Route path="/"         element={<Dashboard />} />
        <Route path="/steps"    element={<Steps />} />
        <Route path="/calories" element={<Calories />} />
        <Route path="/workout"  element={<Workout />} />
        <Route path="/water"    element={<Water />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/diet"     element={<Diet />} />
        <Route path="/profile"  element={<Profile />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <ProfileProvider>
      <AppRoutes />
    </ProfileProvider>
  );
}
