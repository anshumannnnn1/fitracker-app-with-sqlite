import React, { createContext, useState, useContext, useEffect } from 'react';
import { getProfile, saveProfile as dbSaveProfile } from '../db/database';

const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProfile()
      .then(p => setProfile(p))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const refreshProfile = async () => {
    const p = await getProfile();
    setProfile(p);
    return p;
  };

  const updateProfile = async (data) => {
    await dbSaveProfile(data);
    await refreshProfile();
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
