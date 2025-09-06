"""
Soil and weather data integration module
Handles external data sources for comprehensive crop analysis
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import json
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class SoilData:
    """Container for soil analysis data"""
    ph: float
    organic_matter: float
    nitrogen: float
    phosphorus: float
    potassium: float
    moisture: float
    temperature: float
    conductivity: float

@dataclass
class WeatherData:
    """Container for weather information"""
    temperature: float
    humidity: float
    precipitation: float
    wind_speed: float
    solar_radiation: float
    pressure: float
    date: datetime

class SoilAnalyzer:
    """Soil data processing and analysis"""
    
    def __init__(self):
        self.soil_database = self._initialize_soil_database()
    
    def _initialize_soil_database(self) -> Dict:
        """Initialize sample soil database for demonstration"""
        return {
            "field_001": {
                "ph": 6.5,
                "organic_matter": 3.2,
                "nitrogen": 45.0,
                "phosphorus": 22.0,
                "potassium": 180.0,
                "moisture": 25.0,
                "temperature": 18.5,
                "conductivity": 1.2
            },
            "field_002": {
                "ph": 6.8,
                "organic_matter": 2.8,
                "nitrogen": 38.0,
                "phosphorus": 18.0,
                "potassium": 165.0,
                "moisture": 22.0,
                "temperature": 19.2,
                "conductivity": 1.1
            }
        }
    
    def get_soil_data(self, field_id: str) -> Optional[SoilData]:
        """Get soil data for a specific field"""
        if field_id in self.soil_database:
            data = self.soil_database[field_id]
            return SoilData(**data)
        return None
    
    def calculate_nutrient_index(self, soil_data: SoilData) -> Dict[str, float]:
        """Calculate nutrient availability indices"""
        # Simplified nutrient index calculation
        nitrogen_index = min(soil_data.nitrogen / 50.0, 1.0)  # Normalize to 50 ppm
        phosphorus_index = min(soil_data.phosphorus / 25.0, 1.0)  # Normalize to 25 ppm
        potassium_index = min(soil_data.potassium / 200.0, 1.0)  # Normalize to 200 ppm
        
        # pH factor (optimal range 6.0-7.0 for potatoes)
        ph_factor = 1.0 - abs(soil_data.ph - 6.5) / 2.0
        ph_factor = max(ph_factor, 0.3)  # Minimum factor
        
        return {
            "nitrogen_index": nitrogen_index * ph_factor,
            "phosphorus_index": phosphorus_index * ph_factor,
            "potassium_index": potassium_index * ph_factor,
            "overall_fertility": (nitrogen_index + phosphorus_index + potassium_index) / 3 * ph_factor
        }

class WeatherService:
    """Weather data collection and processing"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "http://api.openweathermap.org/data/2.5"
    
    def get_current_weather(self, lat: float, lon: float) -> Optional[WeatherData]:
        """Get current weather data for coordinates"""
        try:
            url = f"{self.base_url}/weather"
            params = {
                "lat": lat,
                "lon": lon,
                "appid": self.api_key,
                "units": "metric"
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            return WeatherData(
                temperature=data["main"]["temp"],
                humidity=data["main"]["humidity"],
                precipitation=data.get("rain", {}).get("1h", 0),
                wind_speed=data["wind"]["speed"],
                solar_radiation=self._estimate_solar_radiation(data["clouds"]["all"]),
                pressure=data["main"]["pressure"],
                date=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Failed to fetch weather data: {e}")
            return self._get_sample_weather()
    
    def get_historical_weather(self, lat: float, lon: float, 
                             days_back: int = 30) -> List[WeatherData]:
        """Get historical weather data"""
        # For demo purposes, generate sample historical data
        weather_data = []
        base_date = datetime.now() - timedelta(days=days_back)
        
        for i in range(days_back):
            date = base_date + timedelta(days=i)
            # Generate realistic weather patterns
            temp = 20 + 5 * np.sin(i / 10) + np.random.normal(0, 2)
            humidity = 60 + 20 * np.sin(i / 15) + np.random.normal(0, 5)
            precipitation = max(0, np.random.exponential(1) * 2)
            
            weather_data.append(WeatherData(
                temperature=temp,
                humidity=humidity,
                precipitation=precipitation,
                wind_speed=3 + np.random.normal(0, 1),
                solar_radiation=15 + 10 * np.sin(i / 7),
                pressure=1013 + np.random.normal(0, 5),
                date=date
            ))
        
        return weather_data
    
    def _estimate_solar_radiation(self, cloud_cover: float) -> float:
        """Estimate solar radiation based on cloud cover"""
        max_radiation = 25.0  # MJ/m²/day
        return max_radiation * (1 - cloud_cover / 100) * 0.8
    
    def _get_sample_weather(self) -> WeatherData:
        """Get sample weather data for demonstration"""
        return WeatherData(
            temperature=22.5,
            humidity=65.0,
            precipitation=0.0,
            wind_speed=2.5,
            solar_radiation=18.0,
            pressure=1015.0,
            date=datetime.now()
        )
    
    def calculate_weather_stress_index(self, weather_data: List[WeatherData]) -> Dict[str, float]:
        """Calculate stress indices based on weather conditions"""
        if not weather_data:
            return {}
        
        # Extract values
        temps = [w.temperature for w in weather_data]
        humidity = [w.humidity for w in weather_data]
        precipitation = [w.precipitation for w in weather_data]
        
        # Temperature stress (optimal 15-25°C for potatoes)
        temp_stress = np.mean([max(0, abs(t - 20) - 5) / 10 for t in temps])
        
        # Water stress (considering precipitation and humidity)
        total_precip = sum(precipitation)
        avg_humidity = np.mean(humidity)
        water_stress = max(0, (50 - total_precip) / 50) * max(0, (60 - avg_humidity) / 60)
        
        # Heat stress (days above 30°C)
        heat_days = sum(1 for t in temps if t > 30)
        heat_stress = min(heat_days / len(temps), 1.0)
        
        return {
            "temperature_stress": temp_stress,
            "water_stress": water_stress,
            "heat_stress": heat_stress,
            "overall_stress": (temp_stress + water_stress + heat_stress) / 3
        }

class DataIntegrator:
    """Integrate satellite, soil, and weather data"""
    
    def __init__(self, weather_api_key: str):
        self.soil_analyzer = SoilAnalyzer()
        self.weather_service = WeatherService(weather_api_key)
    
    def create_integrated_dataset(self, 
                                satellite_features: pd.DataFrame,
                                field_id: str,
                                lat: float, 
                                lon: float) -> pd.DataFrame:
        """Create integrated dataset with all data sources"""
        
        # Get soil data
        soil_data = self.soil_analyzer.get_soil_data(field_id)
        if not soil_data:
            logger.warning(f"No soil data found for field {field_id}")
            soil_data = SoilData(6.5, 3.0, 40.0, 20.0, 170.0, 23.0, 18.0, 1.1)
        
        # Get weather data
        current_weather = self.weather_service.get_current_weather(lat, lon)
        historical_weather = self.weather_service.get_historical_weather(lat, lon)
        
        # Calculate derived features
        nutrient_indices = self.soil_analyzer.calculate_nutrient_index(soil_data)
        weather_stress = self.weather_service.calculate_weather_stress_index(historical_weather)
        
        # Add soil features to satellite data
        integrated_df = satellite_features.copy()
        
        # Soil features
        integrated_df['soil_ph'] = soil_data.ph
        integrated_df['soil_organic_matter'] = soil_data.organic_matter
        integrated_df['soil_nitrogen'] = soil_data.nitrogen
        integrated_df['soil_phosphorus'] = soil_data.phosphorus
        integrated_df['soil_potassium'] = soil_data.potassium
        integrated_df['soil_moisture'] = soil_data.moisture
        integrated_df['soil_temperature'] = soil_data.temperature
        
        # Nutrient indices
        for key, value in nutrient_indices.items():
            integrated_df[key] = value
        
        # Weather features
        if current_weather:
            integrated_df['weather_temperature'] = current_weather.temperature
            integrated_df['weather_humidity'] = current_weather.humidity
            integrated_df['weather_precipitation'] = current_weather.precipitation
            integrated_df['weather_solar_radiation'] = current_weather.solar_radiation
        
        # Weather stress indices
        for key, value in weather_stress.items():
            integrated_df[key] = value
        
        # Calculate growing degree days (GDD) for potato
        if historical_weather:
            gdd = self._calculate_growing_degree_days(historical_weather, base_temp=4.0)
            integrated_df['growing_degree_days'] = gdd
        
        # Soil-weather interactions
        integrated_df['moisture_stress'] = self._calculate_moisture_stress(
            soil_data.moisture, current_weather.humidity if current_weather else 65.0
        )
        
        logger.info(f"Created integrated dataset with {len(integrated_df.columns)} features")
        return integrated_df
    
    def _calculate_growing_degree_days(self, weather_data: List[WeatherData], 
                                     base_temp: float) -> float:
        """Calculate accumulated growing degree days"""
        gdd = 0
        for weather in weather_data:
            daily_gdd = max(0, weather.temperature - base_temp)
            gdd += daily_gdd
        return gdd
    
    def _calculate_moisture_stress(self, soil_moisture: float, humidity: float) -> float:
        """Calculate moisture stress index"""
        optimal_soil_moisture = 25.0  # Optimal soil moisture for potatoes
        optimal_humidity = 70.0
        
        soil_stress = max(0, (optimal_soil_moisture - soil_moisture) / optimal_soil_moisture)
        air_stress = max(0, (optimal_humidity - humidity) / optimal_humidity)
        
        return (soil_stress + air_stress) / 2

def generate_sample_environmental_data():
    """Generate sample environmental data for demonstration"""
    
    # Sample coordinates (agricultural area)
    lat, lon = 40.7128, -74.0060
    field_id = "field_001"
    
    # Initialize integrator with dummy API key
    integrator = DataIntegrator("demo_api_key")
    
    # Create sample satellite features DataFrame
    n_pixels = 1000
    satellite_features = pd.DataFrame({
        'x_coord': np.random.randint(0, 100, n_pixels),
        'y_coord': np.random.randint(0, 100, n_pixels),
        'NDVI': np.random.normal(0.6, 0.15, n_pixels),
        'NDRE': np.random.normal(0.4, 0.1, n_pixels),
        'SAVI': np.random.normal(0.5, 0.12, n_pixels),
        'red': np.random.normal(0.15, 0.05, n_pixels),
        'nir': np.random.normal(0.6, 0.1, n_pixels)
    })
    
    # Clip values to realistic ranges
    satellite_features['NDVI'] = np.clip(satellite_features['NDVI'], -1, 1)
    satellite_features['NDRE'] = np.clip(satellite_features['NDRE'], -1, 1)
    
    return integrator, satellite_features, field_id, lat, lon

if __name__ == "__main__":
    # Demo usage
    print("Generating sample environmental data...")
    integrator, satellite_features, field_id, lat, lon = generate_sample_environmental_data()
    
    print("Creating integrated dataset...")
    integrated_data = integrator.create_integrated_dataset(
        satellite_features, field_id, lat, lon
    )
    
    print(f"\nIntegrated dataset shape: {integrated_data.shape}")
    print(f"Features: {list(integrated_data.columns)}")
    print(f"\nSample statistics:")
    print(integrated_data[['NDVI', 'soil_nitrogen', 'weather_temperature', 
                          'overall_fertility', 'overall_stress']].describe())
