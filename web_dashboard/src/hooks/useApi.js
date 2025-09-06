import { useState, useEffect, useCallback } from 'react';
import { 
  SatelliteDataService, 
  MLPredictionService, 
  RecommendationService,
  FieldManagementService,
  AlertService,
  WeatherService,
  AnalyticsService,
  withFallback
} from '../services/api';
import { getRealTimeHealthData } from '../services/realtimeHealthService';
import { demoData } from '../utils/demoData';

// Custom hook for API data fetching with loading and error states
export const useApiData = (apiCall, dependencies = [], fallbackData = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await withFallback(apiCall, fallbackData);
      setData(result);
    } catch (err) {
      setError(err.message);
      setData(fallbackData);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

// Hook for field data management
export const useFieldData = (fieldId) => {
  const [fieldData, setFieldData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFieldData = useCallback(async () => {
    if (!fieldId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch all field-related data in parallel
      const [
        fieldDetails,
        satelliteData,
        vegetationIndices,
        growthStage,
        nutrientPrediction,
        yieldForecast,
        recommendations,
        weather
      ] = await Promise.allSettled([
        withFallback(() => FieldManagementService.getFieldDetails(fieldId), demoData.fields.find(f => f.id === fieldId)),
        withFallback(() => SatelliteDataService.getFieldData(fieldId), null),
        withFallback(() => SatelliteDataService.getVegetationIndices(fieldId), null),
        withFallback(() => MLPredictionService.getGrowthStageClassification(fieldId), null),
        withFallback(() => MLPredictionService.getNutrientPrediction(fieldId), null),
        withFallback(() => MLPredictionService.getYieldForecast(fieldId), null),
        withFallback(() => RecommendationService.getRecommendations(fieldId), demoData.recommendations),
        withFallback(() => WeatherService.getCurrentWeather(fieldId), demoData.weather)
      ]);

      setFieldData({
        details: fieldDetails.status === 'fulfilled' ? fieldDetails.value : null,
        satellite: satelliteData.status === 'fulfilled' ? satelliteData.value : null,
        vegetation: vegetationIndices.status === 'fulfilled' ? vegetationIndices.value : null,
        growthStage: growthStage.status === 'fulfilled' ? growthStage.value : null,
        nutrients: nutrientPrediction.status === 'fulfilled' ? nutrientPrediction.value : null,
        yield: yieldForecast.status === 'fulfilled' ? yieldForecast.value : null,
        recommendations: recommendations.status === 'fulfilled' ? recommendations.value : null,
        weather: weather.status === 'fulfilled' ? weather.value : null
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fieldId]);

  useEffect(() => {
    fetchFieldData();
  }, [fetchFieldData]);

  return { fieldData, loading, error, refetch: fetchFieldData };
};

// Hook for dashboard summary data
export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard summary data
      const [
        fields,
        alerts,
        weather
      ] = await Promise.allSettled([
        withFallback(() => FieldManagementService.getAllFields(), demoData.fields),
        withFallback(() => AlertService.getAlerts(), demoData.alerts),
        withFallback(() => WeatherService.getCurrentWeather('default'), demoData.weather)
      ]);

      // Calculate summary metrics
      const fieldsData = fields.status === 'fulfilled' ? fields.value : demoData.fields;
      const alertsData = alerts.status === 'fulfilled' ? alerts.value : demoData.alerts;
      
      const summary = {
        totalFields: fieldsData.length,
        totalArea: fieldsData.reduce((sum, field) => sum + field.area, 0),
        avgHealth: fieldsData.reduce((sum, field) => sum + field.health, 0) / fieldsData.length,
        totalAlerts: alertsData.filter(alert => alert.priority === 'High').length,
        avgYield: fieldsData.reduce((sum, field) => sum + field.predictedYield, 0) / fieldsData.length
      };

      setDashboardData({
        fields: fieldsData,
        alerts: alertsData,
        weather: weather.status === 'fulfilled' ? weather.value : demoData.weather,
        summary
      });
    } catch (err) {
      setError(err.message);
      // Fallback to demo data
      setDashboardData({
        fields: demoData.fields,
        alerts: demoData.alerts,
        weather: demoData.weather,
        summary: {
          totalFields: demoData.fields.length,
          totalArea: demoData.fields.reduce((sum, field) => sum + field.area, 0),
          avgHealth: demoData.fields.reduce((sum, field) => sum + field.health, 0) / demoData.fields.length,
          totalAlerts: demoData.alerts.filter(alert => alert.priority === 'High').length,
          avgYield: demoData.fields.reduce((sum, field) => sum + field.predictedYield, 0) / demoData.fields.length
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { dashboardData, loading, error, refetch: fetchDashboardData };
};

// Hook for analytics data
export const useAnalyticsData = (fieldId, timeRange = '30d') => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        performance,
        ndviTrends,
        yieldTrends
      ] = await Promise.allSettled([
        withFallback(() => AnalyticsService.getPerformanceMetrics(fieldId, timeRange), null),
        withFallback(() => AnalyticsService.getTrendAnalysis(fieldId, 'ndvi', timeRange), null),
        withFallback(() => AnalyticsService.getTrendAnalysis(fieldId, 'yield', timeRange), null)
      ]);

      setAnalyticsData({
        performance: performance.status === 'fulfilled' ? performance.value : null,
        ndviTrends: ndviTrends.status === 'fulfilled' ? ndviTrends.value : null,
        yieldTrends: yieldTrends.status === 'fulfilled' ? yieldTrends.value : null
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fieldId, timeRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  return { analyticsData, loading, error, refetch: fetchAnalyticsData };
};

// Hook for real-time health data
export const useRealTimeHealth = (interval = 15000) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);

  const fetchHealthData = useCallback(async () => {
    try {
      setError(null);
      
      // Use the real-time health service
      const data = await getRealTimeHealthData();
      setHealthData(data);
      setLastUpdate(new Date());
      setIsConnected(true);
      setLoading(false);
    } catch (err) {
      console.warn('Real-time health update failed:', err);
      setError(err.message);
      setIsConnected(false);
      
      // Fallback to demo data only if we don't have any data yet
      setHealthData(prevData => {
        if (!prevData) {
          const fallbackData = {
            fields: demoData.fields.map(field => ({
              id: field.id,
              name: field.name,
              health: field.health,
              ndvi: 0.65 + Math.random() * 0.25,
              ndre: 0.45 + Math.random() * 0.2,
              lastUpdated: new Date().toISOString()
            })),
            avgHealth: demoData.fields.reduce((sum, field) => sum + field.health, 0) / demoData.fields.length,
            lastUpdated: new Date().toISOString(),
            dataSource: 'fallback_demo'
          };
          return fallbackData;
        }
        return prevData;
      });
      
      setLoading(false);
    }
  }, []); // Remove dependencies that cause frequent recreations

  useEffect(() => {
    // Initial fetch
    fetchHealthData();

    // Set up interval for real-time updates only if interval > 0
    if (interval > 0) {
      const updateInterval = setInterval(fetchHealthData, interval);
      return () => clearInterval(updateInterval);
    }
  }, [interval]); // Only depend on interval, not fetchHealthData

  const refetch = useCallback(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  return { 
    healthData, 
    loading, 
    error, 
    lastUpdate, 
    isConnected, 
    refetch 
  };
};

// Hook for real-time updates
export const useRealTimeUpdates = (fieldId, interval = 15000) => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (!fieldId) return;

    const updateInterval = setInterval(async () => {
      try {
        // Check for new satellite data
        const healthData = await withFallback(
          () => MLPredictionService.getHealthScore(fieldId),
          null
        );
        
        if (healthData) {
          setLastUpdate(new Date());
          setIsConnected(true);
        }
      } catch (error) {
        console.warn('Real-time update failed:', error);
        setIsConnected(false);
      }
    }, interval);

    return () => clearInterval(updateInterval);
  }, [fieldId, interval]);

  return { lastUpdate, isConnected };
};

// Hook for notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date(),
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10
    
    // Auto-remove after 5 seconds if it's not persistent
    if (!notification.persistent) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return { 
    notifications, 
    addNotification, 
    removeNotification, 
    clearAll 
  };
};

// Hook for field operations
export const useFieldOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const applyRecommendation = useCallback(async (recommendationId, applicationData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await RecommendationService.applyRecommendation(recommendationId, applicationData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const requestNewImagery = useCallback(async (fieldId, date) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await SatelliteDataService.requestNewImagery(fieldId, date);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const runAnalysis = useCallback(async (fieldId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await MLPredictionService.runFullAnalysis(fieldId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { 
    loading, 
    error, 
    applyRecommendation, 
    requestNewImagery, 
    runAnalysis 
  };
};

// Export all hooks
export default {
  useApiData,
  useFieldData,
  useDashboardData,
  useAnalyticsData,
  useRealTimeHealth,
  useRealTimeUpdates,
  useNotifications,
  useFieldOperations
};
