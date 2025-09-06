// Real-time Satellite Data Processing Service
// Integrates Google Earth Engine with agricultural monitoring systems

import geeService from './googleEarthEngineService';
import { getRealTimeHealthData } from './realtimeHealthService';

class RealTimeSatelliteProcessor {
  constructor() {
    this.processingQueue = [];
    this.isProcessing = false;
    this.updateInterval = 15 * 60 * 1000; // 15 minutes
    this.lastUpdate = new Map();
    this.subscribers = new Map();
    
    // Agricultural field coordinates (can be configured)
    this.monitoredFields = [
      {
        id: 'field-001',
        name: 'North Field',
        coordinates: { lat: 28.7041, lng: 77.1025 },
        crop: 'potato',
        area: 5.2 // hectares
      },
      {
        id: 'field-002', 
        name: 'South Field',
        coordinates: { lat: 28.6941, lng: 77.1125 },
        crop: 'potato',
        area: 3.8
      },
      {
        id: 'field-003',
        name: 'East Field', 
        coordinates: { lat: 28.7141, lng: 77.1225 },
        crop: 'potato',
        area: 4.5
      }
    ];

    this.initializeProcessing();
  }

  /**
   * Initialize the real-time processing system
   */
  async initializeProcessing() {
    try {
      console.log('Initializing Real-time Satellite Processing...');
      
      // Initialize Google Earth Engine
      const geeStatus = await geeService.initialize();
      console.log('Google Earth Engine status:', geeStatus);

      // Start periodic processing
      this.startPeriodicProcessing();

      // Process initial data for all fields
      await this.processAllFields();

      console.log('Real-time satellite processing initialized successfully');

    } catch (error) {
      console.error('Failed to initialize satellite processing:', error);
    }
  }

  /**
   * Start periodic processing of satellite data
   */
  startPeriodicProcessing() {
    setInterval(async () => {
      if (!this.isProcessing) {
        await this.processAllFields();
      }
    }, this.updateInterval);
  }

