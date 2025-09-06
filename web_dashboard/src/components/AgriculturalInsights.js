import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Agriculture as AgricultureIcon,
  WaterDrop as WaterIcon,
  Thermostat as TempIcon,
  Air as WindIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useLocation } from '../contexts/LocationContext';
import weatherService from '../services/weatherService';

const InsightCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
  border: '1px solid rgba(0, 0, 0, 0.1)',
}));

const MetricBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  borderRadius: theme.spacing(1),
  background: 'rgba(255, 255, 255, 0.7)',
  marginBottom: theme.spacing(1),
}));

// Agricultural insights based on location and weather
const getLocationInsights = (location, weather) => {
  const insights = [];
  
  // Location-specific insights
  if (location?.type === 'potato-region') {
    insights.push({
      type: 'success',
      title: '🥔 Optimal Potato Region',
      message: 'This area is known for successful potato cultivation. Ideal soil and climate conditions.',
      priority: 'High'
    });
  }
  
  if (location?.name?.includes('Punjab') || location?.name?.includes('Haryana')) {
    insights.push({
      type: 'info',
      title: '🌾 Green Revolution Belt',
      message: 'High agricultural productivity region with advanced farming techniques.',
      priority: 'Medium'
    });
  }
  
  if (location?.name?.includes('Karnataka') || location?.name?.includes('Bangalore')) {
    insights.push({
      type: 'info',
      title: '🌱 Tech Agriculture Hub',
      message: 'Access to modern agricultural technology and research facilities.',
      priority: 'Medium'
    });
  }
  
  // Weather-based insights
  if (weather) {
    if (weather.temperature > 30) {
      insights.push({
        type: 'warning',
        title: '🌡️ High Temperature Alert',
        message: 'Consider increasing irrigation frequency and providing shade protection.',
        priority: 'High'
      });
    }
    
    if (weather.humidity < 40) {
      insights.push({
        type: 'warning',
        title: '💧 Low Humidity Warning',
        message: 'Monitor plants for water stress. Consider misting systems.',
        priority: 'Medium'
      });
    }
    
    if (weather.temperature >= 15 && weather.temperature <= 25 && weather.humidity >= 60) {
      insights.push({
        type: 'success',
        title: '✅ Ideal Growing Conditions',
        message: 'Perfect temperature and humidity for potato growth.',
        priority: 'Low'
      });
    }
    
    if (weather.windSpeed > 15) {
      insights.push({
        type: 'info',
        title: '💨 High Wind Advisory',
        message: 'Delay pesticide/fertilizer applications until wind subsides.',
        priority: 'Medium'
      });
    }
  }
  
  return insights;
};

function AgriculturalInsights({ compact = false }) {
  const { currentLocation } = useLocation();
  const [weather, setWeather] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch weather data for insights
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!currentLocation) return;
      
      setLoading(true);
      try {
        const weatherData = await weatherService.getCurrentWeather(currentLocation);
        setWeather(weatherData);
        
        // Generate insights based on location and weather
        const newInsights = getLocationInsights(currentLocation, weatherData);
        setInsights(newInsights);
      } catch (error) {
        console.error('Error fetching weather for insights:', error);
        // Generate location-only insights
        const newInsights = getLocationInsights(currentLocation, null);
        setInsights(newInsights);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [currentLocation]);

  if (loading) {
    return (
      <InsightCard>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            🔍 Agricultural Insights
          </Typography>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Analyzing conditions for {currentLocation?.name}...
          </Typography>
        </CardContent>
      </InsightCard>
    );
  }

  return (
    <InsightCard>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          🔍 Agricultural Insights
        </Typography>
        
        {currentLocation && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Analysis for: <strong>{currentLocation.name}</strong>
            </Typography>
            {currentLocation.type && (
              <Chip 
                label={
                  currentLocation.type === 'potato-region' ? '🥔 Potato Region' :
                  currentLocation.type === 'state' ? '🌾 Agricultural State' :
                  currentLocation.type === 'city' ? '🏙️ Urban Area' : '📍 Location'
                } 
                size="small" 
                variant="outlined"
                sx={{ mb: 1 }}
              />
            )}
          </Box>
        )}

        {weather && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Current Conditions:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <MetricBox>
                <TempIcon fontSize="small" color="primary" />
                <Typography variant="body2">
                  {weather.temperature}°C
                </Typography>
              </MetricBox>
              <MetricBox>
                <WaterIcon fontSize="small" color="info" />
                <Typography variant="body2">
                  {weather.humidity}% RH
                </Typography>
              </MetricBox>
              <MetricBox>
                <WindIcon fontSize="small" color="secondary" />
                <Typography variant="body2">
                  {Math.round(weather.windSpeed)} m/s
                </Typography>
              </MetricBox>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {insights.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {insights.slice(0, compact ? 2 : 4).map((insight, index) => (
              <Alert 
                key={index}
                severity={insight.type}
                variant="outlined"
                sx={{ 
                  '& .MuiAlert-message': { 
                    fontSize: '0.875rem' 
                  }
                }}
              >
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  {insight.title}
                </Typography>
                <Typography variant="caption">
                  {insight.message}
                </Typography>
              </Alert>
            ))}
            
            {insights.length > (compact ? 2 : 4) && (
              <Typography variant="caption" color="text.secondary" textAlign="center">
                +{insights.length - (compact ? 2 : 4)} more insights available
              </Typography>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Select a location to get agricultural insights
          </Typography>
        )}
      </CardContent>
    </InsightCard>
  );
}

export default AgriculturalInsights;
