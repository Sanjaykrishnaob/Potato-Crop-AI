import { useState, useEffect, useCallback, useMemo } from 'react';
import performanceService from '../services/performanceService';

// Performance-optimized React hooks

// Debounced search hook
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Optimized pagination hook
export const usePagination = (data, pageSize = 20) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  const paginationService = useMemo(() => {
    const service = new performanceService.pagination.constructor(pageSize);
    service.setData(data);
    return service;
  }, [data, pageSize]);

  const currentPageData = useMemo(() => {
    return paginationService.getPage(currentPage);
  }, [paginationService, currentPage]);

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    const result = paginationService.nextPage();
    if (result) {
      setCurrentPage(paginationService.currentPage);
    }
  }, [paginationService]);

  const prevPage = useCallback(() => {
    const result = paginationService.prevPage();
    if (result) {
      setCurrentPage(paginationService.currentPage);
    }
  }, [paginationService]);

  return {
    currentPageData,
    currentPage,
    totalPages: paginationService.totalPages,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPageData.hasNext,
    hasPrev: currentPageData.hasPrev
  };
};

// Lazy loading hook with intersection observer
export const useLazyLoading = (callback, options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState(null);

  useEffect(() => {
    if (!element || !callback) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          callback();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, callback, options]);

  return [setElement, isIntersecting];
};

// Image optimization hook
export const useOptimizedImage = (src, options = {}) => {
  const [imageData, setImageData] = useState({
    src: null,
    loaded: false,
    error: false
  });

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    
    img.onload = () => {
      setImageData({
        src,
        loaded: true,
        error: false
      });
    };

    img.onerror = () => {
      setImageData({
        src: options.fallback || '/placeholder.jpg',
        loaded: true,
        error: true
      });
    };

    // Add lazy loading support
    if (options.lazy) {
      performanceService.imageOptimization.constructor.lazyLoadImage(img, src, options.placeholder);
    } else {
      img.src = src;
    }

  }, [src, options.fallback, options.placeholder, options.lazy]);

  return imageData;
};

// Cache management hook
export const useCache = (key, fetchFn, ttl = 5 * 60 * 1000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await performanceService.cachedApiCall(key, fetchFn, ttl);
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const invalidate = useCallback(() => {
    performanceService.cache.delete(key);
    fetchData();
  }, [key, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    invalidate
  };
};

// Web Worker hook for heavy computations
export const useWebWorker = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runTask = useCallback(async (taskName, data) => {
    setIsProcessing(true);
    setError(null);

    try {
      const workerResult = await performanceService.processDataInWorker(data, taskName);
      setResult(workerResult);
    } catch (err) {
      setError(err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    runTask,
    isProcessing,
    result,
    error
  };
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const updateMetrics = () => {
      const report = performanceService.getPerformanceReport();
      setMetrics(report);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
};

// Optimized API hook with caching and retry logic
export const useOptimizedApi = (apiCall, dependencies = [], options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    retries = 3,
    retryDelay = 1000,
    cache = true,
    cacheTime = 5 * 60 * 1000
  } = options;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    let attempts = 0;
    
    while (attempts < retries) {
      try {
        let result;
        
        if (cache) {
          const cacheKey = `api-${JSON.stringify(dependencies)}`;
          result = await performanceService.cachedApiCall(cacheKey, apiCall, cacheTime);
        } else {
          result = await apiCall();
        }
        
        setData(result);
        setLoading(false);
        return;
      } catch (err) {
        attempts++;
        
        if (attempts >= retries) {
          setError(err);
          setLoading(false);
          return;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
      }
    }
  }, [apiCall, retries, retryDelay, cache, cacheTime, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

// Virtual scrolling hook for large lists
export const useVirtualScrolling = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = useMemo(() => {
    return items.slice(visibleStart, visibleEnd).map((item, index) => ({
      ...item,
      index: visibleStart + index
    }));
  }, [items, visibleStart, visibleEnd]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
};

// Bundle splitting hook for dynamic imports
export const useDynamicImport = (componentPath) => {
  const [component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        const module = await performanceService.bundleOptimization.constructor.loadComponent(componentPath);
        setComponent(() => module);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadComponent();
  }, [componentPath]);

  return { component, loading, error };
};

// Resource prefetching hook
export const usePrefetch = () => {
  const prefetchRoute = useCallback((route) => {
    performanceService.prefetch.prefetchRoute(route);
  }, []);

  const prefetchData = useCallback((url, priority = 'low') => {
    performanceService.prefetch.prefetchData(url, priority);
  }, []);

  const prefetchImages = useCallback((imageUrls) => {
    performanceService.prefetch.prefetchImages(imageUrls);
  }, []);

  return {
    prefetchRoute,
    prefetchData,
    prefetchImages
  };
};

// Combined performance optimization hook
export const usePerformanceOptimization = (options = {}) => {
  const metrics = usePerformanceMonitor();
  const { prefetchRoute, prefetchData, prefetchImages } = usePrefetch();
  
  // Auto-prefetch based on user behavior
  useEffect(() => {
    const handleMouseEnter = (e) => {
      const link = e.target.closest('a[href]');
      if (link && link.href.startsWith(window.location.origin)) {
        prefetchRoute(link.href);
      }
    };

    document.addEventListener('mouseenter', handleMouseEnter, true);
    return () => document.removeEventListener('mouseenter', handleMouseEnter, true);
  }, [prefetchRoute]);

  return {
    metrics,
    prefetchRoute,
    prefetchData,
    prefetchImages,
    clearCache: () => performanceService.cache.clear(),
    getReport: () => performanceService.getPerformanceReport()
  };
};

export default {
  useDebounce,
  usePagination,
  useLazyLoading,
  useOptimizedImage,
  useCache,
  useWebWorker,
  usePerformanceMonitor,
  useOptimizedApi,
  useVirtualScrolling,
  useDynamicImport,
  usePrefetch,
  usePerformanceOptimization
};
