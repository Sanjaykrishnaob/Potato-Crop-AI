// Google Earth Engine Map Component
// Interactive map with satellite imagery and agricultural data visualization

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Alert,
  Slider,
  Switch,
  FormControlLabel,
  Paper,
  Button
} from '@mui/material';
import {
  Layers as LayersIcon,
  Satellite as SatelliteIcon,
  MyLocation as MyLocationIcon,
  Fullscreen as FullscreenIcon,
  Timeline as TimelineIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import geeService from '../services/googleEarthEngineService';
import satelliteProcessor from '../services/realTimeSatelliteProcessor';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom field marker with health color coding
const createFieldIcon = (health, isSelected = false) => {
  const color = health >= 80 ? '#22c55e' : health >= 60 ? '#f97316' : '#ef4444';
  const size = isSelected ? 25 : 20;
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 10px;
      ">
        ${Math.round(health)}
      </div>
    `,
    className: 'custom-field-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

// Map component for handling events and updates
const MapEventHandler = ({ onLocationSelect, fields, selectedField, onFieldSelect }) => {
  const map = useMap();

  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng);
    }
  });

  useEffect(() => {
    if (selectedField && fields) {
      const field = fields.find(f => f.id === selectedField);
      if (field) {
        map.setView([field.coordinates.lat, field.coordinates.lng], 15);
      }
    }
  }, [selectedField, fields, map]);

  return null;
};

// Satellite layer selector component
const SatelliteLayerSelector = ({ selectedLayer, onLayerChange, opacity, onOpacityChange, showLayer, onToggleLayer }) => {
  const layers = [
    { id: 'ndvi', name: 'NDVI', description: 'Vegetation Health' },
    { id: 'ndre', name: 'NDRE', description: 'Chlorophyll Content' },
    { id: 'evi', name: 'EVI', description: 'Enhanced Vegetation' },
    { id: 'moisture', name: 'Soil Moisture', description: 'Water Content' },
    { id: 'temperature', name: 'Land Temperature', description: 'Surface Temperature' },
    { id: 'true-color', name: 'True Color', description: 'Natural Colors' }
  ];

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <LayersIcon color="primary" />
        <Typography variant="h6">Satellite Layers</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showLayer}
              onChange={(e) => onToggleLayer(e.target.checked)}
              size="small"
            />
          }
          label="Show Layer"
        />
      </Box>

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Layer Type</InputLabel>
        <Select
          value={selectedLayer}
          onChange={(e) => onLayerChange(e.target.value)}
          label="Layer Type"
          disabled={!showLayer}
        >
          {layers.map((layer) => (
            <MenuItem key={layer.id} value={layer.id}>
              <Box>
                <Typography variant="body2">{layer.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {layer.description}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {showLayer && (
        <Box>
          <Typography variant="body2" gutterBottom>
            Layer Opacity: {Math.round(opacity * 100)}%
          </Typography>
          <Slider
            value={opacity}
            onChange={(e, value) => onOpacityChange(value)}
            min={0}
            max={1}
            step={0.1}
            size="small"
          />
        </Box>
      )}
    </Paper>
  );
};

// Field information panel
const FieldInfoPanel = ({ field, onClose }) => {
  if (!field) return null;

  const getHealthColor = (health) => {
    if (health >= 80) return 'success.main';
    if (health >= 60) return 'warning.main';
    return 'error.main';
  };

  return (
    <Paper elevation={3} sx={{ p: 2, mb: 2, maxHeight: 300, overflow: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">{field.name}</Typography>
        <IconButton size="small" onClick={onClose}>
          ×
        </IconButton>
      </Box>

      <Box display="flex" gap={1} mb={2}>
        <Chip 
          label={`${field.health}% Health`} 
          color={field.health >= 80 ? 'success' : field.health >= 60 ? 'warning' : 'error'}
          size="small"
        />
        <Chip label={field.growthStage} variant="outlined" size="small" />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Vegetation Indices</Typography>
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
          <Box>
            <Typography variant="caption">NDVI</Typography>
            <Typography variant="body2" fontWeight="bold">{field.ndvi}</Typography>
          </Box>
          <Box>
            <Typography variant="caption">NDRE</Typography>
            <Typography variant="body2" fontWeight="bold">{field.ndre}</Typography>
          </Box>
          <Box>
            <Typography variant="caption">EVI</Typography>
            <Typography variant="body2" fontWeight="bold">{field.evi}</Typography>
          </Box>
          <Box>
            <Typography variant="caption">SAVI</Typography>
            <Typography variant="body2" fontWeight="bold">{field.savi}</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Environmental</Typography>
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
          <Box>
            <Typography variant="caption">Temperature</Typography>
            <Typography variant="body2">{Math.round(field.temperature)}°C</Typography>
          </Box>
          <Box>
            <Typography variant="caption">Soil Moisture</Typography>
            <Typography variant="body2">{Math.round(field.soilMoisture)}%</Typography>
          </Box>
        </Box>
      </Box>

      {field.stressIndicators && field.stressIndicators.length > 0 && (
        <Alert severity="warning" size="small" sx={{ mb: 2 }}>
          <Typography variant="caption">
            {field.stressIndicators[0].message}
          </Typography>
        </Alert>
      )}

      {field.recommendations && field.recommendations.length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>Recommendations</Typography>
          {field.recommendations.slice(0, 2).map((rec, index) => (
            <Alert key={index} severity="info" size="small" sx={{ mb: 1 }}>
              <Typography variant="caption">{rec.action}</Typography>
            </Alert>
          ))}
        </Box>
      )}

      <Typography variant="caption" color="text.secondary">
        Last updated: {new Date(field.lastUpdated).toLocaleString()}
      </Typography>
    </Paper>
  );
};

const GoogleEarthEngineMap = ({ 
  customCoordinates = null, 
  onCoordinateSelect = null,
  allowCustomAnalysis = false 
}) => {
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedFieldData, setSelectedFieldData] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState('ndvi');
  const [layerOpacity, setLayerOpacity] = useState(0.7);
  const [showSatelliteLayer, setShowSatelliteLayer] = useState(true);
  const [mapCenter, setMapCenter] = useState([28.7041, 77.1025]); // Delhi NCR
  const [mapZoom, setMapZoom] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customMarker, setCustomMarker] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    loadMapData();
    
    // Subscribe to field updates
    const unsubscribe = satelliteProcessor.subscribe('field-update', (data) => {
      if (data.fields) {
        setFields(data.fields);
      }
    });

    return unsubscribe;
  }, []);

  // Handle custom coordinates
  useEffect(() => {
    if (customCoordinates && customCoordinates.lat && customCoordinates.lng) {
      const lat = parseFloat(customCoordinates.lat);
      const lng = parseFloat(customCoordinates.lng);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
        setMapZoom(15);
        setCustomMarker({ lat, lng });
        console.log('📍 Map centered on custom coordinates:', lat, lng);
      }
    } else {
      setCustomMarker(null);
    }
  }, [customCoordinates]);

  const loadMapData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current field status
      const status = await satelliteProcessor.getCurrentStatus();
      if (status.fields) {
        setFields(status.fields);
        
        // Set map center to first field if available
        if (status.fields.length > 0) {
          const firstField = status.fields[0];
          setMapCenter([firstField.coordinates.lat, firstField.coordinates.lng]);
        }
      }

    } catch (err) {
      console.error('Error loading map data:', err);
      setError('Failed to load satellite data');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldSelect = (field) => {
    setSelectedField(field.id);
    setSelectedFieldData(field);
    setMapCenter([field.coordinates.lat, field.coordinates.lng]);
    setMapZoom(15);
  };

  const handleLocationSelect = (latlng) => {
    console.log('Selected location:', latlng);
    // Here you could add functionality to analyze a custom location
  };

  const centerOnFields = () => {
    if (fields.length === 0) return;

    if (fields.length === 1) {
      const field = fields[0];
      setMapCenter([field.coordinates.lat, field.coordinates.lng]);
      setMapZoom(15);
    } else {
      // Calculate bounds for all fields
      const lats = fields.map(f => f.coordinates.lat);
      const lngs = fields.map(f => f.coordinates.lng);
      
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      
      setMapCenter([centerLat, centerLng]);
      setMapZoom(12);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Loading Satellite Map..." />
        <CardContent>
          <Alert severity="info">
            Initializing Google Earth Engine map and loading satellite data...
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Satellite Map" />
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Google Earth Engine Agricultural Map"
        subheader={`${fields.length} monitored fields • Real-time satellite data`}
        avatar={<SatelliteIcon color="primary" />}
        action={
          <Box display="flex" gap={1}>
            <Tooltip title="Center on Fields">
              <IconButton onClick={centerOnFields}>
                <MyLocationIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fullscreen">
              <IconButton>
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      
      <CardContent sx={{ p: 0, height: 'calc(100% - 64px)', position: 'relative' }}>
        {/* Map Controls Panel */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1000,
            width: 280,
            maxHeight: 'calc(100% - 32px)',
            overflow: 'auto'
          }}
        >
          <SatelliteLayerSelector
            selectedLayer={selectedLayer}
            onLayerChange={setSelectedLayer}
            opacity={layerOpacity}
            onOpacityChange={setLayerOpacity}
            showLayer={showSatelliteLayer}
            onToggleLayer={setShowSatelliteLayer}
          />

          {selectedFieldData && (
            <FieldInfoPanel
              field={selectedFieldData}
              onClose={() => {
                setSelectedField(null);
                setSelectedFieldData(null);
              }}
            />
          )}
        </Box>

        {/* Main Map */}
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          {/* Base Layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Satellite Base Layer Option */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            opacity={0.8}
          />

          {/* Field Markers */}
          {fields.map((field) => (
            <Marker
              key={field.id}
              position={[field.coordinates.lat, field.coordinates.lng]}
              icon={createFieldIcon(field.health, selectedField === field.id)}
              eventHandlers={{
                click: () => handleFieldSelect(field)
              }}
            >
              <Popup>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {field.name}
                  </Typography>
                  
                  <Box display="flex" gap={1} my={1}>
                    <Chip 
                      label={`${field.health}% Health`} 
                      size="small"
                      color={field.health >= 80 ? 'success' : field.health >= 60 ? 'warning' : 'error'}
                    />
                  </Box>

                  <Typography variant="body2" gutterBottom>
                    Growth Stage: {field.growthStage}
                  </Typography>

                  <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1} mb={1}>
                    <Box>
                      <Typography variant="caption">NDVI</Typography>
                      <Typography variant="body2">{field.ndvi}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption">NDRE</Typography>
                      <Typography variant="body2">{field.ndre}</Typography>
                    </Box>
                  </Box>

                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => handleFieldSelect(field)}
                  >
                    Analyze Field
                  </Button>

                  <Typography variant="caption" color="text.secondary">
                    Click marker for detailed analysis
                  </Typography>
                </Box>
              </Popup>
            </Marker>
          ))}

          {/* Custom Coordinate Marker */}
          {customMarker && (
            <Marker
              position={[customMarker.lat, customMarker.lng]}
              icon={L.divIcon({
                className: 'custom-location-marker',
                html: `<div style="
                  background-color: #ff4444;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  animation: pulse 2s infinite;
                "></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              })}
            >
              <Popup>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Custom Analysis Location
                  </Typography>
                  
                  <Typography variant="body2" gutterBottom>
                    Lat: {customMarker.lat.toFixed(6)}
                    <br />
                    Lng: {customMarker.lng.toFixed(6)}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Click "Analyze Field" to start satellite analysis at this location.
                  </Typography>
                </Box>
              </Popup>
            </Marker>
          )}

          {/* Map Event Handler */}
          <MapEventHandler
            onLocationSelect={handleLocationSelect}
            fields={fields}
            selectedField={selectedField}
            onFieldSelect={setSelectedField}
          />
        </MapContainer>

        {/* Legend */}
        <Paper
          elevation={2}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            p: 2,
            zIndex: 1000
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Field Health Legend
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#22c55e'
                }}
              />
              <Typography variant="caption">Excellent (80-100%)</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#f97316'
                }}
              />
              <Typography variant="caption">Good (60-79%)</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#ef4444'
                }}
              />
              <Typography variant="caption">Needs Attention (&lt;60%)</Typography>
            </Box>
          </Box>
        </Paper>
      </CardContent>
    </Card>
  );
};

export default GoogleEarthEngineMap;
