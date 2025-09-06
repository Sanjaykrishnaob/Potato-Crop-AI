// Quick test script to verify WeatherAPI integration
const apiKey = '3d4d0c3b20434926b53113050250409';
const testCoordinates = { lat: 12.9716, lng: 77.5946 }; // Bangalore

async function testWeatherAPI() {
  try {
    console.log('🌤️ Testing WeatherAPI integration...');
    
    // Test current weather
    const currentUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${testCoordinates.lat},${testCoordinates.lng}&aqi=yes`;
    console.log('📡 Fetching current weather...');
    
    const currentResponse = await fetch(currentUrl);
    if (!currentResponse.ok) {
      throw new Error(`API Error: ${currentResponse.status}`);
    }
    
    const currentData = await currentResponse.json();
    console.log('✅ Current Weather Data:');
    console.log(`   Location: ${currentData.location.name}, ${currentData.location.country}`);
    console.log(`   Temperature: ${currentData.current.temp_c}°C`);
    console.log(`   Condition: ${currentData.current.condition.text}`);
    console.log(`   Humidity: ${currentData.current.humidity}%`);
    console.log(`   Wind: ${currentData.current.wind_kph} km/h`);
    
    // Test forecast
    const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${testCoordinates.lat},${testCoordinates.lng}&days=3&aqi=no&alerts=no`;
    console.log('\n📅 Fetching forecast...');
    
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) {
      throw new Error(`Forecast API Error: ${forecastResponse.status}`);
    }
    
    const forecastData = await forecastResponse.json();
    console.log('✅ Forecast Data:');
    forecastData.forecast.forecastday.forEach((day, index) => {
      console.log(`   Day ${index + 1}: ${day.day.avgtemp_c}°C, ${day.day.condition.text}`);
    });
    
    console.log('\n🎉 Weather API integration successful!');
    console.log('🚀 Your dashboard now has real-time weather data!');
    
  } catch (error) {
    console.error('❌ Weather API test failed:', error.message);
    console.log('💡 Check your API key and internet connection');
  }
}

// Run the test
testWeatherAPI();
