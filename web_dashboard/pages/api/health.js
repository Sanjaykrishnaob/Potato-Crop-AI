// pages/api/health.js
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Simulate realistic NDVI/NDRE based health calculation
function calculateHealthFromNDVI(ndvi, ndre) {
  // Based on the smart_recommendations.py health assessment logic
  if (ndvi > 0.7 && ndre > 0.4) {
    return Math.round(85 + Math.random() * 10); // Excellent: 85-95%
  } else if (ndvi > 0.5 && ndre > 0.3) {
    return Math.round(70 + Math.random() * 14); // Good: 70-84%
  } else if (ndvi > 0.3 && ndre > 0.2) {
    return Math.round(50 + Math.random() * 19); // Fair: 50-69%
  } else {
    return Math.round(20 + Math.random() * 29); // Poor: 20-49%
  }
}

// Generate realistic NDVI/NDRE values based on growth stage
function generateRealisticSatelliteData() {
  const growthStages = [
    { stage: 'Vegetative_Growth', ndvi: [0.4, 0.7], ndre: [0.25, 0.4] },
    { stage: 'Tuber_Initiation', ndvi: [0.7, 0.85], ndre: [0.4, 0.6] },
    { stage: 'Tuber_Bulking', ndvi: [0.8, 0.9], ndre: [0.5, 0.7] },
    { stage: 'Maturation', ndvi: [0.6, 0.8], ndre: [0.3, 0.5] }
  ];

  const fields = [
    { id: 1, name: "North Field", lat: 28.7041, lng: 77.1025 },
    { id: 2, name: "South Field", lat: 28.6941, lng: 77.1125 },
    { id: 3, name: "East Field", lat: 28.7141, lng: 77.1225 }
  ];

  return fields.map(field => {
    // Randomly select a growth stage for each field
    const stageData = growthStages[Math.floor(Math.random() * growthStages.length)];
    
    // Generate NDVI and NDRE within the stage ranges
    const ndvi = Math.random() * (stageData.ndvi[1] - stageData.ndvi[0]) + stageData.ndvi[0];
    const ndre = Math.random() * (stageData.ndre[1] - stageData.ndre[0]) + stageData.ndre[0];
    
    // Add some temporal variation (simulating real satellite data variations)
    const timeVariation = Math.sin(Date.now() / 1000000) * 0.05; // Small periodic variation
    const adjustedNDVI = Math.max(0.1, Math.min(0.95, ndvi + timeVariation));
    const adjustedNDRE = Math.max(0.1, Math.min(0.8, ndre + timeVariation * 0.7));
    
    // Calculate health based on NDVI/NDRE
    const health = calculateHealthFromNDVI(adjustedNDVI, adjustedNDRE);
    
    return {
      id: field.id,
      name: field.name,
      health: health,
      ndvi: Math.round(adjustedNDVI * 1000) / 1000,
      ndre: Math.round(adjustedNDRE * 1000) / 1000,
      growth_stage: stageData.stage,
      coordinates: {
        lat: field.lat,
        lng: field.lng
      },
      lastUpdated: new Date().toISOString(),
      satellitePass: new Date(Date.now() - Math.random() * 3600000).toISOString() // Random satellite pass within last hour
    };
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Try to execute Python script first for real ML-based calculations
    const pythonScriptPath = path.join(process.cwd(), '..', 'src', 'api', 'realtime_health.py');
    
    try {
      const { stdout, stderr } = await execAsync(`python "${pythonScriptPath}"`, { timeout: 5000 });
      
      if (stderr) {
        console.warn('Python stderr:', stderr);
      }

      const healthData = JSON.parse(stdout);
      
      // If Python script succeeds, return its data
      return res.status(200).json({
        ...healthData,
        dataSource: 'satellite_processing'
      });
      
    } catch (pythonError) {
      console.log('Python script unavailable, using realistic simulation:', pythonError.message);
      
      // Fallback to realistic satellite simulation
      const simulatedFields = generateRealisticSatelliteData();
      
      const avgHealth = Math.round(
        simulatedFields.reduce((sum, field) => sum + field.health, 0) / simulatedFields.length
      );
      
      const result = {
        fields: simulatedFields,
        avgHealth: avgHealth,
        lastUpdated: new Date().toISOString(),
        dataSource: 'simulated_satellite',
        metadata: {
          total_fields: simulatedFields.length,
          processing_method: 'NDVI/NDRE simulation',
          update_frequency: 'real-time',
          note: 'Realistic satellite data simulation based on potato growth models'
        }
      };
      
      return res.status(200).json(result);
    }
    
  } catch (error) {
    console.error('Health API Error:', error);
    
    // Final fallback to basic demo data
    const fallbackData = {
      fields: [
        {
          id: 1,
          name: "North Field",
          health: Math.round((0.65 + Math.random() * 0.3) * 100),
          ndvi: Math.round((0.65 + Math.random() * 0.25) * 1000) / 1000,
          ndre: Math.round((0.45 + Math.random() * 0.2) * 1000) / 1000,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 2,
          name: "South Field", 
          health: Math.round((0.70 + Math.random() * 0.25) * 100),
          ndvi: Math.round((0.70 + Math.random() * 0.2) * 1000) / 1000,
          ndre: Math.round((0.50 + Math.random() * 0.15) * 1000) / 1000,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 3,
          name: "East Field",
          health: Math.round((0.60 + Math.random() * 0.35) * 100),
          ndvi: Math.round((0.60 + Math.random() * 0.3) * 1000) / 1000,
          ndre: Math.round((0.40 + Math.random() * 0.25) * 1000) / 1000,
          lastUpdated: new Date().toISOString()
        }
      ],
      avgHealth: null,
      lastUpdated: new Date().toISOString(),
      dataSource: 'fallback_demo'
    };
    
    fallbackData.avgHealth = Math.round(
      fallbackData.fields.reduce((sum, field) => sum + field.health, 0) / fallbackData.fields.length
    );
    
    res.status(200).json(fallbackData);
  }
}
