// Simple test to see if weather API is working in browser
console.log('🌤️ Testing Weather API from Browser...');

// Your actual API key
const API_KEY = '3d4d0c3b20434926b53113050250409';
const TEST_URL = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=Bangalore&aqi=no`;

async function testWeatherInBrowser() {
  try {
    console.log('📡 Making request to:', TEST_URL);
    
    const response = await fetch(TEST_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Weather API is working!');
      console.log('🌡️ Current temp in Bangalore:', data.current.temp_c + '°C');
      console.log('☁️ Condition:', data.current.condition.text);
      console.log('🏙️ Location:', data.location.name + ', ' + data.location.country);
      console.log('📅 Last updated:', data.current.last_updated);
      
      // Test if your React app should show this data
      console.log('🎯 Your dashboard should show REAL weather data!');
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', response.status, response.statusText);
      console.log('❌ Error details:', errorText);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Network/CORS Error:', error.message);
    console.log('💡 This might be a CORS issue or network problem');
    return false;
  }
}

// Run the test
testWeatherInBrowser();
