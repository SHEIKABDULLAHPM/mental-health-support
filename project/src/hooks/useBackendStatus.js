import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const CHECK_INTERVAL = 30000; // Check every 30 seconds

/**
 * Hook to monitor backend API health and connection status
 * @returns {Object} { isOnline, isChecking, lastCheck, checkHealth }
 */
export const useBackendStatus = () => {
  const [isOnline, setIsOnline] = useState(true); // Optimistic default
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [error, setError] = useState(null);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setIsOnline(data.status === 'healthy' || data.status === 'success');
        setLastCheck(new Date().toISOString());
      } else {
        setIsOnline(false);
        setError(`Server returned ${response.status}`);
      }
    } catch (err) {
      setIsOnline(false);
      if (err.name === 'AbortError') {
        setError('Connection timeout');
      } else {
        setError(err.message || 'Connection failed');
      }
      setLastCheck(new Date().toISOString());
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Initial health check
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Periodic health checks
  useEffect(() => {
    const interval = setInterval(() => {
      checkHealth();
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    isOnline,
    isChecking,
    lastCheck,
    error,
    checkHealth,
  };
};

export default useBackendStatus;
