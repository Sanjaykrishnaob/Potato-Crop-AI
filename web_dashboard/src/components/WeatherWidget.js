import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Tooltip,
  IconButton,
  Paper,
  Chip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  Cloud as CloudIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import weatherService from '../services/weatherService';
import { useLocation } from '../contexts/LocationContext';

const WeatherPaper = styled(Paper)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1, 2),
  borderRadius: '20px',
  background: 'rgba(46, 139, 87, 0.1)',
  border: '1px solid rgba(46, 139, 87, 0.2)',
  backdropFilter: 'blur(10px)',
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const CompactWeatherDisplay = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  borderRadius: '20px',
  background: 'rgba(46, 139, 87, 0.1)',
}));

function WeatherWidget({ compact = false, showLocation = true }) {
  const { currentLocation } = useLocation();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch weather data
  const fetchWeather = async () => {
    if (!currentLocation) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🌤️ WeatherWidget: Fetching weather for', currentLocation.name);
      const weatherData = await weatherService.getCurrentWeather(currentLocation);
      console.log('✅ WeatherWidget: Received weather data:', weatherData);
      setWeather(weatherData);
    } catch (err) {
      console.error('❌ WeatherWidget: Error fetching weather:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and when location changes
  useEffect(() => {
    fetchWeather();
  }, [currentLocation]);

  // Get weather emoji based on condition
  const getWeatherEmoji = (condition) => {
    if (!condition) return '🌤️';
    
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) {
      return '☀️';
    } else if (conditionLower.includes('partly cloudy') || conditionLower.includes('partly')) {
      return '⛅';
    } else if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
      return '☁️';
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return '🌧️';
    } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
      return '⛈️';
    } else if (conditionLower.includes('snow')) {
      return '❄️';
    } else if (conditionLower.includes('mist') || conditionLower.includes('fog')) {
      return '🌫️';
    } else {
      return '🌤️';
    }
  };

  // Loading state
  if (loading) {
    return compact ? (
      <CompactWeatherDisplay>
        <CircularProgress size={16} />
        <Typography variant="caption">Loading...</Typography>
      </CompactWeatherDisplay>
    ) : (
      <WeatherPaper elevation={1}>
        <CircularProgress size={20} />
        <Typography variant="body2">Loading weather...</Typography>
      </WeatherPaper>
    );
  }

  // Error state
  if (error) {
    return compact ? (
      <CompactWeatherDisplay>
        <CloudIcon fontSize="small" color="error" />
        <Typography variant="caption" color="error">
          Weather unavailable
        </Typography>
      </CompactWeatherDisplay>
    ) : (
      <WeatherPaper elevation={1}>
        <CloudIcon color="error" />
        <Typography variant="body2" color="error">
          Weather data unavailable
        </Typography>
        <IconButton size="small" onClick={fetchWeather}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </WeatherPaper>
    );
  }

  // No data state
  if (!weather) {
    return null;
  }

  // Compact display for mobile/small spaces
  if (compact) {
    return (
      <CompactWeatherDisplay>
        <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>
          {getWeatherEmoji(weather.condition)}
        </Typography>
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {weather.temperature}°C
          </Typography>
          {showLocation && (
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {weather.location}
            </Typography>
          )}
        </Box>
      </CompactWeatherDisplay>
    );
  }

  // Full display
  return (
    <WeatherPaper elevation={1}>
      <Typography variant="body2" sx={{ fontSize: '1.5rem' }}>
        {getWeatherEmoji(weather.condition)}
      </Typography>
      
      <Box>
        <Typography variant="body2" fontWeight="medium">
          {weather.temperature}°C
        </Typography>
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {weather.condition}
        </Typography>
      </Box>

      {showLocation && weather.location && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LocationIcon fontSize="small" sx={{ opacity: 0.6 }} />
          <Typography variant="caption" sx={{ opacity: 0.8, maxWidth: 120 }} noWrap>
            {weather.location}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {weather.isRealData && (
          <Chip 
            label="Live" 
            size="small" 
            color="success" 
            sx={{ height: 16, fontSize: '0.6rem' }}
          />
        )}
        
        <Tooltip title={`Refresh weather data\nLast updated: ${new Date(weather.lastUpdated).toLocaleTimeString()}`}>
          <IconButton size="small" onClick={fetchWeather} disabled={loading}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </WeatherPaper>
  );
}

export default WeatherWidget;
