// Performance optimization service for Google Earth Engine integration
// Provides caching, lazy loading, and efficient data processing

class GEEPerformanceOptimizer {
  constructor() {
    this.cache = new Map();
    this.requestQueue = [];
    this.isProcessing = false;
    this.batchSize = 5;
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    this.debounceTimeout = 500; // 500ms
    this.preloadDistance = 1000; // meters
    this.maxCacheSize = 100;
    
    // Performance metrics
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      errorRate: 0
    };

    this.setupPerformanceMonitoring();
  }

  /**
   * Setup performance monitoring and cleanup
   */
  setupPerformanceMonitoring() {
    // Cleanup old cache entries periodically
    setInterval(() => {
      this.cleanupCache();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Log performance metrics periodically
    setInterval(() => {
      this.logPerformanceMetrics();
    }, 60 * 1000); // Every minute

    // Monitor memory usage
    if (performance.memory) {
      setInterval(() => {
        this.monitorMemoryUsage();
      }, 30 * 1000); // Every 30 seconds
    }
  }

  /**
   * Optimized request handler with caching and batching
   */
  async optimizedRequest(requestType, params, priority = 'normal') {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(requestType, params);
      
      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        return cached;
      }

      this.metrics.cacheMisses++;

      // Add to request queue with priority
      const request = {
        type: requestType,
        params,
        priority,
        timestamp: Date.now(),
        cacheKey,
        resolve: null,
        reject: null
      };

      const promise = new Promise((resolve, reject) => {
        request.resolve = resolve;
        request.reject = reject;
      });

      this.addToQueue(request);
      
      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processQueue();
      }

      const result = await promise;
      
      // Update performance metrics
      const responseTime = Date.now() - startTime;
      this.updateResponseTime(responseTime);

      return result;

    } catch (error) {
      this.metrics.errorRate++;
      console.error('Optimized request failed:', error);
      throw error;
    }
  }

  /**
   * Intelligent caching with spatial and temporal awareness
   */
  smartCache(key, data, options = {}) {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      priority: options.priority || 'normal',
      spatial: options.coordinates || null,
      temporal: options.dateRange || null,
      size: this.estimateDataSize(data)
    };

    // Check if we need to make room in cache
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, cacheEntry);
  }

  /**
   * Spatial preloading for nearby areas
   */
  async preloadNearbyData(centerCoordinates, radius = 1000) {
    try {
      const nearbyPoints = this.generateNearbyPoints(centerCoordinates, radius);
      
      const preloadPromises = nearbyPoints.map(async (point) => {
        const params = { coordinates: point };
        const cacheKey = this.generateCacheKey('vegetation_indices', params);
        
        // Only preload if not already cached
        if (!this.hasValidCache(cacheKey)) {
          return this.optimizedRequest('vegetation_indices', params, 'low');
        }
      });

      // Execute preloading in background
      Promise.all(preloadPromises.filter(Boolean)).catch(err => {
        console.warn('Preloading failed:', err);
      });

    } catch (error) {
      console.warn('Error in spatial preloading:', error);
    }
  }

  /**
   * Debounced data loading for user interactions
   */
  debouncedLoad = this.debounce(async (requestType, params) => {
    return this.optimizedRequest(requestType, params, 'high');
  }, this.debounceTimeout);

  /**
   * Batch processing for multiple requests
   */
  async processBatch(requests) {
    const results = new Map();
    
    try {
      // Group requests by type for efficient processing
      const grouped = this.groupRequestsByType(requests);
      
      for (const [type, typeRequests] of grouped.entries()) {
        const batchResults = await this.processBatchByType(type, typeRequests);
        
        typeRequests.forEach((request, index) => {
          results.set(request.cacheKey, batchResults[index]);
        });
      }

      return results;

    } catch (error) {
      console.error('Batch processing failed:', error);
      throw error;
    }
  }

  /**
   * Adaptive quality based on connection and device
   */
  getAdaptiveQuality() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const memory = navigator.deviceMemory || 4; // Default to 4GB

    let quality = 'high';

    if (connection) {
      if (connection.effectiveType === '2g' || connection.downlink < 1) {
        quality = 'low';
      } else if (connection.effectiveType === '3g' || connection.downlink < 5) {
        quality = 'medium';
      }
    }

    // Adjust based on device memory
    if (memory < 2) {
      quality = quality === 'high' ? 'medium' : 'low';
    }

    return {
      quality,
      resolution: quality === 'high' ? 10 : quality === 'medium' ? 30 : 100, // meters
      timeRange: quality === 'high' ? 30 : quality === 'medium' ? 14 : 7, // days
      indices: quality === 'high' ? ['ndvi', 'ndre', 'evi', 'savi'] : 
               quality === 'medium' ? ['ndvi', 'ndre'] : ['ndvi']
    };
  }

  /**
   * Progressive data loading
   */
  async progressiveLoad(requestType, params, onProgress) {
    try {
      const quality = this.getAdaptiveQuality();
      
      // Start with low quality for immediate feedback
      if (onProgress) onProgress({ stage: 'loading_preview', progress: 25 });
      
      const lowQualityParams = {
        ...params,
        resolution: 100,
        indices: ['ndvi']
      };
      
      const preview = await this.optimizedRequest(requestType, lowQualityParams, 'high');
      if (onProgress) onProgress({ stage: 'preview_ready', progress: 50, data: preview });

      // Load medium quality if connection allows
      if (quality.quality !== 'low') {
        if (onProgress) onProgress({ stage: 'loading_detail', progress: 75 });
        
        const mediumQualityParams = {
          ...params,
          resolution: quality.resolution,
          indices: quality.indices
        };
        
        const detailed = await this.optimizedRequest(requestType, mediumQualityParams, 'medium');
        if (onProgress) onProgress({ stage: 'detail_ready', progress: 100, data: detailed });
        
        return detailed;
      }

      if (onProgress) onProgress({ stage: 'complete', progress: 100, data: preview });
      return preview;

    } catch (error) {
      console.error('Progressive loading failed:', error);
      throw error;
    }
  }

  /**
   * Memory-efficient data streaming
   */
  async streamLargeDataset(requestType, params, chunkSize = 10) {
    const chunks = this.splitIntoChunks(params, chunkSize);
    const results = [];

    for (let i = 0; i < chunks.length; i++) {
      try {
        const chunkResult = await this.optimizedRequest(requestType, chunks[i]);
        results.push(chunkResult);

        // Yield control to prevent blocking
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }

        // Optional: trigger garbage collection hint
        if (window.gc && i % 10 === 0) {
          window.gc();
        }

      } catch (error) {
        console.warn(`Chunk ${i} failed, continuing:`, error);
      }
    }

    return this.mergeChunkResults(results);
  }

  // === UTILITY METHODS ===

  generateCacheKey(requestType, params) {
    const key = JSON.stringify({ type: requestType, ...params });
    return btoa(key).substring(0, 50); // Base64 encode and truncate
  }

  getFromCache(key) {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    return entry.data;
  }

  hasValidCache(key) {
    const entry = this.cache.get(key);
    return entry && (Date.now() - entry.timestamp < this.cacheTimeout);
  }

  addToQueue(request) {
    // Insert based on priority
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const insertIndex = this.requestQueue.findIndex(
      req => priorityOrder[req.priority] > priorityOrder[request.priority]
    );
    
    if (insertIndex === -1) {
      this.requestQueue.push(request);
    } else {
      this.requestQueue.splice(insertIndex, 0, request);
    }
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;

    try {
      while (this.requestQueue.length > 0) {
        const batch = this.requestQueue.splice(0, this.batchSize);
        const results = await this.processBatch(batch);

        // Resolve all promises in the batch
        batch.forEach(request => {
          const result = results.get(request.cacheKey);
          if (result) {
            this.smartCache(request.cacheKey, result, {
              priority: request.priority,
              coordinates: request.params.coordinates
            });
            request.resolve(result);
          } else {
            request.reject(new Error('Batch processing failed'));
          }
        });

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Queue processing failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  groupRequestsByType(requests) {
    return requests.reduce((groups, request) => {
      if (!groups.has(request.type)) {
        groups.set(request.type, []);
      }
      groups.get(request.type).push(request);
      return groups;
    }, new Map());
  }

  async processBatchByType(type, requests) {
    // Simulate batch processing - in real implementation, 
    // this would make optimized Google Earth Engine batch requests
    const results = await Promise.all(
      requests.map(async (request) => {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        
        // Return simulated result based on request type
        return this.generateSimulatedResult(type, request.params);
      })
    );

    return results;
  }

  generateSimulatedResult(type, params) {
    switch (type) {
      case 'vegetation_indices':
        return {
          ndvi: 0.3 + Math.random() * 0.5,
          ndre: 0.2 + Math.random() * 0.4,
          evi: 0.2 + Math.random() * 0.4,
          savi: 0.25 + Math.random() * 0.35,
          timestamp: new Date().toISOString(),
          coordinates: params.coordinates
        };

      case 'crop_health':
        return {
          overallHealth: 60 + Math.random() * 40,
          growthStage: 'Vegetative Growth',
          stressIndicators: [],
          recommendations: [],
          timestamp: new Date().toISOString()
        };

      default:
        return { timestamp: new Date().toISOString(), data: 'simulated' };
    }
  }

  generateNearbyPoints(center, radius) {
    const points = [];
    const numPoints = 8;
    const angleStep = (2 * Math.PI) / numPoints;

    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep;
      const offsetLat = (radius / 111000) * Math.cos(angle); // Rough conversion
      const offsetLng = (radius / (111000 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle);

      points.push({
        lat: center.lat + offsetLat,
        lng: center.lng + offsetLng
      });
    }

    return points;
  }

  splitIntoChunks(params, chunkSize) {
    // Implementation depends on the specific data structure
    // For example, if processing multiple coordinates:
    if (params.coordinates && Array.isArray(params.coordinates)) {
      const chunks = [];
      for (let i = 0; i < params.coordinates.length; i += chunkSize) {
        chunks.push({
          ...params,
          coordinates: params.coordinates.slice(i, i + chunkSize)
        });
      }
      return chunks;
    }

    return [params]; // Single chunk if can't split
  }

  mergeChunkResults(results) {
    // Merge logic depends on data structure
    return results.reduce((merged, result) => {
      if (Array.isArray(result)) {
        return merged.concat(result);
      }
      return { ...merged, ...result };
    }, {});
  }

  cleanupCache() {
    const now = Date.now();
    const entriesToDelete = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTimeout) {
        entriesToDelete.push(key);
      }
    }

    entriesToDelete.forEach(key => this.cache.delete(key));
    
    console.log(`Cache cleanup: removed ${entriesToDelete.length} expired entries`);
  }

  evictLeastUsed() {
    // Find least recently used entry
    let lruKey = null;
    let oldestAccess = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess && entry.priority !== 'high') {
        oldestAccess = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  estimateDataSize(data) {
    // Rough estimation of data size in bytes
    return JSON.stringify(data).length * 2; // UTF-16 encoding
  }

  updateResponseTime(responseTime) {
    const alpha = 0.1; // Exponential smoothing factor
    this.metrics.avgResponseTime = this.metrics.avgResponseTime === 0 
      ? responseTime 
      : this.metrics.avgResponseTime * (1 - alpha) + responseTime * alpha;
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  logPerformanceMetrics() {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.cacheHits / this.metrics.totalRequests * 100).toFixed(2)
      : 0;

    console.log('GEE Performance Metrics:', {
      cacheHitRate: `${hitRate}%`,
      avgResponseTime: `${this.metrics.avgResponseTime.toFixed(2)}ms`,
      totalRequests: this.metrics.totalRequests,
      cacheSize: this.cache.size,
      errorRate: `${((this.metrics.errorRate / this.metrics.totalRequests) * 100).toFixed(2)}%`
    });
  }

  monitorMemoryUsage() {
    if (performance.memory) {
      const memory = performance.memory;
      const usage = {
        used: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
        total: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
        limit: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
      };

      // Warn if memory usage is high
      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (usagePercentage > 80) {
        console.warn('High memory usage detected:', usage);
        this.performMemoryOptimization();
      }
    }
  }

  performMemoryOptimization() {
    // Reduce cache size
    const targetSize = Math.floor(this.maxCacheSize * 0.7);
    while (this.cache.size > targetSize) {
      this.evictLeastUsed();
    }

    // Clear old metrics
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      errorRate: 0
    };

    console.log('Memory optimization performed');
  }

  // === PUBLIC API ===

  getPerformanceMetrics() {
    const hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.cacheHits / this.metrics.totalRequests * 100)
      : 0;

    return {
      ...this.metrics,
      cacheHitRate: hitRate,
      cacheSize: this.cache.size,
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing
    };
  }

  clearCache() {
    this.cache.clear();
    console.log('Cache cleared');
  }

  setCacheTimeout(timeout) {
    this.cacheTimeout = timeout;
  }

  setBatchSize(size) {
    this.batchSize = Math.max(1, Math.min(10, size));
  }
}

// Create singleton instance
const geeOptimizer = new GEEPerformanceOptimizer();

export default geeOptimizer;
export { GEEPerformanceOptimizer };