  /**
   * Process satellite data for all monitored fields
   */
  async processAllFields() {
    this.isProcessing = true;
    
    try {
      console.log('Processing satellite data for all fields...');
      
      const results = await Promise.all(
        this.monitoredFields.map(field => this.processFieldData(field))
      );

      // Combine results and notify subscribers
      const combinedData = {
        timestamp: new Date().toISOString(),
        fields: results.filter(result => result !== null),
        totalFields: this.monitoredFields.length,
        dataSource: 'google_earth_engine',
        processingMode: geeService.apiKey ? 'live' : 'simulation'
      };

      this.notifySubscribers('field-update', combinedData);
      
      console.log(`Processed ${results.length} fields successfully`);

    } catch (error) {
      console.error('Error processing all fields:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process satellite data for a specific field
   */
  async processFieldData(field) {
    try {
      const fieldKey = `${field.id}_${field.coordinates.lat}_${field.coordinates.lng}`;
      
      // Check if we've updated this field recently
      const lastUpdate = this.lastUpdate.get(fieldKey);
      const now = Date.now();
      
      if (lastUpdate && (now - lastUpdate) < this.updateInterval) {
        return null; // Skip if recently updated
      }

      console.log(`Processing field: ${field.name}`);

      // Get crop health data from Google Earth Engine
      const cropHealth = await geeService.getPotatoCropHealth(field.coordinates);
      
      // Get vegetation indices
      const indices = await geeService.calculateVegetationIndices(field.coordinates);
      
      // Get environmental data
      const environmental = await geeService.getEnvironmentalData(field.coordinates);

      // Combine and enhance data
      const processedData = {
        id: field.id,
        name: field.name,
        coordinates: field.coordinates,
        area: field.area,
        crop: field.crop,
        
        // Health metrics
        health: cropHealth.overallHealth,
        growthStage: cropHealth.growthStage,
        
        // Vegetation indices
        ndvi: Math.round(indices.ndvi * 1000) / 1000,
        ndre: Math.round(indices.ndre * 1000) / 1000,
        evi: Math.round(indices.evi * 1000) / 1000,
        savi: Math.round(indices.savi * 1000) / 1000,
        
        // Environmental conditions
        temperature: environmental.temperature.current,
        soilMoisture: environmental.soilMoisture.level,
        precipitation: environmental.precipitation.daily,
        
        // Analysis results
        stressIndicators: cropHealth.stressIndicators,
        recommendations: cropHealth.recommendations,
        waterStress: cropHealth.waterStress,
        nutrientStatus: cropHealth.nutrientStatus,
        diseaseRisk: cropHealth.diseaseRisk,
        harvestReadiness: cropHealth.harvestReadiness,
        
        // Data quality
        cloudCover: indices.cloudCover,
        dataFreshness: cropHealth.dataQuality.dataFreshness,
        lastUpdated: new Date().toISOString(),
        
        // Metadata
        satellitePass: indices.timestamp,
        processingTime: new Date().toISOString()
      };

      // Update last processed time
      this.lastUpdate.set(fieldKey, now);

      return processedData;

    } catch (error) {
      console.error(`Error processing field ${field.name}:`, error);
      
      // Return fallback data
      return {
        id: field.id,
        name: field.name,
        coordinates: field.coordinates,
        health: 75 + Math.random() * 20,
        ndvi: 0.5 + Math.random() * 0.3,
        ndre: 0.3 + Math.random() * 0.2,
        error: error.message,
        lastUpdated: new Date().toISOString(),
        dataSource: 'fallback'
      };
    }
  }

  /**
   * Get time series analysis for a specific field
   */
  async getFieldTimeSeries(fieldId, days = 30) {
    try {
      const field = this.monitoredFields.find(f => f.id === fieldId);
      if (!field) {
        throw new Error(`Field ${fieldId} not found`);
      }

      const timeSeries = await geeService.getTimeSeriesData(field.coordinates, days);
      
      return {
        fieldId: fieldId,
        fieldName: field.name,
        timeSeries: timeSeries,
        metadata: {
          days: days,
          dataPoints: timeSeries.length,
          generated: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error(`Error getting time series for field ${fieldId}:`, error);
      throw error;
    }
  }

  /**
   * Analyze crop development trends
   */
  async analyzeCropTrends(fieldId, days = 14) {
    try {
      const timeSeries = await this.getFieldTimeSeries(fieldId, days);
      const data = timeSeries.timeSeries;

      if (data.length < 2) {
        return { trend: 'insufficient_data', confidence: 0 };
      }

      // Calculate trends
      const ndviTrend = this.calculateTrend(data.map(d => d.ndvi));
      const healthTrend = this.calculateTrend(data.map(d => d.health));
      
      // Determine overall trend
      let overallTrend = 'stable';
      let confidence = 0.5;

      if (ndviTrend.slope > 0.01 && healthTrend.slope > 1) {
        overallTrend = 'improving';
        confidence = Math.min(ndviTrend.confidence, healthTrend.confidence);
      } else if (ndviTrend.slope < -0.01 && healthTrend.slope < -1) {
        overallTrend = 'declining';
        confidence = Math.min(ndviTrend.confidence, healthTrend.confidence);
      }

      return {
        fieldId: fieldId,
        trend: overallTrend,
        confidence: confidence,
        details: {
          ndvi: ndviTrend,
          health: healthTrend
        },
        recommendation: this.generateTrendRecommendation(overallTrend, confidence),
        analyzedPeriod: days,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Error analyzing trends for field ${fieldId}:`, error);
      throw error;
    }
  }

  /**
   * Get comparative analysis between fields
   */
  async getComparativeAnalysis() {
    try {
      const fieldAnalyses = await Promise.all(
        this.monitoredFields.map(async field => {
          const data = await this.processFieldData(field);
          const trends = await this.analyzeCropTrends(field.id, 14);
          
          return {
            ...data,
            trends: trends
          };
        })
      );

      // Calculate comparative metrics
      const avgHealth = fieldAnalyses.reduce((sum, field) => sum + field.health, 0) / fieldAnalyses.length;
      const avgNDVI = fieldAnalyses.reduce((sum, field) => sum + field.ndvi, 0) / fieldAnalyses.length;
      
      const bestPerforming = fieldAnalyses.reduce((best, current) => 
        current.health > best.health ? current : best
      );
      
      const needsAttention = fieldAnalyses.filter(field => 
        field.health < avgHealth * 0.8 || field.stressIndicators.length > 0
      );

      return {
        summary: {
          totalFields: fieldAnalyses.length,
          averageHealth: Math.round(avgHealth),
          averageNDVI: Math.round(avgNDVI * 1000) / 1000,
          bestPerforming: bestPerforming.name,
          fieldsNeedingAttention: needsAttention.length
        },
        fields: fieldAnalyses,
        needsAttention: needsAttention,
        recommendations: this.generateFleetRecommendations(fieldAnalyses),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error in comparative analysis:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(topic, callback) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic).add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(topic)?.delete(callback);
    };
  }

  /**
   * Notify subscribers of updates
   */
  notifySubscribers(topic, data) {
    const callbacks = this.subscribers.get(topic);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
  }

  /**
   * Get current status of all monitored fields
   */
  async getCurrentStatus() {
    try {
      const results = await Promise.all(
        this.monitoredFields.map(field => this.processFieldData(field))
      );

      return {
        timestamp: new Date().toISOString(),
        fields: results.filter(result => result !== null),
        systemStatus: {
          isProcessing: this.isProcessing,
          lastUpdate: Math.max(...Array.from(this.lastUpdate.values())),
          queueLength: this.processingQueue.length,
          updateInterval: this.updateInterval / 1000 / 60 // minutes
        }
      };

    } catch (error) {
      console.error('Error getting current status:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time satellite data updates for specified fields
   */
  async subscribeToRealTimeData(fields, callback) {
    try {
      console.log('Setting up real-time satellite data subscription...');
      
      // Initialize processing status
      let fieldsProcessed = 0;
      const totalFields = fields.length;
      
      // Process each field and update status
      for (const field of fields) {
        try {
          await this.processFieldData(field);
          fieldsProcessed++;
          
          // Call callback with current status
          if (callback) {
            callback({
              processing: fieldsProcessed < totalFields,
              fieldsProcessed,
              totalFields,
              lastUpdate: new Date()
            });
          }
          
          // Add small delay to simulate processing
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Error processing field ${field.id}:`, error);
        }
      }
      
      // Set up periodic updates
      const updateInterval = setInterval(async () => {
        try {
          const status = await this.getCurrentStatus();
          if (callback) {
            callback({
              processing: status.systemStatus.isProcessing,
              fieldsProcessed: status.fields.length,
              totalFields: this.monitoredFields.length,
              lastUpdate: new Date()
            });
          }
        } catch (error) {
          console.error('Error in periodic update:', error);
        }
      }, 30000); // Update every 30 seconds
      
      console.log('Real-time satellite data subscription established');
      return updateInterval;
      
    } catch (error) {
      console.error('Failed to subscribe to real-time data:', error);
      throw error;
    }
  }

  // === UTILITY METHODS ===

  calculateTrend(values) {
    if (values.length < 2) return { slope: 0, confidence: 0 };

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Calculate R-squared for confidence
    const meanY = sumY / n;
    const totalSumSquares = values.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
    const residualSumSquares = values.reduce((sum, yi, i) => {
      const predicted = slope * i + (sumY - slope * sumX) / n;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    
    return {
      slope: slope,
      confidence: Math.max(0, Math.min(1, rSquared))
    };
  }

  generateTrendRecommendation(trend, confidence) {
    if (confidence < 0.5) {
      return 'Continue monitoring - insufficient data for reliable trend analysis';
    }

    switch (trend) {
      case 'improving':
        return 'Crop is developing well. Maintain current management practices.';
      case 'declining':
        return 'Crop health is declining. Consider immediate intervention - check irrigation, nutrition, and pest status.';
      case 'stable':
        return 'Crop development is stable. Continue regular monitoring.';
      default:
        return 'Monitor crop development and adjust management as needed.';
    }
  }

  generateFleetRecommendations(fieldAnalyses) {
    const recommendations = [];
    
    // Check for common issues across fields
    const lowNDVIFields = fieldAnalyses.filter(f => f.ndvi < 0.5);
    if (lowNDVIFields.length > 0) {
      recommendations.push({
        category: 'nutrition',
        priority: 'high',
        message: `${lowNDVIFields.length} field(s) showing low vegetation vigor - consider nitrogen application`,
        affectedFields: lowNDVIFields.map(f => f.name)
      });
    }

    // Check for water stress
    const waterStressFields = fieldAnalyses.filter(f => f.waterStress?.level === 'high');
    if (waterStressFields.length > 0) {
      recommendations.push({
        category: 'irrigation',
        priority: 'high',
        message: `${waterStressFields.length} field(s) showing water stress - increase irrigation`,
        affectedFields: waterStressFields.map(f => f.name)
      });
    }

    // Check for disease risk
    const diseaseRiskFields = fieldAnalyses.filter(f => f.diseaseRisk?.level === 'high');
    if (diseaseRiskFields.length > 0) {
      recommendations.push({
        category: 'disease_management',
        priority: 'medium',
        message: `${diseaseRiskFields.length} field(s) at high disease risk - increase monitoring`,
        affectedFields: diseaseRiskFields.map(f => f.name)
      });
    }

    return recommendations;
  }

  /**
   * Add a new field for monitoring
   */
  addField(field) {
    const newField = {
      id: field.id || `field-${Date.now()}`,
      name: field.name,
      coordinates: field.coordinates,
      crop: field.crop || 'potato',
      area: field.area || 1
    };

    this.monitoredFields.push(newField);
    
    // Process immediately
    this.processFieldData(newField);

    return newField;
  }

  /**
   * Remove a field from monitoring
   */
  removeField(fieldId) {
    const index = this.monitoredFields.findIndex(f => f.id === fieldId);
    if (index > -1) {
      this.monitoredFields.splice(index, 1);
      this.lastUpdate.delete(fieldId);
      return true;
    }
    return false;
  }

  /**
   * Get monitored fields list
   */
  getMonitoredFields() {
    return this.monitoredFields.map(field => ({
      ...field,
      lastUpdate: this.lastUpdate.get(`${field.id}_${field.coordinates.lat}_${field.coordinates.lng}`)
    }));
  }
}

// Create singleton instance
const satelliteProcessor = new RealTimeSatelliteProcessor();

export default satelliteProcessor;

// Export class for creating additional instances if needed
export { RealTimeSatelliteProcessor };
