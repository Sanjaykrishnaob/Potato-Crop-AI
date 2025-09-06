// Direct API test to verify if your WeatherAPI key works
async function testYourWeatherAPI() {
  const apiKey = '3d4d0c3b20434926b53113050250409';
  const testUrl = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=Bangalore&aqi=no`;
  
  console.log('🔍 Testing your WeatherAPI key...');
  console.log('🌍 Fetching current weather for Bangalore...');
  
  try {
    const response = await fetch(testUrl);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Your API key is working!');
      console.log('📍 Location:', data.location.name, data.location.country);
      console.log('🌡️ Temperature:', data.current.temp_c + '°C');
      console.log('☁️ Condition:', data.current.condition.text);
      console.log('💨 Wind:', data.current.wind_kph + ' km/h');
      console.log('💧 Humidity:', data.current.humidity + '%');
      console.log('🕒 Last Updated:', data.current.last_updated);
      console.log('');
      console.log('🎉 Your dashboard will show REAL weather data!');
      
      return true;
    } else {
      console.log('❌ API Request Failed!');
      console.log('Status:', response.status);
      console.log('Error:', response.statusText);
      
      if (response.status === 401) {
        console.log('🔑 Your API key might be invalid or expired');
      } else if (response.status === 403) {
        console.log('🚫 API access forbidden - check your key');
      }
      
      console.log('🎭 Your dashboard will use demo data instead');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    console.log('🌐 Check your internet connection');
    console.log('🎭 Your dashboard will use demo data');
    return false;
  }
}

// Run the test
console.log('='.repeat(50));
console.log('🌤️ WEATHER API VERIFICATION TEST');
console.log('='.repeat(50));
testYourWeatherAPI();
