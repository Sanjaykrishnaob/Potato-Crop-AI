import axios from 'axios';
import performanceService from './performanceService';
import weatherService from './weatherService';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000; // 30 seconds

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Record API call for performance monitoring
    performanceService.monitor.recordApiCall();
    
    // Add timestamp for response time calculation
    config.metadata = { startTime: Date.now() };
    
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Calculate response time
    const responseTime = Date.now() - response.config.metadata.startTime;
    console.log(`API Response Time: ${responseTime}ms for ${response.config.url}`);
    
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service classes
export class SatelliteDataService {
  static async getFieldData(fieldId, dateRange = null) {
    const cacheKey = `field-data-${fieldId}-${JSON.stringify(dateRange)}`;
    
    // Try to get cached data first
    return performanceService.cachedApiCall(
      cacheKey,
      async () => {
        const params = dateRange ? { start_date: dateRange.start, end_date: dateRange.end } : {};
        const response = await apiClient.get(`/api/satellite/field/${fieldId}`, { params });
        return response.data;
      },
      5 * 60 * 1000 // 5 minutes cache
    );
  }

  static async getVegetationIndices(fieldId) {
    const cacheKey = `vegetation-indices-${fieldId}`;
    
    return performanceService.cachedApiCall(
      cacheKey,
      async () => {
        const response = await apiClient.get(`/api/satellite/vegetation-indices/${fieldId}`);
        return response.data;
      },
      10 * 60 * 1000 // 10 minutes cache
    );
  }

