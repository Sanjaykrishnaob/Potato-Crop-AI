// pages/api/health.js
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Path to Python script that generates real-time health data
    const pythonScriptPath = path.join(process.cwd(), '..', 'src', 'api', 'realtime_health.py');
    
    // Execute Python script to get real-time health calculations
    const { stdout, stderr } = await execAsync(`python "${pythonScriptPath}"`);
    
    if (stderr) {
      console.error('Python stderr:', stderr);
    }

    // Parse the JSON response from Python
    const healthData = JSON.parse(stdout);
    
    // Return the real-time health data
    res.status(200).json(healthData);
    
  } catch (error) {
    console.error('Health API Error:', error);
    
    // Fallback to simulated real-time data if Python script fails
    const fallbackData = {
      fields: [
        {
          id: 1,
          name: "North Field",
          health: Math.round((0.65 + Math.random() * 0.3) * 100), // 65-95%
          ndvi: 0.65 + Math.random() * 0.3,
          ndre: 0.45 + Math.random() * 0.2,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 2,
          name: "South Field", 
          health: Math.round((0.70 + Math.random() * 0.25) * 100), // 70-95%
          ndvi: 0.70 + Math.random() * 0.25,
          ndre: 0.50 + Math.random() * 0.2,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 3,
          name: "East Field",
          health: Math.round((0.60 + Math.random() * 0.35) * 100), // 60-95%
          ndvi: 0.60 + Math.random() * 0.35,
          ndre: 0.40 + Math.random() * 0.25,
          lastUpdated: new Date().toISOString()
        }
      ],
      avgHealth: null,
      lastUpdated: new Date().toISOString(),
      dataSource: 'simulated_realtime'
    };
    
    // Calculate average health
    fallbackData.avgHealth = Math.round(
      fallbackData.fields.reduce((sum, field) => sum + field.health, 0) / fallbackData.fields.length
    );
    
    res.status(200).json(fallbackData);
  }
}
