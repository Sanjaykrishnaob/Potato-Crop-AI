import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  Skeleton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp,
  Agriculture,
  WaterDrop,
  Thermostat,
  Warning,
  CheckCircle,
  Timeline,
  Satellite,
  Refresh,
  GetApp as ExportIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Hooks and utilities
import { useDashboardData, useRealTimeUpdates, useRealTimeHealth } from '../hooks/useApi';
import { useLiveSensorData } from '../hooks/useFreeLiveData';
import { createCropAlert, createWeatherAlert } from '../components/NotificationSystem';
import LocationSelector from '../components/LocationSelector';
import SatelliteDataVisualization from '../components/SatelliteDataVisualization';
import GoogleEarthEngineMap from '../components/GoogleEarthEngineMap';
import AdvancedFieldAnalysisComponent from '../components/AdvancedFieldAnalysisComponent';
import satelliteProcessor from '../services/realTimeSatelliteProcessor';
import WeatherWidget from '../components/WeatherWidget';
import AgriculturalInsights from '../components/AgriculturalInsights';
import { useLocation } from '../contexts/LocationContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
  },
}));

const MetricCard = styled(Card)(({ theme, color = 'primary' }) => ({
  background: `linear-gradient(135deg, ${theme.palette[color].main} 0%, ${theme.palette[color].dark} 100%)`,
  color: 'white',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    right: '-50%',
    width: '100%',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    transform: 'rotate(45deg)',
  },
}));

const AlertCard = styled(Card)(({ theme, severity = 'warning' }) => ({
  borderLeft: `4px solid ${theme.palette[severity].main}`,
  backgroundColor: `${theme.palette[severity].light}15`,
}));

// Add global styles for animations
const globalStyles = {
  '@keyframes pulse': {
    '0%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.5,
    },
    '100%': {
      opacity: 1,
    },
  },
};

