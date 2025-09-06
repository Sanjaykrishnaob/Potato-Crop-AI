import { useState, useEffect, useCallback, useRef } from 'react';

// Real-time data service using WebSocket and polling fallback
class RealTimeDataService {
  constructor() {
    this.wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';
    this.connection = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.subscribers = new Map();
    this.isConnected = false;
    this.pollingIntervals = new Map();
  }

  // Subscribe to real-time updates for a specific topic
  subscribe(topic, callback) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic).add(callback);

    // Try WebSocket connection first
    this.connectWebSocket();

    // Fallback to polling if WebSocket fails
    if (!this.isConnected) {
      this.startPolling(topic);
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(topic, callback);
    };
  }

  unsubscribe(topic, callback) {
    if (this.subscribers.has(topic)) {
      this.subscribers.get(topic).delete(callback);
      if (this.subscribers.get(topic).size === 0) {
        this.subscribers.delete(topic);
        this.stopPolling(topic);
      }
    }
  }

  // WebSocket connection management
  connectWebSocket() {
    if (this.connection && this.connection.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.connection = new WebSocket(this.wsUrl);

      this.connection.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Stop all polling when WebSocket connects
        this.pollingIntervals.forEach((_, topic) => {
          this.stopPolling(topic);
        });

        // Subscribe to all active topics
        this.subscribers.forEach((callbacks, topic) => {
          this.sendMessage({ type: 'subscribe', topic });
        });
      };

      this.connection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.connection.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.reconnectWebSocket();
      };

      this.connection.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.startPollingForAllTopics();
    }
  }

  reconnectWebSocket() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.log('Max reconnection attempts reached, falling back to polling');
      this.startPollingForAllTopics();
    }
  }

  sendMessage(message) {
    if (this.connection && this.connection.readyState === WebSocket.OPEN) {
      this.connection.send(JSON.stringify(message));
    }
  }

  handleMessage(data) {
    const { topic, payload } = data;
    if (this.subscribers.has(topic)) {
      this.subscribers.get(topic).forEach(callback => {
        callback(payload);
      });
    }
  }

  // Polling fallback mechanism
  startPolling(topic) {
    if (this.pollingIntervals.has(topic)) {
      return; // Already polling this topic
    }

    const interval = setInterval(async () => {
      try {
        const data = await this.fetchTopicData(topic);
        if (this.subscribers.has(topic)) {
          this.subscribers.get(topic).forEach(callback => {
            callback(data);
          });
        }
      } catch (error) {
        console.error(`Polling error for topic ${topic}:`, error);
      }
    }, this.getPollingInterval(topic));

    this.pollingIntervals.set(topic, interval);
  }

  stopPolling(topic) {
    if (this.pollingIntervals.has(topic)) {
      clearInterval(this.pollingIntervals.get(topic));
      this.pollingIntervals.delete(topic);
    }
  }

  startPollingForAllTopics() {
    this.subscribers.forEach((callbacks, topic) => {
      this.startPolling(topic);
    });
  }

  getPollingInterval(topic) {
    // Different polling intervals for different types of data
    switch (topic) {
      case 'field-health':
      case 'alerts':
        return 15000; // 15 seconds
      case 'weather':
        return 60000; // 1 minute
      case 'satellite-data':
        return 300000; // 5 minutes
      case 'recommendations':
        return 120000; // 2 minutes
      default:
        return 30000; // 30 seconds default
    }
  }

  async fetchTopicData(topic) {
    // Simulate API calls for different topics
    const apiEndpoints = {
      'field-health': '/api/real-time/field-health',
      'alerts': '/api/real-time/alerts',
      'weather': '/api/real-time/weather',
      'satellite-data': '/api/real-time/satellite',
      'recommendations': '/api/real-time/recommendations',
    };

    const endpoint = apiEndpoints[topic];
    if (!endpoint) {
      throw new Error(`Unknown topic: ${topic}`);
    }

    // For demo purposes, generate simulated data
    return this.generateSimulatedData(topic);
  }

  generateSimulatedData(topic) {
    const baseTime = Date.now();
    
    switch (topic) {
      case 'field-health':
        return {
          timestamp: baseTime,
          fields: [
            { 
              id: 'field-alpha', 
              health: 85 + Math.random() * 10, 
              ndvi: 0.65 + Math.random() * 0.1,
              temperature: 22 + Math.random() * 6,
              moisture: 45 + Math.random() * 20
            },
            { 
              id: 'field-beta', 
              health: 90 + Math.random() * 8, 
              ndvi: 0.70 + Math.random() * 0.1,
              temperature: 21 + Math.random() * 6,
              moisture: 50 + Math.random() * 15
            },
            { 
              id: 'field-gamma', 
              health: 75 + Math.random() * 15, 
              ndvi: 0.60 + Math.random() * 0.15,
              temperature: 23 + Math.random() * 5,
              moisture: 40 + Math.random() * 25
            }
          ]
        };

      case 'alerts':
        // Randomly generate alerts
        const alertTypes = ['info', 'warning', 'error'];
        const alertMessages = [
          'New satellite imagery available',
          'Nitrogen deficiency detected in Zone 2',
          'Optimal irrigation window detected',
          'Weather alert: Heavy rain expected',
          'Pest activity increased in eastern section'
        ];
        
        const shouldGenerateAlert = Math.random() < 0.3; // 30% chance
        return shouldGenerateAlert ? {
          timestamp: baseTime,
          alert: {
            id: `alert-${baseTime}`,
            type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
            message: alertMessages[Math.floor(Math.random() * alertMessages.length)],
            field: `field-${['alpha', 'beta', 'gamma'][Math.floor(Math.random() * 3)]}`,
            priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
          }
        } : null;

      case 'weather':
        return {
          timestamp: baseTime,
          current: {
            temperature: 22 + Math.random() * 8,
            humidity: 60 + Math.random() * 20,
            windSpeed: 5 + Math.random() * 10,
            precipitation: Math.random() * 2,
            pressure: 1010 + Math.random() * 20
          }
        };

      case 'satellite-data':
        return {
          timestamp: baseTime,
          imagery: {
            cloudCover: Math.random() * 30,
            resolution: '10m',
            captureTime: new Date(baseTime - Math.random() * 86400000).toISOString(),
            processingStatus: 'completed'
          }
        };

      case 'recommendations':
        const actions = [
          'Apply nitrogen fertilizer',
          'Increase irrigation',
          'Monitor for pests',
          'Harvest preparation',
          'Soil testing recommended'
        ];
        
        return {
          timestamp: baseTime,
          recommendation: {
            id: `rec-${baseTime}`,
            action: actions[Math.floor(Math.random() * actions.length)],
            field: `field-${['alpha', 'beta', 'gamma'][Math.floor(Math.random() * 3)]}`,
            priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
            expectedImpact: `+${5 + Math.random() * 15}% yield`,
            cost: `$${50 + Math.random() * 200}`
          }
        };

      default:
        return { timestamp: baseTime, data: null };
    }
  }

  disconnect() {
    if (this.connection) {
      this.connection.close();
    }
    
    this.pollingIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.pollingIntervals.clear();
    this.subscribers.clear();
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionType: this.isConnected ? 'websocket' : 'polling',
      subscriberCount: this.subscribers.size
    };
  }
}

