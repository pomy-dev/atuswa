import { useState, useEffect } from 'react';

export function useUserIP() {
  const [ip, setIp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setIp(data.ip);
      } catch (error) {
        setError(error);
        throw new Error(`Encountered error: ${error}`)
      } finally {
        setLoading(false);
      }
    };

    fetchIP();
  }, []);

  return { ip, loading, error };
}