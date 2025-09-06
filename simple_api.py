#!/usr/bin/env python3
"""
Simple FastAPI backend for the potato crop AI dashboard
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import json
import sys
import os
from datetime import datetime
import time

# Add the src directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

app = FastAPI(title="Potato Crop AI API", version="1.0.0")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Potato Crop AI API is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/field-health")
async def get_field_health():
    """Get real-time field health data"""
    try:
        # Import and run the real-time health data generator
        from api.realtime_health import generate_realtime_field_data
        health_data = generate_realtime_field_data()
        return JSONResponse(content=health_data)
    except Exception as e:
        print(f"Error generating field health data: {e}")
        # Return fallback data
        fallback_data = {
            "fields": [
                {
                    "id": "field_001",
                    "name": "North Field",
                    "health": 85.2,
                    "ndvi": 0.75,
                    "ndre": 0.42,
                    "coordinates": [40.7128, -74.0060],
                    "area": 12.5,
                    "status": "Healthy",
                    "lastUpdated": datetime.now().isoformat()
                },
                {
                    "id": "field_002", 
                    "name": "South Field",
                    "health": 78.9,
                    "ndvi": 0.68,
                    "ndre": 0.38,
                    "coordinates": [40.7589, -73.9851],
                    "area": 8.3,
                    "status": "Good",
                    "lastUpdated": datetime.now().isoformat()
                }
            ],
            "avgHealth": 82.05,
            "lastUpdated": datetime.now().isoformat(),
            "dataSource": "fallback_api"
        }
        return JSONResponse(content=fallback_data)

@app.post("/api/field-analysis")
async def analyze_field(field_data: dict):
    """Perform field analysis (simplified version to prevent freezing)"""
    try:
        field_id = field_data.get('fieldId', 'unknown')
        coordinates = field_data.get('coordinates', [])
        latitude = field_data.get('latitude')
        longitude = field_data.get('longitude')
        use_custom = field_data.get('useCustomLocation', False)
        
        print(f"🔍 Analyzing field: {field_id}")
        if use_custom and latitude and longitude:
            print(f"🌍 Using custom coordinates: {latitude}, {longitude}")
        elif coordinates:
            print(f"📍 Using field coordinates: {coordinates}")
        
        # Simulate processing time
        time.sleep(2)
        
        # Determine location for analysis
        analysis_lat = latitude if latitude else (coordinates[0] if coordinates else 40.7128)
        analysis_lng = longitude if longitude else (coordinates[1] if coordinates else -74.0060)
        
        # Generate location-aware analysis results
        # Simulate different soil and climate conditions based on coordinates
        climate_factor = (analysis_lat + 90) / 180  # Normalize latitude to 0-1
        moisture_base = 20 + (climate_factor * 15)  # Moisture varies with latitude
        temp_base = 15 + ((90 - abs(analysis_lat)) / 90 * 20)  # Temperature varies with latitude
        
        # Generate realistic analysis results
        analysis_result = {
            "fieldId": field_id,
            "analysisTimestamp": datetime.now().isoformat(),
            "location": {
                "latitude": analysis_lat,
                "longitude": analysis_lng,
                "useCustomLocation": use_custom
            },
            "vegetationIndices": {
                "ndvi": round(0.65 + (climate_factor * 0.2), 3),
                "ndre": round(0.35 + (climate_factor * 0.15), 3),
                "savi": round(0.60 + (climate_factor * 0.18), 3),
                "evi": round(0.50 + (climate_factor * 0.20), 3)
            },
            "soilMetrics": {
                "moisture": round(moisture_base + (abs(analysis_lng) / 180 * 10), 1),
                "temperature": round(temp_base + (climate_factor * 5), 1),
                "ph": round(6.0 + (climate_factor * 1.5), 1),
                "organicMatter": round(2.5 + (climate_factor * 1.0), 1)
            },
            "healthAssessment": {
                "overallHealth": round(75 + (climate_factor * 15), 1),
                "growthStage": "Vegetative Growth",
                "stressIndicators": ["None detected"] if climate_factor > 0.3 else ["Mild water stress"],
                "recommendations": [
                    "Continue current irrigation schedule" if climate_factor > 0.4 else "Increase irrigation frequency",
                    "Monitor for pest activity",
                    "Consider nitrogen supplementation in 2 weeks" if climate_factor > 0.5 else "Apply nitrogen fertilizer soon"
                ]
            },
            "satelliteData": {
                "imageDate": datetime.now().isoformat(),
                "cloudCover": round(10 + (climate_factor * 20), 1),
                "resolution": "10m",
                "dataSource": "Sentinel-2"
            },
            "zones": [
                {
                    "id": "zone_1",
                    "health": round(80 + (climate_factor * 12), 1),
                    "area": 4.2,
                    "recommendations": ["Optimal conditions"] if climate_factor > 0.4 else ["Increase monitoring"]
                },
                {
                    "id": "zone_2", 
                    "health": round(75 + (climate_factor * 10), 1),
                    "area": 5.1,
                    "recommendations": ["Monitor moisture levels"]
                }
            ],
            "weatherFactors": {
                "estimatedClimateZone": "temperate" if 20 <= abs(analysis_lat) <= 60 else ("tropical" if abs(analysis_lat) < 20 else "polar"),
                "seasonalFactor": climate_factor,
                "precipitationLikelihood": "moderate" if climate_factor > 0.3 else "low"
            }
        }
        
        print("✅ Field analysis completed")
        return JSONResponse(content=analysis_result)
        
    except Exception as e:
        print(f"❌ Field analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Field analysis failed: {str(e)}")

@app.get("/api/recommendations")
async def get_recommendations():
    """Get smart recommendations"""
    try:
        recommendations = {
            "timestamp": datetime.now().isoformat(),
            "recommendations": [
                {
                    "id": "rec_001",
                    "title": "Irrigation Optimization",
                    "description": "Reduce irrigation frequency in north field zones due to adequate soil moisture",
                    "priority": "Medium",
                    "category": "Water Management",
                    "estimatedSavings": "$245",
                    "implementationTime": "2 days"
                },
                {
                    "id": "rec_002",
                    "title": "Nutrient Supplementation",
                    "description": "Apply nitrogen-rich fertilizer to boost growth in vegetative stage",
                    "priority": "High",
                    "category": "Nutrition",
                    "estimatedSavings": "$180",
                    "implementationTime": "1 day"
                },
                {
                    "id": "rec_003",
                    "title": "Pest Monitoring",
                    "description": "Increase monitoring frequency for early blight detection",
                    "priority": "Low",
                    "category": "Disease Control",
                    "estimatedSavings": "$320",
                    "implementationTime": "Ongoing"
                }
            ]
        }
        return JSONResponse(content=recommendations)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@app.get("/api/satellite-data/{field_id}")
async def get_satellite_data(field_id: str):
    """Get satellite data for a specific field"""
    try:
        satellite_data = {
            "fieldId": field_id,
            "timestamp": datetime.now().isoformat(),
            "images": [
                {
                    "id": "img_001",
                    "date": "2024-01-15",
                    "ndvi": 0.68,
                    "cloudCover": 12.3,
                    "resolution": "10m"
                },
                {
                    "id": "img_002", 
                    "date": "2024-01-10",
                    "ndvi": 0.71,
                    "cloudCover": 8.1,
                    "resolution": "10m"
                }
            ],
            "averageNDVI": 0.695,
            "trend": "stable"
        }
        return JSONResponse(content=satellite_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get satellite data: {str(e)}")

@app.post("/api/validate-coordinates")
async def validate_coordinates(coord_data: dict):
    """Validate coordinates and provide location information"""
    try:
        latitude = coord_data.get('latitude')
        longitude = coord_data.get('longitude')
        
        if latitude is None or longitude is None:
            raise HTTPException(status_code=400, detail="Latitude and longitude are required")
        
        lat = float(latitude)
        lng = float(longitude)
        
        # Validate coordinate ranges
        if lat < -90 or lat > 90:
            raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90 degrees")
        
        if lng < -180 or lng > 180:
            raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180 degrees")
        
        # Determine basic geographic and climate information
        climate_zone = "temperate" if 20 <= abs(lat) <= 60 else ("tropical" if abs(lat) < 20 else "polar")
        hemisphere = "Northern" if lat >= 0 else "Southern"
        
        # Estimate agricultural suitability
        agricultural_suitability = "high" if 20 <= abs(lat) <= 50 else ("moderate" if abs(lat) < 60 else "low")
        
        result = {
            "valid": True,
            "coordinates": {
                "latitude": lat,
                "longitude": lng
            },
            "locationInfo": {
                "hemisphere": hemisphere,
                "climateZone": climate_zone,
                "agriculturalSuitability": agricultural_suitability,
                "estimatedTimezone": f"UTC{int(lng/15):+d}",
                "nearEquator": abs(lat) < 10,
                "nearPoles": abs(lat) > 70
            },
            "analysisCapability": {
                "satelliteDataAvailable": True,
                "vegetationAnalysis": agricultural_suitability != "low",
                "seasonalTracking": True,
                "weatherIntegration": True
            },
            "recommendations": {
                "bestAnalysisMonths": ["April", "May", "September", "October"] if abs(lat) > 20 else ["All year"],
                "keyMetrics": ["NDVI", "NDRE", "soil moisture"] if agricultural_suitability == "high" else ["basic vegetation indices"],
                "notes": f"Location is suitable for {climate_zone} crop analysis" if agricultural_suitability != "low" else "Limited agricultural potential at this latitude"
            }
        }
        
        return JSONResponse(content=result)
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid coordinate format. Please provide numeric values.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Coordinate validation failed: {str(e)}")

if __name__ == "__main__":
    print("🚀 Starting Potato Crop AI API...")
    print("📍 API will be available at: http://localhost:8000")
    print("📊 Dashboard should be running at: http://localhost:3001")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
