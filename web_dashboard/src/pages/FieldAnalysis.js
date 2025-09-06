import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Map as MapIcon,
  Layers as LayersIcon,
  Satellite as SatelliteIcon,
  Timeline as TimelineIcon,
  FilterAlt as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useLocation } from '../contexts/LocationContext';

// Import Google Earth Engine components
import GoogleEarthEngineMap from '../components/GoogleEarthEngineMap';
import AdvancedFieldAnalysisComponent from '../components/AdvancedFieldAnalysisComponent';
import SatelliteDataVisualization from '../components/SatelliteDataVisualization';

const MapCard = styled(Card)(({ theme }) => ({
  height: '600px',
  '& .leaflet-container': {
    height: '100%',
    borderRadius: theme.shape.borderRadius,
  },
}));

const ControlPanel = styled(Card)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

function FieldAnalysis() {
  const { currentLocation, getValidCoordinates } = useLocation();
  const [selectedField, setSelectedField] = useState('field1');
  const [selectedLayer, setSelectedLayer] = useState('ndvi');
  const [showZones, setShowZones] = useState(true);
  const [dateRange, setDateRange] = useState('latest');
  const [ndviThreshold, setNdviThreshold] = useState([0.3, 0.8]);
  const [loading, setLoading] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [satelliteStatus, setSatelliteStatus] = useState({
    processing: false,
    lastUpdate: null,
    fieldsProcessed: 0,
    totalFields: 0
  });

  // Generate field data based on current location for Google Earth Engine
  const generateFieldsForLocation = (location) => {
    if (!location || !location.lat || !location.lng) return [];
    
    const baseLat = location.lat;
    const baseLng = location.lng;
    const fieldSize = 0.01; // Approximately 1km field size
    
    return [
      {
        id: 'field1',
        name: `Field Alpha - ${location.name.split(',')[0]}`,
        coordinates: {
          lat: baseLat + 0.005,
          lng: baseLng + 0.005
        },
        bounds: {
          north: baseLat + fieldSize,
          south: baseLat,
          east: baseLng + fieldSize,
          west: baseLng
        },
        area: 12.5,
        health: 85,
        ndvi: 0.75,
        ndre: 0.45,
        growthStage: 'Tuber Bulking',
        zones: [
          { 
            id: 1, 
            coordinates: { lat: baseLat + 0.0025, lng: baseLng + 0.0025 },
            health: 75, 
            ndvi: 0.75,
            status: 'good'
          },
          { 
            id: 2, 
            coordinates: { lat: baseLat + 0.0075, lng: baseLng + 0.0025 },
            health: 85, 
            ndvi: 0.85,
            status: 'excellent'
          },
          { 
            id: 3, 
            coordinates: { lat: baseLat + 0.0025, lng: baseLng + 0.0075 },
            health: 65, 
            ndvi: 0.65,
            status: 'fair'
          },
          { 
            id: 4, 
            coordinates: { lat: baseLat + 0.0075, lng: baseLng + 0.0075 },
            health: 78, 
            ndvi: 0.78,
            status: 'good'
          },
        ]
      },
      {
        id: 'field2',
        name: `Field Beta - ${location.name.split(',')[0]}`,
        coordinates: {
          lat: baseLat + 0.015,
          lng: baseLng + 0.015
        },
        bounds: {
          north: baseLat + 0.02,
          south: baseLat + 0.01,
          east: baseLng + 0.02,
          west: baseLng + 0.01
        },
        area: 8.3,
        health: 92,
        ndvi: 0.85,
        ndre: 0.52,
        growthStage: 'Vegetative Growth',
        zones: [
          { 
            id: 1, 
            coordinates: { lat: baseLat + 0.0125, lng: baseLng + 0.0125 },
            health: 88, 
            ndvi: 0.88,
            status: 'excellent'
          },
          { 
            id: 2, 
            coordinates: { lat: baseLat + 0.0175, lng: baseLng + 0.0125 },
            health: 82, 
            ndvi: 0.82,
            status: 'good'
          },
          { 
            id: 3, 
            coordinates: { lat: baseLat + 0.0125, lng: baseLng + 0.0175 },
            health: 79, 
            ndvi: 0.79,
            status: 'good'
          },
          { 
            id: 4, 
            coordinates: { lat: baseLat + 0.0175, lng: baseLng + 0.0175 },
            health: 91, 
            ndvi: 0.91,
            status: 'excellent'
          },
        ]
      }
    ];
  };

  const validLocation = getValidCoordinates();
  const fields = generateFieldsForLocation(validLocation);
  const currentField = fields.find(f => f.id === selectedField);

  // Handle analysis completion
  const handleAnalysisComplete = (results) => {
    console.log('🛰️ Google Earth Engine analysis completed:', results);
    setAnalysisComplete(true);
    setSatelliteStatus(prev => ({
      ...prev,
      processing: false,
      lastUpdate: new Date(),
      fieldsProcessed: prev.fieldsProcessed + 1
    }));
  };

  // Refresh satellite data
  const refreshSatelliteData = () => {
    setLoading(true);
    setSatelliteStatus(prev => ({
      ...prev,
      processing: true,
      lastUpdate: new Date()
    }));
    
    // Simulate satellite data refresh
    setTimeout(() => {
      setLoading(false);
      setSatelliteStatus(prev => ({
        ...prev,
        processing: false,
        fieldsProcessed: fields.length,
        totalFields: fields.length
      }));
    }, 3000);
  };

  // Show loading state if no location or fields available
  if (!validLocation || fields.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 2 }}>
        <CircularProgress />
        <Typography variant="h6" color="text.secondary">
          Loading Google Earth Engine field data for your location...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          📍 {validLocation?.name || 'Setting up location...'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        🛰️ Field Analysis & Satellite Imagery
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        📍 Google Earth Engine analysis for {validLocation.name}
        {satelliteStatus.processing && (
          <Chip 
            label="🛰️ Processing satellite data..." 
            size="small" 
            color="primary" 
            sx={{ ml: 2 }}
          />
        )}
      </Typography>

      {/* Satellite Status Alert */}
      {satelliteStatus.processing && (
        <Alert severity="info" sx={{ mb: 3 }}>
          🛰️ Google Earth Engine is processing satellite imagery for field analysis. This may take a few moments...
        </Alert>
      )}

      {analysisComplete && (
        <Alert severity="success" sx={{ mb: 3 }}>
          ✅ Satellite analysis completed! Real-time field data now available from Google Earth Engine.
        </Alert>
      )}

      {/* Control Panel */}
      <ControlPanel>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Field</InputLabel>
              <Select
                value={selectedField}
                label="Field"
                onChange={(e) => setSelectedField(e.target.value)}
              >
                {fields.map((field) => (
                  <MenuItem key={field.id} value={field.id}>
                    {field.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Analysis Layer</InputLabel>
              <Select
                value={selectedLayer}
                label="Analysis Layer"
                onChange={(e) => setSelectedLayer(e.target.value)}
              >
                <MenuItem value="ndvi">NDVI (Vegetation Health)</MenuItem>
                <MenuItem value="ndre">NDRE (Red Edge)</MenuItem>
                <MenuItem value="moisture">Soil Moisture</MenuItem>
                <MenuItem value="temperature">Surface Temperature</MenuItem>
                <MenuItem value="trueColor">True Color (RGB)</MenuItem>
                <MenuItem value="falseColor">False Color (NIR)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                label="Date Range"
                onChange={(e) => setDateRange(e.target.value)}
              >
                <MenuItem value="latest">Latest Available</MenuItem>
                <MenuItem value="week">Past Week</MenuItem>
                <MenuItem value="month">Past Month</MenuItem>
                <MenuItem value="season">Current Season</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={showZones}
                  onChange={(e) => setShowZones(e.target.checked)}
                />
              }
              label="Management Zones"
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
              fullWidth
              size="small"
              onClick={refreshSatelliteData}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Refresh Data'}
            </Button>
          </Grid>
        </Grid>
      </ControlPanel>

      <Grid container spacing={3}>
        {/* Google Earth Engine Map */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 600 }}>
            <CardContent sx={{ p: 0, height: '100%' }}>
              <GoogleEarthEngineMap 
                fields={fields}
                currentLocation={validLocation}
                selectedField={selectedField}
                selectedLayer={selectedLayer}
                showManagementZones={showZones}
                onFieldSelect={setSelectedField}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Field Statistics */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2}>
            {/* Current Field Info */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    📊 Field Statistics
                  </Typography>
                  {currentField && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Field Name
                        </Typography>
                        <Typography variant="h6">
                          {currentField.name}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Total Area
                        </Typography>
                        <Typography variant="h6">
                          {currentField.area} hectares
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Current Growth Stage
                        </Typography>
                        <Chip 
                          label={currentField.growthStage} 
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                      
                      <Divider />
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Average NDVI
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {currentField.ndvi}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Average NDRE
                        </Typography>
                        <Typography variant="h6" color="warning.main">
                          {currentField.ndre}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Overall Health Score
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {currentField.health}%
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Zone Analysis */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    🎯 Management Zone Analysis
                  </Typography>
                  {currentField && currentField.zones.map((zone) => (
                    <Box key={zone.id} sx={{ mb: 2, p: 1, border: '1px solid #eee', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          Zone {zone.id}
                        </Typography>
                        <Chip 
                          label={zone.status} 
                          size="small"
                          color={zone.status === 'excellent' ? 'success' : zone.status === 'good' ? 'primary' : 'warning'}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        NDVI: {zone.ndvi} | Health: {zone.health}%
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            {/* Satellite Processing Status */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    🛰️ Satellite Processing
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Google Earth Engine Status
                    </Typography>
                    <Chip 
                      label={satelliteStatus.processing ? "Processing" : "Ready"} 
                      color={satelliteStatus.processing ? "warning" : "success"}
                      variant="filled"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Fields Processed: {satelliteStatus.fieldsProcessed}/{fields.length}
                    </Typography>
                    <Box sx={{ width: '100%', mt: 1 }}>
                      <div style={{ 
                        width: '100%', 
                        height: '6px', 
                        backgroundColor: '#e0e0e0', 
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${fields.length > 0 ? (satelliteStatus.fieldsProcessed / fields.length) * 100 : 0}%`,
                          height: '100%',
                          backgroundColor: '#4caf50',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </Box>
                  </Box>

                  {satelliteStatus.lastUpdate && (
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {satelliteStatus.lastUpdate.toLocaleTimeString()}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<TimelineIcon />}
                      size="small"
                    >
                      View Time Series
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      size="small"
                    >
                      Export Analysis
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<SatelliteIcon />}
                      size="small"
                    >
                      Download Imagery
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Advanced Field Analysis Component */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <AdvancedFieldAnalysisComponent 
            fieldData={currentField ? {
              id: currentField.id,
              name: currentField.name,
              coordinates: [currentField.coordinates.lat, currentField.coordinates.lng],
              bounds: currentField.bounds
            } : null}
            onAnalysisComplete={handleAnalysisComplete}
          />
        </Grid>

        {/* Satellite Data Visualization */}
        <Grid item xs={12}>
          <SatelliteDataVisualization 
            fields={fields}
            processingStatus={satelliteStatus}
            selectedField={selectedField}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default FieldAnalysis;
