// Hook to integrate free real-time data sources
import { useState, useEffect, useCallback } from 'react';
import { getAllFreeRealTimeData } from '../services/freeDataSources';

export const useFreeLiveData = (location = {lat: 12.9716, lng: 77.5946}, interval = 30000) => {
  const [data, setData] = useState({
    weather: null,
    agricultural: null,
    market: null,
    sensors: null,
    alerts: null,
    loading: true,
    error: null,
    lastUpdated: null,
    dataSources: []
  });

  const fetchData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      
      const liveData = await getAllFreeRealTimeData(location);
      
      setData({
        ...liveData,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching live data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch some live data sources'
      }));
    }
  }, [location]);

  useEffect(() => {
    fetchData();
    
    const intervalId = setInterval(fetchData, interval);
    
    return () => clearInterval(intervalId);
  }, [fetchData, interval]);

  return {
    ...data,
    refetch: fetchData
  };
};

// Hook for specific data types
export const useLiveWeatherData = (location, interval = 60000) => {
  const { weather, loading, error } = useFreeLiveData(location, interval);
  return { weather, loading, error };
};

export const useLiveMarketData = (interval = 300000) => { // 5 minutes
  const { market, loading, error } = useFreeLiveData(null, interval);
  return { market, loading, error };
};

export const useLiveSensorData = (interval = 15000) => { // 15 seconds
  const { sensors, loading, error } = useFreeLiveData(null, interval);
  return { sensors, loading, error };
};

export const useLiveAlerts = (interval = 120000) => { // 2 minutes
  const { alerts, loading, error } = useFreeLiveData(null, interval);
  return { alerts, loading, error };
};
