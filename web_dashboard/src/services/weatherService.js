/**
 * Real-time weather service integration
 * Supports multiple weather APIs with fallback
 */

// Weather API configuration
const WEATHER_APIS = {
  weatherapi: {
    baseUrl: 'https://api.weatherapi.com/v1',
    apiKey: process.env.REACT_APP_WEATHERAPI_KEY || 'your_api_key_here',
    enabled: true
  },
  openweather: {
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    apiKey: process.env.REACT_APP_OPENWEATHER_API_KEY || 'disabled',
    enabled: false
  }
};

// Default coordinates for Bangalore (VIT location)
const DEFAULT_COORDINATES = {
  lat: 12.9716,
  lng: 77.5946
};

class RealTimeWeatherService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Get current weather data
   * @param {Object} coordinates - Location coordinates {lat, lng, name}
   */
  async getCurrentWeather(coordinates = DEFAULT_COORDINATES) {
    console.log('🌤️ WeatherService: Getting current weather for', coordinates);
    const cacheKey = `current_${coordinates.lat}_${coordinates.lng}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      console.log('💾 WeatherService: Using cached weather data');
      return this.cache.get(cacheKey).data;
    }

    console.log('📡 WeatherService: Fetching fresh weather data...');
    try {
      let weatherData = null;

      // Try WeatherAPI first (no credit card required)
      if (WEATHER_APIS.weatherapi.enabled && WEATHER_APIS.weatherapi.apiKey !== 'your_api_key_here') {
        console.log('🌐 WeatherService: Trying WeatherAPI...');
        weatherData = await this.fetchWeatherAPICurrent(coordinates);
      }

      // Fallback to OpenWeatherMap
      if (!weatherData && WEATHER_APIS.openweather.enabled && WEATHER_APIS.openweather.apiKey !== 'disabled') {
        console.log('🌐 WeatherService: Trying OpenWeatherMap...');
        weatherData = await this.fetchOpenWeatherCurrent(coordinates);
      }

      // If all APIs fail, return mock data
      if (!weatherData) {
        console.log('🎭 WeatherService: Using mock weather data');
        weatherData = this.generateMockCurrentWeather(coordinates);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });

      console.log('✅ WeatherService: Weather data ready:', weatherData.source);
      return weatherData;
    } catch (error) {
      console.error('❌ WeatherService error:', error);
      return this.generateMockCurrentWeather(coordinates);
    }
  }

  /**
   * Get weather forecast
   */
  async getWeatherForecast(coordinates = DEFAULT_COORDINATES, days = 7) {
    const cacheKey = `forecast_${coordinates.lat}_${coordinates.lng}_${days}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey).data;
    }

    try {
      let forecastData = null;

      // Try WeatherAPI first
      if (WEATHER_APIS.weatherapi.enabled && WEATHER_APIS.weatherapi.apiKey !== 'your_api_key_here') {
        forecastData = await this.fetchWeatherAPIForecast(coordinates, days);
      }

      // Fallback to OpenWeatherMap
      if (!forecastData && WEATHER_APIS.openweather.enabled && WEATHER_APIS.openweather.apiKey !== 'disabled') {
        forecastData = await this.fetchOpenWeatherForecast(coordinates, days);
      }

      if (!forecastData) {
        forecastData = this.generateMockForecast(coordinates, days);
      }

      this.cache.set(cacheKey, {
        data: forecastData,
        timestamp: Date.now()
      });

      return forecastData;
    } catch (error) {
      console.error('Forecast service error:', error);
      return this.generateMockForecast(coordinates, days);
    }
  }

  /**
   * OpenWeatherMap API integration
   */
  async fetchOpenWeatherCurrent(coordinates) {
    const { apiKey, baseUrl } = WEATHER_APIS.openweather;
    const url = `${baseUrl}/weather?lat=${coordinates.lat}&lon=${coordinates.lng}&appid=${apiKey}&units=metric`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OpenWeather API error: ${response.status}`);
    
    const data = await response.json();
    
    return {
      temperature: Math.round(data.main.temp),
      condition: this.mapOpenWeatherCondition(data.weather[0].main),
      humidity: data.main.humidity,
      windSpeed: data.wind?.speed || 0,
      pressure: data.main.pressure,
      visibility: data.visibility ? data.visibility / 1000 : null,
      uvIndex: null, // Requires separate API call
      sunrise: new Date(data.sys.sunrise * 1000).toTimeString().slice(0, 5),
      sunset: new Date(data.sys.sunset * 1000).toTimeString().slice(0, 5),
      location: data.name,
      lastUpdated: new Date().toISOString(),
      source: 'OpenWeatherMap'
    };
  }

  async fetchOpenWeatherForecast(coordinates, days) {
    const { apiKey, baseUrl } = WEATHER_APIS.openweather;
    const url = `${baseUrl}/forecast?lat=${coordinates.lat}&lon=${coordinates.lng}&appid=${apiKey}&units=metric`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OpenWeather forecast error: ${response.status}`);
    
    const data = await response.json();
    
    // Process 5-day forecast (every 3 hours)
    const dailyForecasts = this.processForecastData(data.list, days);
    
    return {
      forecast: dailyForecasts,
      source: 'OpenWeatherMap'
    };
  }

  /**
   * WeatherAPI.com integration (alternative)
   */
  async fetchWeatherAPICurrent(coordinates) {
    const { apiKey, baseUrl } = WEATHER_APIS.weatherapi;
    const url = `${baseUrl}/current.json?key=${apiKey}&q=${coordinates.lat},${coordinates.lng}&aqi=yes`;
    
    console.log('📡 WeatherAPI: Making request to', url.replace(apiKey, 'KEY_HIDDEN'));
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`WeatherAPI error: ${response.status}`);
    
    const data = await response.json();
    
    console.log('✅ WeatherAPI: Successfully fetched data for', data.location.name);
    
    return {
      temperature: Math.round(data.current.temp_c),
      condition: data.current.condition.text,
      humidity: data.current.humidity,
      windSpeed: data.current.wind_kph / 3.6, // Convert to m/s
      pressure: data.current.pressure_mb,
      visibility: data.current.vis_km,
      uvIndex: data.current.uv,
      location: data.location.name,
      region: data.location.region,
      country: data.location.country,
      coordinates: {
        lat: data.location.lat,
        lng: data.location.lon
      },
      lastUpdated: new Date().toISOString(),
      source: '🌐 WeatherAPI (Live Data)',
      isRealData: true
    };
  }

  async fetchWeatherAPIForecast(coordinates, days) {
    const { apiKey, baseUrl } = WEATHER_APIS.weatherapi;
    const url = `${baseUrl}/forecast.json?key=${apiKey}&q=${coordinates.lat},${coordinates.lng}&days=${Math.min(days, 10)}&aqi=no&alerts=no`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`WeatherAPI forecast error: ${response.status}`);
    
    const data = await response.json();
    
    const forecast = data.forecast.forecastday.map(day => ({
      date: day.date,
      day: new Date(day.date).toLocaleDateString('en', { weekday: 'long' }),
      temp: Math.round(day.day.avgtemp_c),
      condition: day.day.condition.text,
      humidity: day.day.avghumidity,
      windSpeed: Math.round(day.day.maxwind_kph / 3.6), // Convert to m/s
      rain: day.day.totalprecip_mm || 0
    }));
    
    return {
      forecast,
      source: 'WeatherAPI'
    };
  }
  processForecastData(forecastList, days) {
    const dailyData = {};
    
    forecastList.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      
      if (!dailyData[date]) {
        dailyData[date] = {
          temps: [],
          conditions: [],
          humidity: [],
          wind: []
        };
      }
      
      dailyData[date].temps.push(item.main.temp);
      dailyData[date].conditions.push(item.weather[0].main);
      dailyData[date].humidity.push(item.main.humidity);
      dailyData[date].wind.push(item.wind?.speed || 0);
    });

    return Object.keys(dailyData).slice(0, days).map(date => {
      const dayData = dailyData[date];
      return {
        date,
        day: new Date(date).toLocaleDateString('en', { weekday: 'long' }),
        temp: Math.round(dayData.temps.reduce((a, b) => a + b) / dayData.temps.length),
        condition: this.getMostFrequent(dayData.conditions),
        humidity: Math.round(dayData.humidity.reduce((a, b) => a + b) / dayData.humidity.length),
        windSpeed: Math.round(dayData.wind.reduce((a, b) => a + b) / dayData.wind.length),
        rain: Math.random() * 10 // Placeholder for precipitation
      };
    });
  }

  /**
   * Generate realistic mock weather data for demo
   */
  generateMockCurrentWeather(coordinates) {
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Thunderstorm'];
    const baseTemp = 25 + Math.random() * 10; // 25-35°C range for India
    
    // Try to determine location name from coordinates or use provided name
    let locationName = 'Unknown Location';
    if (coordinates.name) {
      locationName = coordinates.name;
    } else if (coordinates.lat && coordinates.lng) {
      locationName = `${coordinates.lat.toFixed(2)}, ${coordinates.lng.toFixed(2)}`;
    }
    
    return {
      temperature: Math.round(baseTemp),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      humidity: Math.round(60 + Math.random() * 25), // 60-85%
      windSpeed: Math.round(Math.random() * 15), // 0-15 m/s
      pressure: Math.round(1010 + Math.random() * 20), // 1010-1030 hPa
      visibility: Math.round(8 + Math.random() * 7), // 8-15 km
      uvIndex: Math.round(Math.random() * 10),
      sunrise: '06:15',
      sunset: '18:30',
      location: locationName,
      region: 'India',
      country: 'IN',
      coordinates: {
        lat: coordinates.lat,
        lng: coordinates.lng
      },
      lastUpdated: new Date().toISOString(),
      source: '🎭 Demo Data (Mock)',
      isRealData: false
    };
  }

  generateMockForecast(coordinates, days) {
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const forecast = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toDateString(),
        day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayNames[date.getDay()],
        temp: Math.round(24 + Math.random() * 8), // 24-32°C
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        humidity: Math.round(65 + Math.random() * 20),
        windSpeed: Math.round(Math.random() * 10),
        rain: Math.round(Math.random() * 15)
      });
    }
    
    return { forecast, source: 'Mock Data (Demo)' };
  }

  /**
   * Utility methods
   */
  mapOpenWeatherCondition(condition) {
    const conditionMap = {
      'Clear': 'Sunny',
      'Clouds': 'Cloudy',
      'Rain': 'Rainy',
      'Drizzle': 'Light Rain',
      'Thunderstorm': 'Thunderstorm',
      'Snow': 'Snow',
      'Mist': 'Misty',
      'Fog': 'Foggy'
    };
    
    return conditionMap[condition] || condition;
  }

  getMostFrequent(array) {
    const frequency = {};
    array.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    
    return Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );
  }

  isCacheValid(key) {
    const cached = this.cache.get(key);
    return cached && (Date.now() - cached.timestamp) < this.cacheTimeout;
  }

  /**
   * Get agricultural weather insights
   */
  getAgriculturalInsights(weatherData) {
    const insights = [];
    
    if (weatherData.temperature > 30) {
      insights.push({
        type: 'warning',
        message: 'High temperature may stress potato plants. Consider increasing irrigation.',
        icon: '🌡️'
      });
    }
    
    if (weatherData.humidity < 40) {
      insights.push({
        type: 'warning',
        message: 'Low humidity detected. Monitor plant water stress.',
        icon: '💧'
      });
    }
    
    if (weatherData.windSpeed > 10) {
      insights.push({
        type: 'info',
        message: 'High wind speeds may affect spray applications.',
        icon: '💨'
      });
    }
    
    return insights;
  }
}

// Create singleton instance
const weatherService = new RealTimeWeatherService();

export default weatherService;

// Export individual methods for easier testing
export {
  RealTimeWeatherService,
  WEATHER_APIS,
  DEFAULT_COORDINATES
};
