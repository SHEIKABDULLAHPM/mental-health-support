import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(7);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const savedAuth = localStorage.getItem('mindpeace-auth');
      const savedUser = localStorage.getItem('mindpeace-user');
      const savedPoints = localStorage.getItem('mindpeace-points');
      const savedStreak = localStorage.getItem('mindpeace-streak');
      const savedBadges = localStorage.getItem('mindpeace-badges');

      if (savedAuth === 'true' && savedUser) {
        try {
          const localUser = JSON.parse(savedUser);
          const profile = await api.user.me();
          const resolvedToken = localUser?.token || localUser?.access_token || localStorage.getItem('mindpeace-token') || null;
          const userData = {
            ...localUser,
            ...profile,
            token: resolvedToken,
          };

          setUser(userData);
          setIsAuthenticated(true);

          if (savedPoints) setPoints(parseInt(savedPoints));
          if (savedStreak) setStreak(parseInt(savedStreak));
          if (savedBadges) setBadges(JSON.parse(savedBadges));
          localStorage.setItem('mindpeace-user', JSON.stringify(userData));
          if (resolvedToken) {
            localStorage.setItem('mindpeace-token', resolvedToken);
          }
        } catch (error) {
          console.error('Error restoring session:', error);
          localStorage.removeItem('mindpeace-auth');
          localStorage.removeItem('mindpeace-user');
          localStorage.removeItem('mindpeace-points');
          localStorage.removeItem('mindpeace-streak');
          localStorage.removeItem('mindpeace-badges');
          localStorage.removeItem('mindpeace-token');
        }
      }

      setIsLoading(false);
    };

    bootstrapAuth();
  }, []);

  const login = (userData) => {
    const resolvedToken = userData?.token || userData?.access_token || userData?.accessToken || null;
    const normalizedUser = {
      ...userData,
      token: resolvedToken,
    };
    setUser(normalizedUser);
    setIsAuthenticated(true);
    localStorage.setItem('mindpeace-auth', 'true');
    localStorage.setItem('mindpeace-user', JSON.stringify(normalizedUser));
    if (resolvedToken) {
      localStorage.setItem('mindpeace-token', resolvedToken);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore logout transport errors and clear local auth regardless.
    }
    setUser(null);
    setIsAuthenticated(false);
    setPoints(0);
    setStreak(0);
    setBadges([]);
    localStorage.removeItem('mindpeace-auth');
    localStorage.removeItem('mindpeace-user');
    localStorage.removeItem('mindpeace-onboarded');
    localStorage.removeItem('mindpeace-points');
    localStorage.removeItem('mindpeace-streak');
    localStorage.removeItem('mindpeace-badges');
    localStorage.removeItem('mindpeace-token');
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('mindpeace-user', JSON.stringify(updatedUser));
  };

  const addPoints = (amount) => {
    const newPoints = points + amount;
    setPoints(newPoints);
    localStorage.setItem('mindpeace-points', newPoints.toString());
  };

  const addBadge = (badge) => {
    const newBadges = [...badges, { ...badge, earnedAt: new Date().toISOString() }];
    setBadges(newBadges);
    localStorage.setItem('mindpeace-badges', JSON.stringify(newBadges));
  };

  const updateStreak = (newStreak) => {
    setStreak(newStreak);
    localStorage.setItem('mindpeace-streak', newStreak.toString());
  };

  return (
    <UserContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      points,
      streak,
      badges,
      login,
      logout,
      updateUser,
      addPoints,
      addBadge,
      updateStreak
    }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;