import { useState, useEffect } from 'react';

export const useMapboxToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Use the public Mapbox token directly from environment variables
    // This is safe because Mapbox tokens starting with 'pk.' are publishable keys
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    
    if (mapboxToken) {
      setToken(mapboxToken);
      setError(null);
    } else {
      setError('Mapbox token not configured');
    }
    
    setLoading(false);
  }, []);

  return { token, loading, error };
};