// Create singleton instance
const realTimeService = new RealTimeDataService();

export default realTimeService;

// React hook for real-time data
export const useRealTimeData = (topic, enabled = true) => {
  const [data, setData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    connectionType: 'polling',
    subscriberCount: 0
  });

  const updateConnectionStatus = useCallback(() => {
    setConnectionStatus(realTimeService.getConnectionStatus());
  }, []);

  useEffect(() => {
    if (!enabled || !topic) return;

    const handleUpdate = (newData) => {
      if (newData) {
        setData(newData);
        setLastUpdate(new Date());
      }
    };

    const unsubscribe = realTimeService.subscribe(topic, handleUpdate);
    updateConnectionStatus();

    // Update connection status periodically
    const statusInterval = setInterval(updateConnectionStatus, 5000);

    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, [topic, enabled, updateConnectionStatus]);

  return {
    data,
    lastUpdate,
    connectionStatus,
    isConnected: connectionStatus.isConnected
  };
};

// React hook for multiple real-time topics
export const useMultipleRealTimeData = (topics, enabled = true) => {
  const [dataMap, setDataMap] = useState({});
  const [lastUpdateMap, setLastUpdateMap] = useState({});
  const unsubscribeRefs = useRef({});

  useEffect(() => {
    if (!enabled || !topics || topics.length === 0) {
      return;
    }

    // Subscribe to all topics
    topics.forEach(topic => {
      if (!unsubscribeRefs.current[topic]) {
        unsubscribeRefs.current[topic] = realTimeService.subscribe(topic, (newData) => {
          if (newData) {
            setDataMap(prev => ({ ...prev, [topic]: newData }));
            setLastUpdateMap(prev => ({ ...prev, [topic]: new Date() }));
          }
        });
      }
    });

    // Cleanup function
    return () => {
      Object.values(unsubscribeRefs.current).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      unsubscribeRefs.current = {};
    };
  }, [topics, enabled]);

  return {
    dataMap,
    lastUpdateMap,
    connectionStatus: realTimeService.getConnectionStatus()
  };
};