function Dashboard({ addNotification }) {
  // API hooks for data fetching
  const { dashboardData, loading, error, refetch } = useDashboardData();
  const { lastUpdate, isConnected } = useRealTimeUpdates('all-fields');
  const { healthData, loading: healthLoading, error: healthError, refetch: refetchHealth } = useRealTimeHealth(30000); // Update every 30 seconds
  const { sensors: iotSensorData, loading: sensorLoading, error: sensorError } = useLiveSensorData(15000); // Update every 15 seconds
  const { currentLocation, updateLocation, getCurrentPosition, gpsAvailable, getValidCoordinates, ensureValidLocation } = useLocation();
  
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  
  // Satellite processing status state
  const [satelliteStatus, setSatelliteStatus] = useState({
    processing: false,
    lastUpdate: null,
    fieldsProcessed: 0,
    totalFields: 0,
    activeAnalyses: ['NDVI Analysis', 'NDRE Analysis', 'Crop Health Monitoring', 'Disease Risk Assessment'],
    dataSources: ['Sentinel-2', 'Landsat-8', 'Weather Data']
  });
  
  const [data, setData] = useState({
    fields: [],
    metrics: {},
    alerts: [],
    tasks: [],
    weather: {},
    loading: true,
  });

  useEffect(() => {
    // Update data when dashboardData changes
    if (dashboardData) {
      setData({
        fields: dashboardData.fields || [],
        metrics: dashboardData.summary || {},
        alerts: dashboardData.alerts || [],
        tasks: dashboardData.tasks || [],
        weather: dashboardData.weather || {},
        loading: false,
      });

      // Check for high-priority alerts and create notifications
      if (dashboardData.alerts) {
        dashboardData.alerts.forEach(alert => {
          if (alert.priority === 'High' && addNotification) {
            addNotification(createCropAlert(
              alert.field,
              alert.type,
              alert.message,
              alert.priority
            ));
          }
        });
      }
    }
  }, [dashboardData, addNotification]);

  useEffect(() => {
    // Handle API errors
    if (error && addNotification) {
      addNotification({
        type: 'warning',
        title: '⚠️ Connection Issue',
        message: 'Using offline data. Some features may be limited.',
        priority: 'Low'
      });
    }
  }, [error, addNotification]);

  // GPS location initialization effect
  useEffect(() => {
    const initializeLocation = async () => {
      // Ensure we always have valid coordinates for satellite services
      ensureValidLocation();
      
      // Only auto-request GPS if no location is set or if using default location
      if (!currentLocation || currentLocation.isDefault || currentLocation.type === 'auto-default') {
        if (gpsAvailable) {
          console.log('🗺️ Attempting to get current GPS location...');
          // Don't block the UI, just try to get location in background
          setTimeout(async () => {
            try {
              await getCurrentPosition();
              console.log('✅ GPS location updated successfully');
              if (addNotification) {
                addNotification({
                  type: 'success',
                  title: '📍 Location Updated',
                  message: 'GPS location acquired successfully for satellite analysis',
                  priority: 'Low'
                });
              }
            } catch (error) {
              console.log('📍 GPS not available, using default location for satellite services');
              if (addNotification) {
                addNotification({
                  type: 'info',
                  title: '📍 Location Service',
                  message: 'Using default location (Bangalore) for satellite analysis. GPS can be enabled anytime.',
                  priority: 'Low'
                });
              }
            }
          }, 2000); // Wait 2 seconds after page load
        } else {
          console.log('📍 GPS not supported, ensuring default location is set');
          if (addNotification) {
            addNotification({
              type: 'info',
              title: '📍 Location Service',
              message: 'Using default location (Bangalore) for satellite analysis.',
              priority: 'Low'
            });
          }
        }
      }
    };

    initializeLocation();
  }, []); // Only run once on mount

  useEffect(() => {
    // Handle real-time health data updates
    if (healthData && healthData.fields) {
      setData(prevData => ({
        ...prevData,
        fields: healthData.fields.map(healthField => {
          // Find matching field in existing data or create new one
          const existingField = prevData.fields.find(f => f.id === healthField.id) || {};
          return {
            ...existingField,
            id: healthField.id,
            name: healthField.name,
            health: healthField.health,
            ndvi: healthField.ndvi,
            ndre: healthField.ndre,
            lastUpdated: healthField.lastUpdated,
            growth_stage: healthField.growth_stage || existingField.stage || 'Unknown',
            // Keep existing area if available
            area: existingField.area || 10 + Math.random() * 10,
            stage: healthField.growth_stage || existingField.stage || 'Monitoring'
          };
        }),
        metrics: {
          ...prevData.metrics,
          avgHealth: healthData.avgHealth || prevData.metrics.avgHealth,
          totalFields: healthData.fields.length,
          dataSource: healthData.dataSource
        },
        loading: false
      }));

      // Add notification for health data updates if it's from real satellite data
      if (healthData.dataSource === 'satellite_processing' && addNotification) {
        addNotification({
          type: 'success',
          title: '📡 Real-time Update',
          message: `Field health data updated from satellite analysis. Avg health: ${healthData.avgHealth}%`,
          priority: 'Low'
        });
      }
    }
  }, [healthData, addNotification]);

  useEffect(() => {
    // Handle health API errors
    if (healthError && addNotification) {
      addNotification({
        type: 'warning',
        title: '📡 Satellite Connection',
        message: 'Real-time satellite data unavailable. Using simulated data.',
        priority: 'Low'
      });
    }
  }, [healthError, addNotification]);

  useEffect(() => {
    // Handle IoT sensor data updates and alerts
    if (iotSensorData && iotSensorData.sensors && addNotification) {
      // Check for sensor alerts
      iotSensorData.sensors.forEach(sensor => {
        if (sensor.status === 'critical' || sensor.battery < 20) {
          addNotification({
            type: 'warning',
            title: '⚠️ Sensor Alert',
            message: `${sensor.type} at ${sensor.location}: ${sensor.status === 'critical' ? 'Critical status' : 'Low battery'}`,
            priority: 'Medium'
          });
        }
        
        // Alert for out-of-range values
        if (sensor.type === 'Soil Moisture' && (sensor.value < 20 || sensor.value > 80)) {
          addNotification({
            type: 'warning',
            title: '💧 Irrigation Alert',
            message: `Soil moisture at ${sensor.location} is ${sensor.value < 20 ? 'too low' : 'too high'}: ${sensor.value}%`,
            priority: 'High'
          });
        }
        
        if (sensor.type === 'Soil pH' && (sensor.value < 5.5 || sensor.value > 7.5)) {
          addNotification({
            type: 'warning',
            title: '🧪 Soil pH Alert',
            message: `Soil pH at ${sensor.location} is ${sensor.value < 5.5 ? 'too acidic' : 'too alkaline'}: ${sensor.value}`,
            priority: 'Medium'
          });
        }
      });
    }
  }, [iotSensorData, addNotification]);

  useEffect(() => {
    // Handle sensor API errors
    if (sensorError && addNotification) {
      addNotification({
        type: 'error',
        title: '📡 IoT Connection',
        message: 'IoT sensor network connection lost. Reconnecting...',
        priority: 'Medium'
      });
    }
  }, [sensorError, addNotification]);

  useEffect(() => {
    // Simulate API call (fallback for demo)
    const fetchData = async () => {
      if (!dashboardData && !loading) {
        setTimeout(() => {
          setData({
            fields: [
              { id: 1, name: 'Field Alpha', area: 12.5, stage: 'Tuber Bulking', health: 85 },
              { id: 2, name: 'Field Beta', area: 8.3, stage: 'Vegetative Growth', health: 92 },
              { id: 3, name: 'Field Gamma', area: 15.2, stage: 'Tuber Initiation', health: 78 },
            ],
            metrics: {
              totalArea: 36.0,
              avgHealth: 85,
              activeTasks: 7,
              completedTasks: 23,
              nitrogenDeficiency: 12,
              irrigationNeeded: 3,
            },
            alerts: [
              { id: 1, type: 'warning', message: 'Field Alpha Zone 3: Nitrogen deficiency detected', time: '2 hours ago' },
              { id: 2, type: 'info', message: 'New satellite imagery available for processing', time: '4 hours ago' },
              { id: 3, type: 'success', message: 'Field Beta irrigation completed successfully', time: '6 hours ago' },
            ],
            tasks: [
              { id: 1, title: 'Apply fertilizer to Field Alpha Zone 3', priority: 'high', status: 'pending', dueDate: 'Today', field: 'Field Alpha' },
              { id: 2, title: 'Schedule irrigation for Field Gamma', priority: 'medium', status: 'in-progress', dueDate: 'Tomorrow', field: 'Field Gamma' },
              { id: 3, title: 'Process satellite imagery batch #847', priority: 'medium', status: 'pending', dueDate: 'Today', field: 'All Fields' },
              { id: 4, title: 'Monitor NDVI changes in Field Beta', priority: 'low', status: 'pending', dueDate: 'This Week', field: 'Field Beta' },
              { id: 5, title: 'Update soil moisture sensors', priority: 'high', status: 'in-progress', dueDate: 'Today', field: 'Field Alpha' },
              { id: 6, title: 'Generate weekly crop health report', priority: 'medium', status: 'pending', dueDate: 'Friday', field: 'All Fields' },
              { id: 7, title: 'Calibrate weather station equipment', priority: 'low', status: 'pending', dueDate: 'Next Week', field: 'Weather Station' },
            ],
            weather: {
              temperature: 22,
              humidity: 65,
              precipitation: 0,
              forecast: '☀️ Sunny',
            },
            loading: false,
          });
        }, 1000);
      }
    };

    fetchData();
  }, [dashboardData, loading]);

  // Initialize satellite processor and update status
  useEffect(() => {
    let processingInterval;
    
    const initializeSatelliteProcessor = async () => {
      try {
        setSatelliteStatus(prev => ({
          ...prev,
          processing: true,
          lastUpdate: new Date(),
          totalFields: data.fields.length
        }));

        // Start satellite processor for all fields
        if (data.fields.length > 0) {
          await satelliteProcessor.subscribeToRealTimeData(
            data.fields,
            (status) => {
              setSatelliteStatus(prev => ({
                ...prev,
                processing: status.processing,
                fieldsProcessed: status.fieldsProcessed,
                lastUpdate: new Date()
              }));
            }
          );

          // Set up periodic status updates
          processingInterval = setInterval(() => {
            setSatelliteStatus(prev => ({
              ...prev,
              lastUpdate: new Date()
            }));
          }, 30000); // Update every 30 seconds
        }
      } catch (error) {
        console.error('Failed to initialize satellite processor:', error);
        setSatelliteStatus(prev => ({
          ...prev,
          processing: false
        }));
        
        if (addNotification) {
          addNotification({
            type: 'info',
            title: '🛰️ Satellite Processing',
            message: 'Satellite analysis running in demo mode with high-quality simulated data.',
            priority: 'Low'
          });
        }
      }
    };

    if (data.fields.length > 0) {
      initializeSatelliteProcessor();
    }

    return () => {
      if (processingInterval) {
        clearInterval(processingInterval);
      }
    };
  }, [data.fields, addNotification]);

  // Chart data
  const ndviTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Field Alpha',
        data: [0.45, 0.52, 0.58, 0.65, 0.72, 0.68],
        borderColor: '#2E8B57',
        backgroundColor: 'rgba(46, 139, 87, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Field Beta',
        data: [0.48, 0.55, 0.62, 0.69, 0.75, 0.77],
        borderColor: '#FF8C00',
        backgroundColor: 'rgba(255, 140, 0, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const growthStageData = {
    labels: ['Emergence', 'Vegetative', 'Tuber Init', 'Tuber Bulk', 'Maturation'],
    datasets: [
      {
        data: [0, 1, 1, 1, 0],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Prepare export data
  const prepareExportData = () => {
    const validLocation = getValidCoordinates();
    return {
      overview: {
        location: validLocation?.name || 'Location Available',
        coordinates: {
          lat: validLocation?.lat || 0,
          lng: validLocation?.lng || 0
        },
        totalArea: data.metrics.totalArea,
        avgHealth: data.metrics.avgHealth,
        activeTasks: data.metrics.activeTasks,
        timestamp: new Date().toISOString()
      },
      fields: data.fields,
      alerts: data.alerts,
      weather: data.weather,
      charts: {
        ndviTrend: ndviTrendData,
        growthStage: growthStageData
      }
    };
  };

  // Simple CSV export function
  const exportToCSV = () => {
    const exportData = prepareExportData();
    
    // Create CSV content
    const csvContent = [
      // Header
      ['Field', 'Area (ha)', 'Health (%)', 'Growth Stage'],
      // Data rows
      ...exportData.fields.map(field => [
        field.name,
        field.area,
        field.health,
        field.stage
      ])
    ].map(row => row.join(',')).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `potato-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Show success notification
    if (addNotification) {
      addNotification({
        type: 'success',
        title: '📊 Export Successful',
        message: 'Dashboard data exported successfully as CSV',
        priority: 'Low'
      });
    }
  };

  // Simple JSON export function
  const exportToJSON = () => {
    const exportData = prepareExportData();
    
    // Create JSON content
    const jsonContent = JSON.stringify(exportData, null, 2);

    // Create and download file
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `potato-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Show success notification
    if (addNotification) {
      addNotification({
        type: 'success',
        title: '📊 Export Successful',
        message: 'Dashboard data exported successfully as JSON',
        priority: 'Low'
      });
    }
  };

  if (data.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%',
      maxWidth: '1400px',
      mx: 'auto',
      px: { xs: 1, sm: 2, md: 3 },
      pt: { xs: 2, sm: 3, md: 4 } // Additional top padding to ensure content visibility
    }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 1, md: 2 },
        mb: { xs: 3, sm: 4, md: 5 },
        p: { xs: 1, sm: 0 }
      }}>
        <Typography 
          variant="h4" 
          fontWeight="bold" 
          color="text.primary"
          sx={{
            fontSize: { xs: '1.3rem', sm: '1.75rem', md: '2rem', lg: '2.25rem' },
            textAlign: { xs: 'center', sm: 'left' },
            width: { xs: '100%', sm: 'auto' },
            lineHeight: { xs: 1.2, sm: 1.3 },
            mb: { xs: 1, sm: 0 }
          }}
        >
          🌱 Farm Overview Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={() => {
            refetch(); // Refresh dashboard data
            refetchHealth(); // Refresh real-time health data
            if (addNotification) {
              addNotification({
                type: 'info',
                title: '🔄 Data Refresh',
                message: 'Fetching latest satellite and field data...',
                priority: 'Low'
              });
            }
          }}
          disabled={loading || healthLoading}
          sx={{
            minWidth: { xs: '100%', sm: 'auto' },
            maxWidth: { xs: '100%', sm: '200px' },
            minHeight: { xs: 44, sm: 48 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
        >
          {loading || healthLoading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </Box>

      {/* Location Selector */}
      <Box sx={{ 
        mb: { xs: 2.5, sm: 3.5 },
        display: 'flex',
        justifyContent: 'center',
        px: { xs: 1, sm: 0 }
      }}>
        <LocationSelector />
      </Box>

      {/* Real-time Data Status */}
      <Box sx={{ 
        mb: { xs: 3, sm: 4 }, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: { xs: 'center', sm: 'flex-start' },
        gap: { xs: 1.5, sm: 2 }, 
        flexWrap: 'wrap',
        p: { xs: 2, sm: 2.5, md: 3 },
        bgcolor: 'background.paper',
        borderRadius: { xs: 2, sm: 3 },
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 1,
        mx: { xs: 1, sm: 0 }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
          <Box 
            sx={{ 
              width: { xs: 8, sm: 10 }, 
              height: { xs: 8, sm: 10 }, 
              borderRadius: '50%', 
              bgcolor: healthData && healthData.dataSource === 'satellite_processing' ? 'success.main' : 
                      healthData && healthData.dataSource === 'simulated_satellite' ? 'warning.main' : 'grey.400',
              animation: healthLoading ? 'pulse 1.5s infinite' : 'none'
            }} 
          />
          <Typography variant="body2" color="text.secondary" sx={{ 
            fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
            whiteSpace: 'nowrap'
          }}>
            {healthLoading ? 'Updating satellite data...' : 
             healthData?.dataSource === 'satellite_processing' ? 'Live satellite data' : 
             healthData?.dataSource === 'simulated_satellite' ? 'Simulated satellite data' : 
             'Demo data'}
          </Typography>
        </Box>
        
        {/* Location Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
          <Box 
            sx={{ 
              width: { xs: 8, sm: 10 }, 
              height: { xs: 8, sm: 10 }, 
              borderRadius: '50%', 
              bgcolor: currentLocation?.hasValidCoordinates ? 
                (currentLocation?.type === 'current' ? 'success.main' : 'info.main') : 
                'warning.main'
            }} 
          />
          <Typography variant="body2" color="text.secondary" sx={{ 
            fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
            whiteSpace: 'nowrap'
          }}>
            {currentLocation?.hasValidCoordinates ? 
              (currentLocation?.type === 'current' ? 
                `GPS: ${currentLocation.name}` : 
                `Location: ${currentLocation.name}`) :
              'Setting up location...'}
          </Typography>
        </Box>
        {healthData?.lastUpdated && (
          <Typography variant="body2" color="text.secondary" sx={{ 
            fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
            whiteSpace: 'nowrap'
          }}>
            Last updated: {new Date(healthData.lastUpdated).toLocaleTimeString()}
          </Typography>
        )}
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ 
        mb: { xs: 3, sm: 4, md: 5 },
        px: { xs: 1, sm: 0 }
      }}>
        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard color="primary">
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                height: '100%',
                minHeight: { xs: '80px', sm: '100px' }
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="h4" 
                    fontWeight="bold"
                    sx={{ 
                      fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                      lineHeight: 1.2,
                      mb: 0.5
                    }}
                  >
                    {data.metrics.totalArea}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Total Area (ha)
                  </Typography>
                </Box>
                <Agriculture 
                  fontSize="large" 
                  sx={{ 
                    opacity: 0.8,
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                  }} 
                />
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard color="success">
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                height: '100%',
                minHeight: { xs: '80px', sm: '100px' }
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="h4" 
                    fontWeight="bold"
                    sx={{ 
                      fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                      lineHeight: 1.2,
                      mb: 0.5
                    }}
                  >
                    {data.metrics.avgHealth}%
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Avg Field Health
                  </Typography>
                </Box>
                <TrendingUp 
                  fontSize="large" 
                  sx={{ 
                    opacity: 0.8,
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                  }} 
                />
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard color="warning">
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                height: '100%',
                minHeight: { xs: '80px', sm: '100px' }
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="h4" 
                    fontWeight="bold"
                    sx={{ 
                      fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                      lineHeight: 1.2,
                      mb: 0.5
                    }}
                  >
                    {data.metrics.activeTasks}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Active Tasks
                  </Typography>
                </Box>
                <Timeline 
                  fontSize="large" 
                  sx={{ 
                    opacity: 0.8,
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                  }} 
                />
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <MetricCard color="info">
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                height: '100%',
                minHeight: { xs: '80px', sm: '100px' }
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="h4" 
                    fontWeight="bold"
                    sx={{ 
                      fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                      lineHeight: 1.2,
                      mb: 0.5
                    }}
                  >
                    {iotSensorData && iotSensorData.sensors ? 
                      iotSensorData.sensors.filter(s => s.status === 'operational').length : '0'}
                    /{iotSensorData && iotSensorData.sensors ? iotSensorData.sensors.length : '0'}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    Active Sensors
                  </Typography>
                </Box>
                <Satellite 
                  fontSize="large" 
                  sx={{ 
                    opacity: 0.8,
                    fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                  }} 
                />
              </Box>
            </CardContent>
          </MetricCard>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* NDVI Trend Chart */}
        <Grid item xs={12} lg={8}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📈 NDVI Trends (6 Weeks)
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line data={ndviTrendData} options={chartOptions} />
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Growth Stage Distribution */}
        <Grid item xs={12} lg={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🌱 Growth Stages
              </Typography>
              <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
                <Doughnut data={growthStageData} options={doughnutOptions} />
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Field Status */}
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🏞️ Field Status
              </Typography>
              {data.fields.map((field) => (
                <Box key={field.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {field.name} ({field.area} ha)
                    </Typography>
                    <Chip 
                      label={field.stage} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={field.health} 
                      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      color={field.health > 80 ? 'success' : field.health > 60 ? 'warning' : 'error'}
                    />
                    <Typography variant="body2" fontWeight="medium">
                      {field.health}%
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Weather Overview */}
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🌤️ Weather Overview
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <WeatherWidget compact={false} showLocation={true} />
                
                {currentLocation?.hasValidCoordinates && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Monitoring weather conditions for:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      📍 {currentLocation.name}
                    </Typography>
                    {currentLocation.type === 'potato-region' && (
                      <Chip 
                        label="🥔 Potato Growing Region" 
                        size="small" 
                        color="success" 
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />
                    )}
                    {(currentLocation.type === 'default-fallback' || currentLocation.type === 'auto-default') && (
                      <Chip 
                        label="📍 Default Location" 
                        size="small" 
                        color="info" 
                        variant="outlined"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                )}
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Active Tasks List */}
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📋 Active Tasks ({(data.tasks || []).filter(task => task.status === 'pending' || task.status === 'in-progress').length})
              </Typography>
              {(data.tasks || [])
                .filter(task => task.status === 'pending' || task.status === 'in-progress')
                .slice(0, 5)
                .map((task) => (
                <Box key={task.id} sx={{ 
                  mb: 2, 
                  p: 2, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  borderRadius: 1,
                  backgroundColor: task.priority === 'high' ? 'error.light' : 
                                 task.priority === 'medium' ? 'warning.light' : 'info.light',
                  opacity: 0.1,
                  '&:hover': { opacity: 0.15 }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight="medium" sx={{ flexGrow: 1 }}>
                      {task.title}
                    </Typography>
                    <Chip 
                      label={task.priority} 
                      size="small"
                      color={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'info'}
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      📍 {task.field}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      📅 Due: {task.dueDate}
                    </Typography>
                    <Chip 
                      label={task.status === 'in-progress' ? 'In Progress' : 'Pending'} 
                      size="small"
                      color={task.status === 'in-progress' ? 'success' : 'default'}
                      variant="filled"
                    />
                  </Box>
                </Box>
              ))}
              <Button variant="text" size="small" sx={{ mt: 1 }}>
                View All Tasks
              </Button>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* IoT Sensor Data */}
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  📡 IoT Sensors
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: iotSensorData && iotSensorData.connectivity ? 'success.main' : 'warning.main',
                      animation: sensorLoading ? 'pulse 1.5s infinite' : 'none'
                    }} 
                  />
                  <Typography variant="body2" color="text.secondary">
                    {sensorLoading ? 'Updating...' : 
                     iotSensorData && iotSensorData.connectivity ? 'Online' : 'Offline'}
                  </Typography>
                </Box>
              </Box>
              
              {iotSensorData && iotSensorData.sensors ? (
                iotSensorData.sensors.map((sensor) => (
                  <Box key={sensor.id} sx={{ 
                    mb: 2, 
                    p: 2, 
                    border: '1px solid', 
                    borderColor: 'divider',
                    borderRadius: 1,
                    backgroundColor: sensor.status === 'operational' ? 'success.light' : 
                                   sensor.status === 'warning' ? 'warning.light' : 'error.light',
                    opacity: 0.1,
                    '&:hover': { opacity: 0.15 }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {sensor.type} - {sensor.location}
                      </Typography>
                      <Chip 
                        label={sensor.status} 
                        size="small"
                        color={sensor.status === 'operational' ? 'success' : 
                              sensor.status === 'warning' ? 'warning' : 'error'}
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {sensor.value} {sensor.unit}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        🔋 Battery: {sensor.battery}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        📶 Signal: {sensor.signal}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ⏰ {new Date(sensor.lastUpdate).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  {sensorLoading ? (
                    <CircularProgress size={24} />
                  ) : sensorError ? (
                    <Typography variant="body2" color="error">
                      Sensor connection error
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No sensor data available
                    </Typography>
                  )}
                </Box>
              )}
              
              {iotSensorData && iotSensorData.equipment && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    🚜 Equipment Status
                  </Typography>
                  {iotSensorData.equipment.map((equipment) => (
                    <Box key={equipment.id} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      p: 1,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1
                    }}>
                      <Typography variant="body2">
                        {equipment.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {equipment.location}
                        </Typography>
                        <Chip 
                          label={equipment.status} 
                          size="small"
                          color={equipment.status === 'active' ? 'success' : 
                                equipment.status === 'idle' ? 'warning' : 'error'}
                          variant="filled"
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🚨 Recent Alerts
              </Typography>
              {data.alerts.map((alert) => (
                <AlertCard key={alert.id} severity={alert.type} sx={{ mb: 2 }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      {alert.type === 'warning' && <Warning color="warning" />}
                      {alert.type === 'success' && <CheckCircle color="success" />}
                      {alert.type === 'info' && <Satellite color="info" />}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {alert.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {alert.time}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </AlertCard>
              ))}
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Agricultural Insights */}
        <Grid item xs={12} lg={4}>
          <AgriculturalInsights />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} lg={8}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                ⚡ Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Button variant="contained" startIcon={<Satellite />}>
                  Download Latest Imagery
                </Button>
                <Button 
                  variant="contained" 
                  color="success"
                  startIcon={<ExportIcon />}
                  endIcon={<MoreIcon />}
                  onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                >
                  Export Data
                </Button>
                <Button variant="outlined" startIcon={<Agriculture />}>
                  Generate Field Report
                </Button>
                <Button variant="outlined" startIcon={<WaterDrop />}>
                  Schedule Irrigation
                </Button>
                <Button variant="outlined" startIcon={<Timeline />}>
                  View Analytics
                </Button>
              </Box>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Google Earth Engine Integration */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Advanced Field Analysis with Satellite Imagery */}
        <Grid item xs={12}>
          <AdvancedFieldAnalysisComponent 
            fieldData={data.fields.length > 0 ? data.fields[0] : { 
              id: 'demo-field',
              name: 'Demo Field Analysis',
              coordinates: (() => {
                const validCoords = getValidCoordinates();
                return [validCoords.lat, validCoords.lng];
              })()
            }}
            onAnalysisComplete={(results) => {
              console.log('📊 Field analysis completed:', results);
              if (addNotification) {
                addNotification({
                  type: 'success',
                  title: '🛰️ Analysis Complete',
                  message: 'Advanced field analysis using satellite imagery completed successfully.',
                  priority: 'Medium'
                });
              }
            }}
          />
        </Grid>

        {/* Satellite Data Visualization */}
        <Grid item xs={12}>
          <SatelliteDataVisualization 
            fields={data.fields}
            processingStatus={satelliteStatus}
          />
        </Grid>
        
        {/* Google Earth Engine Map */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ height: 600 }}>
            <GoogleEarthEngineMap 
              fields={data.fields}
              currentLocation={getValidCoordinates()}
            />
          </Box>
        </Grid>

        {/* Satellite Processing Status */}
        <Grid item xs={12} lg={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🛰️ Satellite Processing Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Google Earth Engine Integration
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={satelliteStatus.processing && satelliteStatus.totalFields > 0 ? 
                    (satelliteStatus.fieldsProcessed / satelliteStatus.totalFields) * 100 : 0
                  }
                  color={satelliteStatus.processing ? "success" : "warning"}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography 
                  variant="caption" 
                  color={satelliteStatus.processing ? "success.main" : "warning.main"}
                >
                  {satelliteStatus.processing ? 
                    `Processing ${satelliteStatus.fieldsProcessed}/${satelliteStatus.totalFields} fields` : 
                    'Processing standby'
                  }
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Data Sources
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {satelliteStatus.dataSources.map((source) => (
                    <Chip 
                      key={source}
                      label={source}
                      size="small" 
                      color={source.includes('Sentinel') ? 'primary' : 
                             source.includes('Landsat') ? 'secondary' : 'info'}
                      icon={source.includes('Weather') ? <Thermostat /> : <Satellite />}
                    />
                  ))}
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Processing Metrics
                </Typography>
                {satelliteStatus.activeAnalyses.map((analysis) => (
                  <Typography key={analysis} variant="body2">
                    • {analysis}: ✅ Active
                  </Typography>
                ))}
                {satelliteStatus.lastUpdate && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Last update: {satelliteStatus.lastUpdate.toLocaleTimeString()}
                  </Typography>
                )}
              </Box>

              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<Refresh />}
                fullWidth
                onClick={() => {
                  setSatelliteStatus(prev => ({
                    ...prev,
                    lastUpdate: new Date(),
                    processing: true
                  }));
                  // Trigger refresh for all satellite components
                  window.dispatchEvent(new CustomEvent('refreshSatelliteData'));
                }}
                disabled={satelliteStatus.processing}
              >
                {satelliteStatus.processing ? 'Processing...' : 'Refresh Satellite Data'}
              </Button>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>

      {/* Export Menu */}
      <Menu
        anchorEl={exportMenuAnchor}
        open={Boolean(exportMenuAnchor)}
        onClose={() => setExportMenuAnchor(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={() => { exportToCSV(); setExportMenuAnchor(null); }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ExportIcon fontSize="small" />
            <Box>
              <Typography variant="body2" fontWeight="medium">Export as CSV</Typography>
              <Typography variant="caption" color="text.secondary">
                Field data in spreadsheet format
              </Typography>
            </Box>
          </Box>
        </MenuItem>
        <MenuItem onClick={() => { exportToJSON(); setExportMenuAnchor(null); }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ExportIcon fontSize="small" />
            <Box>
              <Typography variant="body2" fontWeight="medium">Export as JSON</Typography>
              <Typography variant="caption" color="text.secondary">
                Complete dashboard data
              </Typography>
            </Box>
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default Dashboard;
