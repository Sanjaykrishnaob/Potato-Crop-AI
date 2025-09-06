// Performance Optimization Service for Potato Crop AI

// Cache Management Service
class CacheService {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.maxCacheSize = 100;
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  set(key, data, ttl = this.defaultTTL) {
    // Implement LRU cache eviction
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.delete(oldestKey);
    }

    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now() + ttl);
    
    // Set expiration timer
    setTimeout(() => {
      this.delete(key);
    }, ttl);
  }

  get(key) {
    const timestamp = this.cacheTimestamps.get(key);
    
    // Check if expired
    if (!timestamp || Date.now() > timestamp) {
      this.delete(key);
      return null;
    }

    const data = this.cache.get(key);
    
    // Move to end for LRU
    if (data) {
      this.cache.delete(key);
      this.cache.set(key, data);
    }
    
    return data;
  }

  delete(key) {
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
  }

  clear() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Image Optimization Service
class ImageOptimizationService {
  static async compressImage(file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  static async generateThumbnail(file, size = 200) {
    return this.compressImage(file, 0.6, size, size);
  }

  static lazyLoadImage(imgElement, src, placeholder = '/placeholder.jpg') {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = src;
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      });

      imgElement.src = placeholder;
      observer.observe(imgElement);
    } else {
      // Fallback for older browsers
      imgElement.src = src;
    }
  }
}

// Data Pagination and Virtual Scrolling
class DataPaginationService {
  constructor(pageSize = 20) {
    this.pageSize = pageSize;
    this.currentPage = 0;
    this.totalPages = 0;
    this.data = [];
    this.filteredData = [];
  }

  setData(data) {
    this.data = data;
    this.filteredData = data;
    this.totalPages = Math.ceil(data.length / this.pageSize);
    this.currentPage = 0;
  }

  filter(filterFn) {
    this.filteredData = this.data.filter(filterFn);
    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    this.currentPage = 0;
  }

  getPage(page = this.currentPage) {
    const start = page * this.pageSize;
    const end = start + this.pageSize;
    return {
      data: this.filteredData.slice(start, end),
      page,
      totalPages: this.totalPages,
      hasNext: page < this.totalPages - 1,
      hasPrev: page > 0
    };
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      return this.getPage();
    }
    return null;
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      return this.getPage();
    }
    return null;
  }
}

// Bundle Size Optimization
class BundleOptimizationService {
  static async loadComponent(componentPath) {
    try {
      const module = await import(componentPath);
      return module.default || module;
    } catch (error) {
      console.error(`Failed to load component: ${componentPath}`, error);
      return null;
    }
  }

  static preloadComponent(componentPath) {
    // Preload component without executing
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = componentPath;
    document.head.appendChild(link);
  }

  static async loadChunk(chunkName) {
    switch (chunkName) {
      case 'analytics':
        return import('../components/AdvancedVisualizations');
      case 'export':
        return import('../components/DataExportReporting');
      case 'mobile':
        return import('../components/MobileLayout');
      case 'auth':
        return import('../components/Authentication');
      default:
        throw new Error(`Unknown chunk: ${chunkName}`);
    }
  }
}

// Performance Monitoring
class PerformanceMonitorService {
  constructor() {
    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      memoryUsage: 0,
      bundleSize: 0
    };
    
    this.subscribers = [];
    this.startTime = performance.now();
    this.apiCallCount = 0;
    this.cacheHitCount = 0;
    this.cacheMissCount = 0;
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(callback => callback(this.metrics));
  }

  recordLoadTime() {
    const loadTime = performance.now() - this.startTime;
    this.updateMetric('loadTime', loadTime);
  }

  recordRenderTime(componentName, renderTime) {
    console.log(`${componentName} rendered in ${renderTime}ms`);
    this.updateMetric('renderTime', renderTime);
  }

  recordApiCall() {
    this.apiCallCount++;
    this.updateMetric('apiCalls', this.apiCallCount);
  }

  recordCacheHit() {
    this.cacheHitCount++;
    this.updateMetric('cacheHits', this.cacheHitCount);
  }

  recordCacheMiss() {
    this.cacheMissCount++;
    this.updateMetric('cacheMisses', this.cacheMissCount);
  }

  updateMemoryUsage() {
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / (1024 * 1024); // MB
      this.updateMetric('memoryUsage', memoryUsage);
    }
  }

  updateMetric(key, value) {
    this.metrics = {
      ...this.metrics,
      [key]: value
    };
    this.notify();
  }

  getMetrics() {
    return this.metrics;
  }

  getCacheEfficiency() {
    const total = this.cacheHitCount + this.cacheMissCount;
    return total > 0 ? (this.cacheHitCount / total) * 100 : 0;
  }

  generateReport() {
    const metrics = this.getMetrics();
    return {
      ...metrics,
      cacheEfficiency: this.getCacheEfficiency(),
      timestamp: new Date().toISOString()
    };
  }
}

// Resource Prefetching
class ResourcePrefetchingService {
  constructor() {
    this.prefetchQueue = [];
    this.prefetched = new Set();
  }

