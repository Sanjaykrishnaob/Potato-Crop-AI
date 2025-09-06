// Satellite Data Visualization Component
// Enhanced dashboard component for Google Earth Engine powered agricultural insights

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Box,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Satellite as SatelliteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Agriculture as AgricultureIcon,
  WaterDrop as WaterDropIcon,
  Thermostat as ThermostatIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';
import { Line, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';

import satelliteProcessor from '../services/realTimeSatelliteProcessor';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const SatelliteDataVisualization = () => {
  const [satelliteData, setSatelliteData] = useState(null);
  const [timeSeries, setTimeSeries] = useState({});
  const [comparative, setComparative] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [expanded, setExpanded] = useState('overview');

  useEffect(() => {
    loadInitialData();
    
    // Subscribe to real-time updates
    const unsubscribe = satelliteProcessor.subscribe('field-update', (data) => {
      setSatelliteData(data);
      setLastUpdate(new Date());
    });

    return unsubscribe;
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load current status
      const status = await satelliteProcessor.getCurrentStatus();
      setSatelliteData(status);
      
      // Load comparative analysis
      const comparison = await satelliteProcessor.getComparativeAnalysis();
      setComparative(comparison);
      
      // Load time series for first field
      if (status.fields && status.fields.length > 0) {
        const firstField = status.fields[0];
        const series = await satelliteProcessor.getFieldTimeSeries(firstField.id, 30);
        setTimeSeries({ [firstField.id]: series });
        setSelectedField(firstField.id);
      }
      
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('Error loading satellite data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFieldTimeSeries = async (fieldId) => {
    try {
      const series = await satelliteProcessor.getFieldTimeSeries(fieldId, 30);
      setTimeSeries(prev => ({ ...prev, [fieldId]: series }));
    } catch (error) {
      console.error('Error loading time series:', error);
    }
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleFieldSelect = (fieldId) => {
    setSelectedField(fieldId);
    if (!timeSeries[fieldId]) {
      loadFieldTimeSeries(fieldId);
    }
  };

  // Memoized chart data
  const timeSeriesChartData = useMemo(() => {
    if (!selectedField || !timeSeries[selectedField]) return null;

    const data = timeSeries[selectedField].timeSeries;
    const labels = data.map(d => new Date(d.date).toLocaleDateString());

    return {
      labels,
      datasets: [
        {
          label: 'NDVI',
          data: data.map(d => d.ndvi),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'NDRE',
          data: data.map(d => d.ndre),
          borderColor: 'rgb(249, 115, 22)',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Health Score',
          data: data.map(d => d.health),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  }, [selectedField, timeSeries]);

  const healthComparisonData = useMemo(() => {
    if (!satelliteData?.fields) return null;

    return {
      labels: satelliteData.fields.map(f => f.name),
      datasets: [
        {
          label: 'Health Score',
          data: satelliteData.fields.map(f => f.health),
          backgroundColor: satelliteData.fields.map(f => 
            f.health > 80 ? 'rgba(34, 197, 94, 0.8)' : 
            f.health > 60 ? 'rgba(249, 115, 22, 0.8)' : 
            'rgba(239, 68, 68, 0.8)'
          ),
          borderColor: satelliteData.fields.map(f => 
            f.health > 80 ? 'rgb(34, 197, 94)' : 
            f.health > 60 ? 'rgb(249, 115, 22)' : 
            'rgb(239, 68, 68)'
          ),
          borderWidth: 2
        }
      ]
    };
  }, [satelliteData]);

  const vegetationIndicesData = useMemo(() => {
    if (!selectedField || !satelliteData?.fields) return null;

    const field = satelliteData.fields.find(f => f.id === selectedField);
    if (!field) return null;

    return {
      labels: ['NDVI', 'NDRE', 'EVI', 'SAVI'],
      datasets: [
        {
          label: 'Current Values',
          data: [field.ndvi, field.ndre, field.evi, field.savi],
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(34, 197, 94)'
        },
        {
          label: 'Optimal Range',
          data: [0.7, 0.5, 0.6, 0.5], // Typical optimal values for healthy potato crops
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          borderDash: [5, 5],
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff'
        }
      ]
    };
  }, [selectedField, satelliteData]);

  const getHealthColor = (health) => {
    if (health >= 80) return 'success';
    if (health >= 60) return 'warning';
    return 'error';
  };

  const getHealthIcon = (health) => {
    if (health >= 80) return <CheckCircleIcon color="success" />;
    if (health >= 60) return <WarningIcon color="warning" />;
    return <WarningIcon color="error" />;
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingUpIcon color="success" />;
      case 'declining': return <TrendingDownIcon color="error" />;
      default: return <TimelineIcon color="action" />;
    }
  };

  const formatLastUpdate = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader 
          title="Loading Satellite Data..."
          avatar={<SatelliteIcon />}
        />
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Initializing Google Earth Engine connection and processing satellite imagery...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with Status */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Satellite-Powered Agricultural Monitoring"
          subheader={`Last updated: ${formatLastUpdate(lastUpdate)} • Google Earth Engine Integration`}
          avatar={<SatelliteIcon color="primary" />}
          action={
            <Tooltip title="Refresh Data">
              <IconButton onClick={loadInitialData}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {satelliteData?.fields?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monitored Fields
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {comparative?.summary?.averageHealth || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Health
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {comparative?.summary?.averageNDVI || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average NDVI
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {comparative?.needsAttention?.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Need Attention
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Content Accordions */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {/* Field Overview */}
          <Accordion 
            expanded={expanded === 'overview'} 
            onChange={handleAccordionChange('overview')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                <AgricultureIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Field Overview & Health Status
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {satelliteData?.fields?.map((field) => (
                  <Grid item xs={12} md={6} lg={4} key={field.id}>
                    <Card 
                      variant="outlined"
                      sx={{ 
                        cursor: 'pointer',
                        border: selectedField === field.id ? 2 : 1,
                        borderColor: selectedField === field.id ? 'primary.main' : 'divider'
                      }}
                      onClick={() => handleFieldSelect(field.id)}
                    >
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="h6">{field.name}</Typography>
                          {getHealthIcon(field.health)}
                        </Box>
                        
                        <Box mb={2}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Health Score
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={field.health} 
                            color={getHealthColor(field.health)}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="h5" color={`${getHealthColor(field.health)}.main`}>
                            {field.health}%
                          </Typography>
                        </Box>

                        <Grid container spacing={1} sx={{ mb: 2 }}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">NDVI</Typography>
                            <Typography variant="body1" fontWeight="bold">{field.ndvi}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">NDRE</Typography>
                            <Typography variant="body1" fontWeight="bold">{field.ndre}</Typography>
                          </Grid>
                        </Grid>

                        <Box mb={2}>
                          <Chip 
                            label={field.growthStage} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </Box>

                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Chip 
                            icon={<ThermostatIcon />}
                            label={`${Math.round(field.temperature)}°C`} 
                            size="small" 
                          />
                          <Chip 
                            icon={<WaterDropIcon />}
                            label={`${Math.round(field.soilMoisture)}%`} 
                            size="small" 
                          />
                          <Chip 
                            icon={<CloudIcon />}
                            label={`${Math.round(field.cloudCover)}% cloud`} 
                            size="small" 
                          />
                        </Box>

                        {field.stressIndicators?.length > 0 && (
                          <Alert severity="warning" sx={{ mt: 2 }}>
                            {field.stressIndicators[0].message}
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12}>
          {/* Time Series Analysis */}
          <Accordion 
            expanded={expanded === 'timeseries'} 
            onChange={handleAccordionChange('timeseries')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                <TimelineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Time Series Analysis
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {timeSeriesChartData && (
                <Box sx={{ height: 400 }}>
                  <Line 
                    data={timeSeriesChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          type: 'linear',
                          display: true,
                          position: 'left',
                          min: 0,
                          max: 1,
                          title: {
                            display: true,
                            text: 'Vegetation Indices'
                          }
                        },
                        y1: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          min: 0,
                          max: 100,
                          title: {
                            display: true,
                            text: 'Health Score (%)'
                          },
                          grid: {
                            drawOnChartArea: false,
                          },
                        },
                      },
                      plugins: {
                        title: {
                          display: true,
                          text: `30-Day Trend Analysis - ${selectedField ? satelliteData?.fields?.find(f => f.id === selectedField)?.name : ''}`
                        },
                        legend: {
                          position: 'top'
                        }
                      }
                    }}
                  />
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Comparative Analysis */}
          <Accordion 
            expanded={expanded === 'comparison'} 
            onChange={handleAccordionChange('comparison')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Field Comparison</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {healthComparisonData && (
                <Box sx={{ height: 300 }}>
                  <Bar 
                    data={healthComparisonData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          min: 0,
                          max: 100,
                          title: {
                            display: true,
                            text: 'Health Score (%)'
                          }
                        }
                      },
                      plugins: {
                        title: {
                          display: true,
                          text: 'Field Health Comparison'
                        },
                        legend: {
                          display: false
                        }
                      }
                    }}
                  />
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Vegetation Indices Radar */}
          <Accordion 
            expanded={expanded === 'indices'} 
            onChange={handleAccordionChange('indices')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Vegetation Indices</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {vegetationIndicesData && (
                <Box sx={{ height: 300 }}>
                  <Radar 
                    data={vegetationIndicesData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          min: 0,
                          max: 1,
                          title: {
                            display: true,
                            text: 'Index Value'
                          }
                        }
                      },
                      plugins: {
                        title: {
                          display: true,
                          text: `Vegetation Indices - ${selectedField ? satelliteData?.fields?.find(f => f.id === selectedField)?.name : ''}`
                        }
                      }
                    }}
                  />
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        <Grid item xs={12}>
          {/* Recommendations */}
          <Accordion 
            expanded={expanded === 'recommendations'} 
            onChange={handleAccordionChange('recommendations')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI-Powered Recommendations
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {comparative?.recommendations && (
                <Grid container spacing={2}>
                  {comparative.recommendations.map((rec, index) => (
                    <Grid item xs={12} key={index}>
                      <Alert 
                        severity={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'}
                        sx={{ mb: 1 }}
                      >
                        <Typography variant="subtitle2">{rec.category.toUpperCase()}</Typography>
                        <Typography variant="body2">{rec.message}</Typography>
                        {rec.affectedFields && (
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Affected fields: {rec.affectedFields.join(', ')}
                          </Typography>
                        )}
                      </Alert>
                    </Grid>
                  ))}
                </Grid>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SatelliteDataVisualization;
