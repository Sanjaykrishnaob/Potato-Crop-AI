import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Paper,
  Chip,
  Tooltip,
  Alert,
  MenuList,
  MenuItem,
  ClickAwayListener,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  Public as PublicIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useLocation } from '../contexts/LocationContext';

const LocationPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  background: 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.99)',
  },
  '&:focus-within': {
    background: 'rgba(255, 255, 255, 1)',
    backdropFilter: 'none',
    boxShadow: theme.shadows[4],
  },
}));

const StyledLocationTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 1)',
      backdropFilter: 'none',
    },
  },
  '& .MuiOutlinedInput-input': {
    backgroundColor: 'transparent !important',
    color: 'inherit',
    '&:focus': {
      backgroundColor: 'transparent !important',
    },
    '&::placeholder': {
      opacity: 0.7,
      color: 'inherit',
    },
  },
  '& .MuiAutocomplete-input': {
    backgroundColor: 'transparent !important',
    '&:focus': {
      backgroundColor: 'transparent !important',
    },
  },
}));

// Predefined agricultural locations in India with coordinates
const AGRICULTURAL_LOCATIONS = [
  // Major Agricultural States
  { name: 'Bangalore, Karnataka', lat: 12.9716, lng: 77.5946, type: 'city' },
  { name: 'Punjab, India', lat: 31.1471, lng: 75.3412, type: 'state' },
  { name: 'Haryana, India', lat: 29.0588, lng: 76.0856, type: 'state' },
  { name: 'Uttar Pradesh, India', lat: 26.8467, lng: 80.9462, type: 'state' },
  { name: 'Maharashtra, India', lat: 19.7515, lng: 75.7139, type: 'state' },
  { name: 'West Bengal, India', lat: 22.9868, lng: 87.8550, type: 'state' },
  { name: 'Gujarat, India', lat: 22.2587, lng: 71.1924, type: 'state' },
  { name: 'Rajasthan, India', lat: 27.0238, lng: 74.2179, type: 'state' },
  { name: 'Madhya Pradesh, India', lat: 22.9734, lng: 78.6569, type: 'state' },
  
  // Major Potato Growing Regions
  { name: 'Agra, Uttar Pradesh', lat: 27.1767, lng: 78.0081, type: 'potato-region' },
  { name: 'Hooghly, West Bengal', lat: 22.9000, lng: 88.3667, type: 'potato-region' },
  { name: 'Nashik, Maharashtra', lat: 19.9975, lng: 73.7898, type: 'potato-region' },
  { name: 'Hassan, Karnataka', lat: 13.0072, lng: 76.0962, type: 'potato-region' },
  { name: 'Shimla, Himachal Pradesh', lat: 31.1048, lng: 77.1734, type: 'potato-region' },
  { name: 'Farrukhabad, Uttar Pradesh', lat: 27.3895, lng: 79.5808, type: 'potato-region' },
  { name: 'Jalandhar, Punjab', lat: 31.3260, lng: 75.5762, type: 'potato-region' },
  
  // Major Cities
  { name: 'Delhi, India', lat: 28.7041, lng: 77.1025, type: 'city' },
  { name: 'Mumbai, Maharashtra', lat: 19.0760, lng: 72.8777, type: 'city' },
  { name: 'Chennai, Tamil Nadu', lat: 13.0827, lng: 80.2707, type: 'city' },
  { name: 'Kolkata, West Bengal', lat: 22.5726, lng: 88.3639, type: 'city' },
  { name: 'Pune, Maharashtra', lat: 18.5204, lng: 73.8567, type: 'city' },
  { name: 'Hyderabad, Telangana', lat: 17.3850, lng: 78.4867, type: 'city' },
  { name: 'Ahmedabad, Gujarat', lat: 23.0225, lng: 72.5714, type: 'city' },
  { name: 'Jaipur, Rajasthan', lat: 26.9124, lng: 75.7873, type: 'city' },
  { name: 'Lucknow, Uttar Pradesh', lat: 26.8467, lng: 80.9462, type: 'city' },
];