  prefetchRoute(route) {
    if (this.prefetched.has(route)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
    
    this.prefetched.add(route);
  }

  prefetchData(url, priority = 'low') {
    if (this.prefetched.has(url)) return;

    fetch(url, { 
      method: 'GET',
      priority: priority 
    }).then(response => {
      if (response.ok) {
        this.prefetched.add(url);
      }
    }).catch(error => {
      console.warn('Prefetch failed:', url, error);
    });
  }

  prefetchImages(imageUrls) {
    imageUrls.forEach(url => {
      if (!this.prefetched.has(url)) {
        const img = new Image();
        img.src = url;
        this.prefetched.add(url);
      }
    });
  }

  scheduleIdlePrefetch(fn) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(fn);
    } else {
      setTimeout(fn, 0);
    }
  }
}

// Web Workers for Heavy Computations
class WebWorkerService {
  constructor() {
    this.workers = new Map();
  }

  createWorker(workerScript) {
    const worker = new Worker(workerScript);
    const workerId = Date.now().toString();
    this.workers.set(workerId, worker);
    return { worker, workerId };
  }

  async runTask(taskName, data) {
    return new Promise((resolve, reject) => {
      const workerCode = this.getWorkerCode(taskName);
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      const { worker, workerId } = this.createWorker(workerUrl);
      
      worker.onmessage = (e) => {
        resolve(e.data);
        this.terminateWorker(workerId);
        URL.revokeObjectURL(workerUrl);
      };

      worker.onerror = (error) => {
        reject(error);
        this.terminateWorker(workerId);
        URL.revokeObjectURL(workerUrl);
      };

      worker.postMessage(data);
    });
  }

  getWorkerCode(taskName) {
    const workerScripts = {
      dataProcessing: `
        self.onmessage = function(e) {
          const { data, operation } = e.data;
          
          let result;
          switch(operation) {
            case 'aggregate':
              result = data.reduce((acc, item) => acc + item.value, 0);
              break;
            case 'filter':
              result = data.filter(item => item.health > 80);
              break;
            case 'sort':
              result = data.sort((a, b) => b.health - a.health);
              break;
            default:
              result = data;
          }
          
          self.postMessage(result);
        };
      `,
      imageProcessing: `
        self.onmessage = function(e) {
          const { imageData, filters } = e.data;
          
          // Simulate image processing
          const processedData = imageData.map(pixel => {
            return filters.brightness ? pixel * 1.2 : pixel;
          });
          
          self.postMessage(processedData);
        };
      `
    };

    return workerScripts[taskName] || workerScripts.dataProcessing;
  }

  terminateWorker(workerId) {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.terminate();
      this.workers.delete(workerId);
    }
  }

  terminateAllWorkers() {
    this.workers.forEach(worker => worker.terminate());
    this.workers.clear();
  }
}

// Main Performance Service
class PerformanceService {
  constructor() {
    this.cache = new CacheService();
    this.imageOptimization = new ImageOptimizationService();
    this.pagination = new DataPaginationService();
    this.bundleOptimization = new BundleOptimizationService();
    this.monitor = new PerformanceMonitorService();
    this.prefetch = new ResourcePrefetchingService();
    this.webWorker = new WebWorkerService();
    
    this.initialize();
  }

  initialize() {
    // Start performance monitoring
    this.monitor.recordLoadTime();
    
    // Monitor memory usage periodically
    setInterval(() => {
      this.monitor.updateMemoryUsage();
    }, 10000);

    // Prefetch critical resources
    this.prefetchCriticalResources();
  }

  prefetchCriticalResources() {
    // Prefetch important routes
    this.prefetch.scheduleIdlePrefetch(() => {
      this.prefetch.prefetchRoute('/dashboard');
      this.prefetch.prefetchRoute('/fields');
      this.prefetch.prefetchRoute('/analytics');
    });

    // Prefetch common images
    this.prefetch.prefetchImages([
      '/logo192.png',
      '/logo512.png',
      '/placeholder.jpg'
    ]);
  }

  // Enhanced API with caching
  async cachedApiCall(key, apiCall, ttl) {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached) {
      this.monitor.recordCacheHit();
      return cached;
    }

    // Make API call
    this.monitor.recordApiCall();
    this.monitor.recordCacheMiss();
    
    try {
      const result = await apiCall();
      this.cache.set(key, result, ttl);
      return result;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  // Heavy computation with web workers
  async processDataInWorker(data, operation = 'aggregate') {
    return this.webWorker.runTask('dataProcessing', { data, operation });
  }

  // Get performance metrics
  getPerformanceReport() {
    return {
      ...this.monitor.generateReport(),
      cacheStats: this.cache.getStats(),
      prefetchedResources: this.prefetch.prefetched.size
    };
  }

  // Cleanup
  cleanup() {
    this.cache.clear();
    this.webWorker.terminateAllWorkers();
  }
}

// Singleton instance
const performanceService = new PerformanceService();

export default performanceService;
export {
  CacheService,
  ImageOptimizationService,
  DataPaginationService,
  BundleOptimizationService,
  PerformanceMonitorService,
  ResourcePrefetchingService,
  WebWorkerService
};
