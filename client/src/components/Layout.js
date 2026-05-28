import React from 'react';
import { NavLink } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { useDate } from '../hooks/useDate';
import './Layout.css';

const navItems = [
  { to: '/',         label: 'Home',     icon: '🏠' },
  { to: '/steps',    label: 'Steps',    icon: '👟' },
  { to: '/calories', label: 'Calories', icon: '🥗' },
  { to: '/workout',  label: 'Workout',  icon: '🏋️' },
  { to: '/water',    label: 'Water',    icon: '💧' },
  { to: '/schedule', label: 'Schedule', icon: '📅' },
  { to: '/diet',     label: 'Diet',     icon: '🍎' },
  { to: '/profile',  label: 'Profile',  icon: '👤' },
];

export default function Layout({ children }) {
  const { profile } = useProfile();
  const { display } = useDate();

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-left">
          <span className="logo">⚡ FitTrack</span>
          <span className="topbar-date">{display}</span>
        </div>
        <div className="topbar-right">
          <span className="user-name">{profile?.name || 'User'}</span>
        </div>
      </header>
      <div className="main-body">
        <nav className="sidebar">
          {navItems.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>
        <main className="page-content">{children}</main>
      </div>
      <nav className="bottom-nav">
        {navItems.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({isActive}) => `bnav-item ${isActive ? 'active' : ''}`}>
            <span>{icon}</span>
            <span>{label}</span>
            
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