function LocationSelector({ compact = false }) {
  const { 
    currentLocation, 
    updateLocation, 
    isLoading, 
    gpsAvailable, 
    locationError, 
    getCurrentPosition,
    refreshLocation 
  } = useLocation();
  
  const [searchValue, setSearchValue] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [suggestions] = useState(AGRICULTURAL_LOCATIONS);
  const [userHasTyped, setUserHasTyped] = useState(false); // Track if user has manually typed
  const textFieldRef = useRef(null);
  const dropdownRef = useRef(null);

  // Set initial location name only when user hasn't manually typed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (currentLocation && !userHasTyped && !searchValue) {
      const locationName = currentLocation.name || 
        (currentLocation.lat && currentLocation.lng ? 
          `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 
          'Unknown Location');
      setSearchValue(locationName);
    }
  }, [currentLocation]); // Removed searchValue from dependencies to prevent feedback loop

  // Filter suggestions based on search value
  const filterSuggestions = useCallback((value) => {
    if (!value) {
      setFilteredSuggestions(suggestions.slice(0, 10)); // Show top 10 by default
      return;
    }
    
    const filtered = suggestions.filter(option =>
      option.name.toLowerCase().includes(value.toLowerCase())
    );
    
    // Prioritize potato regions in search results
    const sorted = filtered.sort((a, b) => {
      if (a.type === 'potato-region' && b.type !== 'potato-region') return -1;
      if (b.type === 'potato-region' && a.type !== 'potato-region') return 1;
      return 0;
    });
    
    setFilteredSuggestions(sorted.slice(0, 8)); // Limit to 8 results
  }, [suggestions]);

  // Debounced input change handler to prevent glitching
  const handleInputChange = useCallback((event) => {
    const value = event.target.value;
    
    // Mark that user has manually typed
    setUserHasTyped(true);
    
    // Use setTimeout to debounce rapid typing
    setTimeout(() => {
      setSearchValue(value);
      filterSuggestions(value);
      setShowDropdown(true);
      setSelectedIndex(-1);
    }, 0);
  }, [filterSuggestions]);

  const handleLocationSelect = useCallback((location) => {
    setSearchValue(location.name);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setUserHasTyped(false); // Reset flag when location is selected programmatically
    updateLocation({
      lat: location.lat,
      lng: location.lng,
      name: location.name,
      type: location.type
    });
  }, [updateLocation]);

  const handleKeyDown = useCallback((event) => {
    if (!showDropdown || filteredSuggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
          handleLocationSelect(filteredSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      default:
        // Handle other keys (no action needed)
        break;
    }
  }, [showDropdown, filteredSuggestions, selectedIndex, handleLocationSelect]);

  const handleFocus = useCallback(() => {
    filterSuggestions(searchValue);
    setShowDropdown(true);
  }, [searchValue, filterSuggestions]);

  const handleClickAway = useCallback(() => {
    setShowDropdown(false);
    setSelectedIndex(-1);
  }, []);

  const handleCurrentLocation = async () => {
    try {
      const location = await getCurrentPosition();
      setSearchValue(location.name);
      setUserHasTyped(false); // Reset flag when using GPS location
    } catch (error) {
      console.error('Failed to get current location:', error);
    }
  };

  const handleRefreshLocation = async () => {
    if (currentLocation?.type === 'current') {
      await refreshLocation();
      setUserHasTyped(false); // Reset flag when refreshing location
    }
  };

  const getLocationIcon = (type) => {
    switch (type) {
      case 'potato-region':
        return '🥔';
      case 'state':
        return '🌾';
      case 'city':
        return '🏙️';
      case 'current':
        return '📍';
      default:
        return '📍';
    }
  };

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={<LocationIcon />}
          label={currentLocation?.name || 'Select Location'}
          onClick={() => {}} // Could open a modal for location selection
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>
    );
  }

  return (
    <Box>
      {locationError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {locationError}
        </Alert>
      )}
      
      <LocationPaper elevation={2}>
        <PublicIcon color="primary" />
        
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Farm Location
          </Typography>
          
          <ClickAwayListener onClickAway={handleClickAway}>
            <Box>
              <StyledLocationTextField
                ref={textFieldRef}
                value={searchValue}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                placeholder="Search for agricultural location..."
                size="small"
                autoComplete="off"
                spellCheck={false}
                sx={{ 
                  minWidth: 300,
                  '& .MuiOutlinedInput-input': {
                    textAlign: 'left !important',
                  }
                }}
                inputProps={{
                  style: { textAlign: 'left' },
                  'aria-label': 'Agricultural location search',
                  'aria-expanded': showDropdown,
                  'aria-haspopup': 'listbox',
                  role: 'combobox'
                }}
              />
              
              {showDropdown && filteredSuggestions.length > 0 && (
                <Paper
                  ref={dropdownRef}
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1300,
                    maxHeight: 300,
                    overflow: 'auto',
                    mt: 0.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  }}
                >
                  <MenuList dense>
                    {filteredSuggestions.map((option, index) => (
                      <MenuItem
                        key={option.name}
                        selected={index === selectedIndex}
                        onClick={() => handleLocationSelect(option)}
                        sx={{
                          py: 1.5,
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(46, 125, 50, 0.08)',
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(46, 125, 50, 0.04)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                          <Typography sx={{ fontSize: '1.2rem' }}>
                            {getLocationIcon(option.type)}
                          </Typography>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {option.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.type === 'potato-region' ? '🥔 Potato Growing Region' :
                               option.type === 'state' ? '🌾 Agricultural State' :
                               option.type === 'city' ? '🏙️ Major City' : '📍 Location'}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </MenuList>
                </Paper>
              )}
            </Box>
          </ClickAwayListener>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {currentLocation?.type === 'current' && (
            <Tooltip title="Refresh current location">
              <IconButton
                onClick={handleRefreshLocation}
                disabled={isLoading}
                color="primary"
                size="small"
              >
                {isLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title={gpsAvailable ? "Use current location" : "GPS not available"}>
            <span>
              <IconButton
                onClick={handleCurrentLocation}
                disabled={isLoading || !gpsAvailable}
                color="primary"
              >
                {isLoading ? <CircularProgress size={20} /> : <MyLocationIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </LocationPaper>
    </Box>
  );
}

export default LocationSelector;
