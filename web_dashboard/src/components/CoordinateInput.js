/**
 * Coordinate Input Component
 * Provides latitude and longitude input fields with validation and location services
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment,
  Card,
  CardContent,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Info as InfoIcon,
  Clear as ClearIcon,
  Map as MapIcon
} from '@mui/icons-material';

const CoordinateInput = ({ 
  value = { lat: '', lng: '' }, 
  onChange, 
  label = "Field Coordinates",
  error = false,
  helperText = "",
  showCurrentLocation = true,
  showPlaceName = true,
  disabled = false
}) => {
  const [coordinates, setCoordinates] = useState(value);
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [geoError, setGeoError] = useState('');
  const [validationError, setValidationError] = useState('');

  // Update internal state when prop changes
  useEffect(() => {
    setCoordinates(value);
  }, [value]);

  // Validate coordinates
  const validateCoordinates = (lat, lng) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    if (isNaN(latNum) || isNaN(lngNum)) {
      return "Please enter valid numeric coordinates";
    }
    
    if (latNum < -90 || latNum > 90) {
      return "Latitude must be between -90 and 90 degrees";
    }
    
    if (lngNum < -180 || lngNum > 180) {
      return "Longitude must be between -180 and 180 degrees";
    }
    
    return null;
  };

  // Handle coordinate changes
  const handleCoordinateChange = (field, value) => {
    const newCoords = { ...coordinates, [field]: value };
    setCoordinates(newCoords);
    
    // Validate if both fields have values
    if (newCoords.lat && newCoords.lng) {
      const error = validateCoordinates(newCoords.lat, newCoords.lng);
      setValidationError(error || '');
      
      if (!error) {
        onChange && onChange(newCoords);
        if (showPlaceName) {
          reverseGeocode(newCoords.lat, newCoords.lng);
        }
      }
    } else {
      setValidationError('');
      setLocationName('');
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        
        const newCoords = { lat, lng };
        setCoordinates(newCoords);
        setLoading(false);
        
        onChange && onChange(newCoords);
        
        if (showPlaceName) {
          reverseGeocode(lat, lng);
        }
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Location access denied by user');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Location information is unavailable');
            break;
          case error.TIMEOUT:
            setGeoError('Location request timed out');
            break;
          default:
            setGeoError('An unknown error occurred');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  // Reverse geocoding to get place name
  const reverseGeocode = async (lat, lng) => {
    try {
      // Using OpenStreetMap Nominatim API (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        // Extract relevant location info
        const address = data.address || {};
        const locationParts = [
          address.city || address.town || address.village,
          address.state || address.region,
          address.country
        ].filter(Boolean);
        
        setLocationName(locationParts.join(', ') || data.display_name);
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      setLocationName('');
    }
  };

  // Clear coordinates
  const clearCoordinates = () => {
    setCoordinates({ lat: '', lng: '' });
    setLocationName('');
    setValidationError('');
    setGeoError('');
    onChange && onChange({ lat: '', lng: '' });
  };

  // Check if coordinates are valid
  const hasValidCoordinates = coordinates.lat && coordinates.lng && !validationError;

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationIcon color="primary" />
            {label}
            <Tooltip title="Enter latitude and longitude coordinates for precise field location">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
          
          {/* Coordinate Inputs */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Latitude"
                value={coordinates.lat}
                onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                placeholder="e.g., 40.7128"
                disabled={disabled || loading}
                error={!!validationError && coordinates.lat}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography variant="caption" color="text.secondary">
                        °N
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                helperText="Range: -90 to 90"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Longitude"
                value={coordinates.lng}
                onChange={(e) => handleCoordinateChange('lng', e.target.value)}
                placeholder="e.g., -74.0060"
                disabled={disabled || loading}
                error={!!validationError && coordinates.lng}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography variant="caption" color="text.secondary">
                        °E
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                helperText="Range: -180 to 180"
              />
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {showCurrentLocation && (
              <Button
                variant="outlined"
                size="small"
                startIcon={loading ? <CircularProgress size={16} /> : <MyLocationIcon />}
                onClick={getCurrentLocation}
                disabled={disabled || loading}
              >
                {loading ? 'Getting Location...' : 'Use Current Location'}
              </Button>
            )}
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearCoordinates}
              disabled={disabled || (!coordinates.lat && !coordinates.lng)}
            >
              Clear
            </Button>
            
            {hasValidCoordinates && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<MapIcon />}
                onClick={() => {
                  const url = `https://www.google.com/maps/@${coordinates.lat},${coordinates.lng},15z`;
                  window.open(url, '_blank');
                }}
              >
                View on Map
              </Button>
            )}
          </Box>

          {/* Location Name Display */}
          {locationName && showPlaceName && (
            <Box sx={{ mt: 2 }}>
              <Chip
                icon={<LocationIcon />}
                label={locationName}
                variant="outlined"
                color="primary"
                size="small"
              />
            </Box>
          )}

          {/* Error Messages */}
          {validationError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {validationError}
            </Alert>
          )}
          
          {geoError && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {geoError}
            </Alert>
          )}
          
          {helperText && !validationError && !geoError && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {helperText}
            </Alert>
          )}

          {/* Coordinate Format Examples */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Example coordinates:
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                • New York: 40.7128, -74.0060
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                • London: 51.5074, -0.1278
              </Typography>
              <br />
              <Typography variant="caption" color="text.secondary">
                • Delhi: 28.6139, 77.2090
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CoordinateInput;
