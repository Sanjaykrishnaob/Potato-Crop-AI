import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Speed as PerformanceIcon,
  Memory as MemoryIcon,
  Storage as CacheIcon,
  CloudDownload as NetworkIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import performanceService from '../services/performanceService';

// Performance Metrics Card
const MetricCard = ({ 
  title, 
  value, 
  unit, 
  icon, 
  color = 'primary',
  trend,
  subtitle 
}) => {
  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUpIcon color="success" fontSize="small" />;
    if (trend < 0) return <TrendingDownIcon color="error" fontSize="small" />;
    return null;
  };

  const getStatusColor = () => {
    if (title === 'Load Time' && value > 3000) return 'error';
    if (title === 'Memory Usage' && value > 100) return 'warning';
    if (title === 'Cache Efficiency' && value < 70) return 'warning';
    return color;
  };

  return (
    <Card sx={{ height: '100%', border: `1px solid`, borderColor: `${getStatusColor()}.light` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ color: `${getStatusColor()}.main`, mr: 1 }}>
            {icon}
          </Box>
          <Typography variant="h6" component="div" sx={{ flex: 1 }}>
            {title}
          </Typography>
          {getTrendIcon()}
        </Box>
        
        <Typography variant="h4" fontWeight="bold" color={`${getStatusColor()}.main`}>
          {typeof value === 'number' ? value.toFixed(1) : value}
          {unit && (
            <Typography component="span" variant="h6" color="text.secondary">
              {unit}
            </Typography>
          )}
        </Typography>
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// Cache Status Component
const CacheStatus = ({ cacheStats, efficiency }) => {
  const getEfficiencyColor = () => {
    if (efficiency >= 80) return 'success';
    if (efficiency >= 60) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📦 Cache Performance
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cache Efficiency
              </Typography>
              <LinearProgress
                variant="determinate"
                value={efficiency}
                color={getEfficiencyColor()}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">
                {efficiency.toFixed(1)}% hit rate
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cache Usage
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(cacheStats.size / cacheStats.maxSize) * 100}
                color="primary"
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">
                {cacheStats.size} / {cacheStats.maxSize} items
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {cacheStats.keys.slice(0, 5).map((key, index) => (
            <Chip
              key={index}
              label={key.length > 20 ? `${key.substring(0, 20)}...` : key}
              size="small"
              variant="outlined"
            />
          ))}
          {cacheStats.keys.length > 5 && (
            <Chip
              label={`+${cacheStats.keys.length - 5} more`}
              size="small"
              color="primary"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// Performance Recommendations
const PerformanceRecommendations = ({ metrics }) => {
  const getRecommendations = () => {
    const recommendations = [];
    
    if (metrics.loadTime > 3000) {
      recommendations.push({
        type: 'error',
        message: 'Load time is high. Consider code splitting and lazy loading.',
        action: 'Optimize bundle size'
      });
    }
    
    if (metrics.memoryUsage > 100) {
      recommendations.push({
        type: 'warning',
        message: 'Memory usage is elevated. Check for memory leaks.',
        action: 'Monitor components'
      });
    }
    
    if (metrics.cacheEfficiency < 70) {
      recommendations.push({
        type: 'warning',
        message: 'Cache efficiency is low. Review caching strategy.',
        action: 'Optimize caching'
      });
    }
    
    if (metrics.apiCalls > 50) {
      recommendations.push({
        type: 'info',
        message: 'High number of API calls. Consider request batching.',
        action: 'Batch requests'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: 'All performance metrics are within optimal ranges!',
        action: 'Keep monitoring'
      });
    }
    
    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          💡 Performance Recommendations
        </Typography>
        
        {recommendations.map((rec, index) => (
          <Alert
            key={index}
            severity={rec.type}
            sx={{ mb: 1 }}
            action={
              <Button size="small" color="inherit">
                {rec.action}
              </Button>
            }
          >
            {rec.message}
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};

// Real-time Performance Chart (Mock)
const PerformanceChart = ({ data, title, color = 'primary' }) => {
  // Mock chart data - in real implementation, use Chart.js or similar
  const chartData = Array.from({ length: 20 }, (_, i) => ({
    x: i,
    y: Math.random() * 100
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📈 {title}
        </Typography>
        
        <Box
          sx={{
            height: 200,
            display: 'flex',
            alignItems: 'end',
            gap: 1,
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 1
          }}
        >
          {chartData.map((point, index) => (
            <Box
              key={index}
              sx={{
                width: '100%',
                height: `${point.y}%`,
                bgcolor: `${color}.main`,
                borderRadius: '2px 2px 0 0',
                opacity: 0.8,
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </Box>
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Real-time performance data over the last 20 intervals
        </Typography>
      </CardContent>
    </Card>
  );
};

// Network Status Monitor
const NetworkStatusMonitor = ({ isOnline, requestCount, errorCount }) => {
  const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🌐 Network Status
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: isOnline ? 'success.main' : 'error.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1
                }}
              >
                {isOnline ? (
                  <CheckIcon sx={{ color: 'white', fontSize: 32 }} />
                ) : (
                  <ErrorIcon sx={{ color: 'white', fontSize: 32 }} />
                )}
              </Box>
              <Typography variant="body2">
                {isOnline ? 'Online' : 'Offline'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              API Requests: {requestCount}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Errors: {errorCount}
            </Typography>
            <Typography 
              variant="body2" 
              color={errorRate > 5 ? 'error.main' : 'text.secondary'}
            >
              Error Rate: {errorRate.toFixed(1)}%
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Main Performance Dashboard
const PerformanceDashboard = ({ isVisible = false }) => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    memoryUsage: 0,
    cacheEfficiency: 0
  });
  const [cacheStats, setCacheStats] = useState({ size: 0, maxSize: 100, keys: [] });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateMetrics = () => {
      const report = performanceService.getPerformanceReport();
      setMetrics(report);
      setCacheStats(report.cacheStats);
    };

    updateMetrics();

    // Auto-refresh metrics
    let interval;
    if (autoRefresh) {
      interval = setInterval(updateMetrics, 5000);
    }

    // Network status monitoring
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoRefresh]);

  const handleRefresh = () => {
    const report = performanceService.getPerformanceReport();
    setMetrics(report);
    setCacheStats(report.cacheStats);
  };

  const handleClearCache = () => {
    performanceService.cache.clear();
    handleRefresh();
  };

  if (!isVisible) return null;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          ⚡ Performance Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
          
          <Button
            variant="outlined"
            color="warning"
            onClick={handleClearCache}
          >
            Clear Cache
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Load Time"
            value={metrics.loadTime}
            unit="ms"
            icon={<PerformanceIcon />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Memory Usage"
            value={metrics.memoryUsage}
            unit="MB"
            icon={<MemoryIcon />}
            color="warning"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Cache Efficiency"
            value={metrics.cacheEfficiency}
            unit="%"
            icon={<CacheIcon />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="API Calls"
            value={metrics.apiCalls}
            icon={<NetworkIcon />}
            color="info"
            subtitle="Total requests"
          />
        </Grid>
      </Grid>

      {/* Detailed Analytics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <CacheStatus 
            cacheStats={cacheStats} 
            efficiency={metrics.cacheEfficiency} 
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <NetworkStatusMonitor
            isOnline={isOnline}
            requestCount={metrics.apiCalls}
            errorCount={Math.floor(metrics.apiCalls * 0.05)} // Mock error count
          />
        </Grid>
      </Grid>

      {/* Performance Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <PerformanceChart
            title="Response Time Trend"
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <PerformanceChart
            title="Memory Usage Trend"
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Recommendations */}
      <PerformanceRecommendations metrics={metrics} />

      {/* Advanced Settings */}
      <Accordion sx={{ mt: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            ⚙️ Advanced Performance Settings
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Cache Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Max Size: {cacheStats.maxSize} items<br/>
                TTL: 5 minutes<br/>
                Strategy: LRU (Least Recently Used)
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Optimization Features
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ✅ Code Splitting<br/>
                ✅ Lazy Loading<br/>
                ✅ Image Compression<br/>
                ✅ Service Worker<br/>
                ✅ Web Workers
              </Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default PerformanceDashboard;