  static async getFieldZones(fieldId) {
    try {
      const response = await apiClient.get(`/api/satellite/zones/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching field zones:', error);
      throw new Error('Failed to fetch field zones');
    }
  }

  static async requestNewImagery(fieldId, date = null) {
    try {
      const response = await apiClient.post(`/api/satellite/request-imagery`, {
        field_id: fieldId,
        date: date || new Date().toISOString().split('T')[0]
      });
      return response.data;
    } catch (error) {
      console.error('Error requesting new imagery:', error);
      throw new Error('Failed to request new imagery');
    }
  }
}

export class MLPredictionService {
  static async getGrowthStageClassification(fieldId) {
    try {
      const response = await apiClient.get(`/api/ml/growth-stage/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching growth stage:', error);
      throw new Error('Failed to get growth stage classification');
    }
  }

  static async getNutrientPrediction(fieldId) {
    try {
      const response = await apiClient.get(`/api/ml/nutrient-prediction/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching nutrient prediction:', error);
      throw new Error('Failed to get nutrient prediction');
    }
  }

  static async getYieldForecast(fieldId) {
    try {
      const response = await apiClient.get(`/api/ml/yield-forecast/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching yield forecast:', error);
      throw new Error('Failed to get yield forecast');
    }
  }

  static async getHealthScore(fieldId) {
    try {
      const response = await apiClient.get(`/api/ml/health-score/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching health score:', error);
      throw new Error('Failed to get health score');
    }
  }

  static async runFullAnalysis(fieldId) {
    try {
      const response = await apiClient.post(`/api/ml/full-analysis`, { field_id: fieldId });
      return response.data;
    } catch (error) {
      console.error('Error running full analysis:', error);
      throw new Error('Failed to run full analysis');
    }
  }
}

export class RecommendationService {
  static async getRecommendations(fieldId) {
    try {
      const response = await apiClient.get(`/api/recommendations/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw new Error('Failed to get recommendations');
    }
  }

  static async getZoneRecommendations(fieldId, zoneId) {
    try {
      const response = await apiClient.get(`/api/recommendations/${fieldId}/zone/${zoneId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching zone recommendations:', error);
      throw new Error('Failed to get zone recommendations');
    }
  }

  static async applyRecommendation(recommendationId, applicationData) {
    try {
      const response = await apiClient.post(`/api/recommendations/${recommendationId}/apply`, applicationData);
      return response.data;
    } catch (error) {
      console.error('Error applying recommendation:', error);
      throw new Error('Failed to apply recommendation');
    }
  }

  static async getROIAnalysis(fieldId) {
    try {
      const response = await apiClient.get(`/api/recommendations/roi-analysis/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ROI analysis:', error);
      throw new Error('Failed to get ROI analysis');
    }
  }
}

export class FieldManagementService {
  static async getAllFields() {
    try {
      const response = await apiClient.get('/api/fields');
      return response.data;
    } catch (error) {
      console.error('Error fetching fields:', error);
      throw new Error('Failed to fetch fields');
    }
  }

  static async getFieldDetails(fieldId) {
    try {
      const response = await apiClient.get(`/api/fields/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching field details:', error);
      throw new Error('Failed to fetch field details');
    }
  }

  static async createField(fieldData) {
    try {
      const response = await apiClient.post('/api/fields', fieldData);
      return response.data;
    } catch (error) {
      console.error('Error creating field:', error);
      throw new Error('Failed to create field');
    }
  }

  static async updateField(fieldId, fieldData) {
    try {
      const response = await apiClient.put(`/api/fields/${fieldId}`, fieldData);
      return response.data;
    } catch (error) {
      console.error('Error updating field:', error);
      throw new Error('Failed to update field');
    }
  }

  static async deleteField(fieldId) {
    try {
      const response = await apiClient.delete(`/api/fields/${fieldId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting field:', error);
      throw new Error('Failed to delete field');
    }
  }
}

export class AlertService {
  static async getAlerts(fieldId = null) {
    try {
      const params = fieldId ? { field_id: fieldId } : {};
      const response = await apiClient.get('/api/alerts', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw new Error('Failed to fetch alerts');
    }
  }

  static async markAlertAsRead(alertId) {
    try {
      const response = await apiClient.patch(`/api/alerts/${alertId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw new Error('Failed to mark alert as read');
    }
  }

  static async createCustomAlert(alertData) {
    try {
      const response = await apiClient.post('/api/alerts', alertData);
      return response.data;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw new Error('Failed to create alert');
    }
  }
}

export class WeatherService {
  static async getCurrentWeather(fieldId) {
    try {
      // Try to get field coordinates first
      let coordinates;
      if (fieldId && fieldId !== 'default') {
        try {
          const fieldData = await FieldManagementService.getFieldDetails(fieldId);
          coordinates = { lat: fieldData.location[0], lng: fieldData.location[1] };
        } catch (error) {
          console.warn('Could not get field coordinates, using default');
        }
      }
      
      // Use real weather service
      const weatherData = await weatherService.getCurrentWeather(coordinates);
      
      // Add agricultural insights
      const insights = weatherService.getAgriculturalInsights(weatherData);
      
      return {
        ...weatherData,
        insights
      };
    } catch (error) {
      console.error('Error fetching current weather:', error);
      throw new Error('Failed to fetch current weather');
    }
  }

  static async getWeatherForecast(fieldId, days = 7) {
    try {
      let coordinates;
      if (fieldId && fieldId !== 'default') {
        try {
          const fieldData = await FieldManagementService.getFieldDetails(fieldId);
          coordinates = { lat: fieldData.location[0], lng: fieldData.location[1] };
        } catch (error) {
          console.warn('Could not get field coordinates, using default');
        }
      }
      
      const forecastData = await weatherService.getWeatherForecast(coordinates, days);
      
      return forecastData;
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      throw new Error('Failed to fetch weather forecast');
    }
  }

  static async getHistoricalWeather(fieldId, startDate, endDate) {
    try {
      // For now, this would require a different API call or database
      // Fallback to generating mock historical data
      const response = await apiClient.get(`/api/weather/historical/${fieldId}`, {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching historical weather:', error);
      throw new Error('Failed to fetch historical weather');
    }
  }
}

export class AnalyticsService {
  static async getPerformanceMetrics(fieldId, timeRange = '30d') {
    try {
      const response = await apiClient.get(`/api/analytics/performance/${fieldId}`, {
        params: { time_range: timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw new Error('Failed to fetch performance metrics');
    }
  }

  static async getTrendAnalysis(fieldId, metric, timeRange = '90d') {
    try {
      const response = await apiClient.get(`/api/analytics/trends/${fieldId}`, {
        params: { metric, time_range: timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching trend analysis:', error);
      throw new Error('Failed to fetch trend analysis');
    }
  }

  static async getComparativeAnalysis(fieldIds, metric) {
    try {
      const response = await apiClient.post('/api/analytics/compare', {
        field_ids: fieldIds,
        metric
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching comparative analysis:', error);
      throw new Error('Failed to fetch comparative analysis');
    }
  }

  static async exportReport(fieldId, reportType, format = 'pdf') {
    try {
      const response = await apiClient.get(`/api/analytics/export/${fieldId}`, {
        params: { report_type: reportType, format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting report:', error);
      throw new Error('Failed to export report');
    }
  }
}

// Utility functions for API calls
export const withFallback = async (apiCall, fallbackData = null) => {
  try {
    return await apiCall();
  } catch (error) {
    console.warn('API call failed, using fallback data:', error.message);
    return fallbackData;
  }
};

export const batchRequests = async (requests) => {
  try {
    const results = await Promise.allSettled(requests);
    return results.map((result, index) => ({
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null,
      index
    }));
  } catch (error) {
    console.error('Batch request error:', error);
    throw error;
  }
};

// Export default API client for custom requests
export default apiClient;
