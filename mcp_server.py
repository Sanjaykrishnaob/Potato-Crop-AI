"""
MCP Server for Potato Crop AI - Model Context Protocol Implementation
Handles automated satellite processing, ML model triggers, and real-time updates
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import schedule
import time
from threading import Thread

# Add project paths
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

# MCP imports
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent, LoggingLevel
from pydantic import BaseModel

# Project imports
from data_processing.satellite_processor import SentinelProcessor, create_sample_data
from ml_models.growth_stage_classifier import PotatoGrowthStageClassifier
from ml_models.nutrient_predictor import NutrientPredictor
from recommendation_engine.smart_recommendations import RecommendationEngine
from data_processing.environmental_data import DataIntegrator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("potato-crop-mcp")

class MCPConfig(BaseModel):
    """MCP Server Configuration"""
    satellite_api_key: str = "demo_key"
    satellite_secret: str = "demo_secret"
    update_interval_seconds: int = 30
    weekly_processing_day: str = "monday"
    weekly_processing_time: str = "06:00"
    enable_auto_recommendations: bool = True
    dashboard_webhook_url: Optional[str] = None

class PotatoCropMCPServer:
    """Main MCP Server for Potato Crop AI System"""
    
    def __init__(self, config: MCPConfig):
        self.config = config
        self.server = Server("potato-crop-ai")
        self.satellite_processor = SentinelProcessor(
            config.satellite_api_key, 
            config.satellite_secret
        )
        self.growth_classifier = PotatoGrowthStageClassifier()
        self.nutrient_predictor = NutrientPredictor()
        self.recommendation_engine = RecommendationEngine()
        self.data_integrator = DataIntegrator("demo_weather_key")
        
        # State management
        self.last_satellite_update = None
        self.field_cache = {}
        self.active_processing = False
        
        self._register_tools()
        self._schedule_automated_tasks()
    
    def _register_tools(self):
        """Register MCP tools for the server"""
        
        @self.server.call_tool()
        async def trigger_satellite_processing(field_id: str, force_download: bool = False) -> List[TextContent]:
            """
            Trigger satellite image processing for a specific field
            
            Args:
                field_id: Unique identifier for the field
                force_download: Force new satellite image download
            """
            try:
                logger.info(f"MCP: Triggering satellite processing for field {field_id}")
                
                # Get field coordinates (in real implementation, from database)
                field_coords = self._get_field_coordinates(field_id)
                
                # Download latest satellite imagery
                if force_download or self._should_update_satellite_data(field_id):
                    bbox = field_coords['bbox']
                    date_range = self._get_optimal_date_range()
                    
                    band_data = self.satellite_processor.download_sentinel_image(
                        bbox=bbox,
                        date_range=date_range,
                        max_cloud_coverage=20.0
                    )
                    
                    if band_data:
                        # Calculate vegetation indices
                        indices = self.satellite_processor.calculate_vegetation_indices(band_data)
                        
                        # Extract ML features
                        features = self.satellite_processor.extract_features_for_ml(band_data, indices)
                        
                        # Update cache
                        self.field_cache[field_id] = {
                            'band_data': band_data,
                            'indices': indices,
                            'features': features,
                            'last_updated': datetime.now().isoformat(),
                            'source': 'satellite_download'
                        }
                        
                        result = f"Successfully processed satellite data for field {field_id}"
                    else:
                        # Use sample data as fallback
                        sample_data = create_sample_data()
                        indices = self.satellite_processor.calculate_vegetation_indices(sample_data)
                        features = self.satellite_processor.extract_features_for_ml(sample_data, indices)
                        
                        self.field_cache[field_id] = {
                            'band_data': sample_data,
                            'indices': indices,
                            'features': features,
                            'last_updated': datetime.now().isoformat(),
                            'source': 'sample_data'
                        }
                        
                        result = f"Used sample satellite data for field {field_id} (download failed)"
                else:
                    result = f"Satellite data for field {field_id} is up to date"
                
                # Trigger downstream processing
                await self._trigger_ml_analysis(field_id)
                
                return [TextContent(type="text", text=result)]
                
            except Exception as e:
                logger.error(f"Error in satellite processing: {e}")
                return [TextContent(type="text", text=f"Error: {str(e)}")]
        
        @self.server.call_tool()
        async def classify_growth_stage(field_id: str) -> List[TextContent]:
            """
            Trigger growth stage classification for a field
            
            Args:
                field_id: Unique identifier for the field
            """
            try:
                logger.info(f"MCP: Classifying growth stage for field {field_id}")
                
                # Get cached field data
                if field_id not in self.field_cache:
                    await trigger_satellite_processing(field_id)
                
                field_data = self.field_cache[field_id]
                features = field_data['features']
                
                # Classify growth stage
                predictions = self.growth_classifier.predict_growth_stage(features)
                
                # Get most common prediction
                unique_stages, counts = np.unique(predictions['predictions'], return_counts=True)
                dominant_stage = unique_stages[np.argmax(counts)]
                confidence = np.max(predictions['confidence'])
                
                result = {
                    'field_id': field_id,
                    'growth_stage': dominant_stage,
                    'confidence': float(confidence),
                    'timestamp': datetime.now().isoformat(),
                    'source': field_data['source']
                }
                
                # Update cache with classification result
                self.field_cache[field_id]['growth_classification'] = result
                
                # Trigger recommendations if enabled
                if self.config.enable_auto_recommendations:
                    await self._trigger_recommendations(field_id)
                
                return [TextContent(type="text", text=json.dumps(result, indent=2))]
                
            except Exception as e:
                logger.error(f"Error in growth stage classification: {e}")
                return [TextContent(type="text", text=f"Error: {str(e)}")]
        
        @self.server.call_tool()
        async def predict_nutrient_levels(field_id: str, nutrient: str = "nitrogen") -> List[TextContent]:
            """
            Predict nutrient levels for a field
            
            Args:
                field_id: Unique identifier for the field
                nutrient: Target nutrient (nitrogen, phosphorus, potassium)
            """
            try:
                logger.info(f"MCP: Predicting {nutrient} levels for field {field_id}")
                
                # Get cached field data
                if field_id not in self.field_cache:
                    await trigger_satellite_processing(field_id)
                
                field_data = self.field_cache[field_id]
                features = field_data['features']
                
                # Predict nutrient levels
                predictions = self.nutrient_predictor.predict_nutrient_levels(features, nutrient)
                
                # Calculate field-level statistics
                avg_level = float(np.mean(predictions['predictions']))
                deficiency_percentage = float(np.mean(predictions['categories'] == 'low') * 100)
                
                result = {
                    'field_id': field_id,
                    'nutrient': nutrient,
                    'average_level_ppm': avg_level,
                    'deficiency_percentage': deficiency_percentage,
                    'prediction_range': {
                        'min': float(np.min(predictions['predictions'])),
                        'max': float(np.max(predictions['predictions'])),
                        'std': float(np.std(predictions['predictions']))
                    },
                    'timestamp': datetime.now().isoformat(),
                    'source': field_data['source']
                }
                
                # Update cache with prediction result
                if 'nutrient_predictions' not in self.field_cache[field_id]:
                    self.field_cache[field_id]['nutrient_predictions'] = {}
                self.field_cache[field_id]['nutrient_predictions'][nutrient] = result
                
                return [TextContent(type="text", text=json.dumps(result, indent=2))]
                
            except Exception as e:
                logger.error(f"Error in nutrient prediction: {e}")
                return [TextContent(type="text", text=f"Error: {str(e)}")]
        
        @self.server.call_tool()
        async def generate_recommendations(field_id: str) -> List[TextContent]:
            """
            Generate AI-powered recommendations for a field
            
            Args:
                field_id: Unique identifier for the field
            """
            try:
                logger.info(f"MCP: Generating recommendations for field {field_id}")
                
                # Ensure we have all required data
                if field_id not in self.field_cache:
                    await trigger_satellite_processing(field_id)
                
                # Ensure we have classifications and predictions
                field_data = self.field_cache[field_id]
                if 'growth_classification' not in field_data:
                    await classify_growth_stage(field_id)
                
                if 'nutrient_predictions' not in field_data:
                    for nutrient in ['nitrogen', 'phosphorus', 'potassium']:
                        await predict_nutrient_levels(field_id, nutrient)
                
                # Create zone analysis data for recommendations
                zone_data = self._create_zone_analysis_from_cache(field_id)
                
                # Generate recommendations
                recommendations = self.recommendation_engine.generate_field_recommendations(
                    zone_data,
                    weather_forecast={'temperature': 25, 'precipitation': 0, 'humidity': 65}
                )
                
                # Convert to serializable format
                result = {
                    'field_id': field_id,
                    'total_cost': float(recommendations.total_cost),
                    'expected_roi': float(recommendations.expected_roi),
                    'timestamp': datetime.now().isoformat(),
                    'zones': []
                }
                
                for zone in recommendations.zones:
                    zone_dict = {
                        'zone_id': zone.zone_id,
                        'area_ha': zone.area_ha,
                        'growth_stage': zone.growth_stage,
                        'health_status': zone.health_status,
                        'total_cost': float(zone.total_cost),
                        'yield_impact': float(zone.estimated_yield_impact),
                        'actions': []
                    }
                    
                    for action in zone.actions:
                        action_dict = {
                            'type': action.action_type.value,
                            'priority': action.priority,
                            'description': action.description,
                            'timing': action.timing,
                            'cost': float(action.estimated_cost or 0),
                            'rate': action.application_rate,
                            'unit': action.application_unit
                        }
                        zone_dict['actions'].append(action_dict)
                    
                    result['zones'].append(zone_dict)
                
                # Update cache
                self.field_cache[field_id]['recommendations'] = result
                
                return [TextContent(type="text", text=json.dumps(result, indent=2))]
                
            except Exception as e:
                logger.error(f"Error generating recommendations: {e}")
                return [TextContent(type="text", text=f"Error: {str(e)}")]
        
        @self.server.call_tool()
        async def update_dashboard(field_id: str = "all") -> List[TextContent]:
            """
            Trigger dashboard update with latest data
            
            Args:
                field_id: Field to update, or "all" for all fields
            """
            try:
                logger.info(f"MCP: Updating dashboard for field(s) {field_id}")
                
                if field_id == "all":
                    # Update all cached fields
                    fields_to_update = list(self.field_cache.keys())
                    if not fields_to_update:
                        # Create sample field for demo
                        fields_to_update = ["field_001", "field_002", "field_003"]
                else:
                    fields_to_update = [field_id]
                
                dashboard_data = {
                    'last_updated': datetime.now().isoformat(),
                    'fields': [],
                    'total_fields': len(fields_to_update),
                    'avg_health': 0
                }
                
                total_health = 0
                for fid in fields_to_update:
                    # Ensure field has current data
                    if fid not in self.field_cache:
                        await trigger_satellite_processing(fid)
                        await classify_growth_stage(fid)
                        await predict_nutrient_levels(fid)
                    
                    field_info = self.field_cache.get(fid, {})
                    
                    # Calculate health from NDVI
                    indices = field_info.get('indices', {})
                    ndvi_mean = float(np.mean(indices.get('NDVI', [0.7])))
                    health = min(100, max(0, (ndvi_mean - 0.1) / 0.8 * 100))
                    
                    field_summary = {
                        'id': fid,
                        'name': f"Field {fid.split('_')[-1]}",
                        'health': round(health, 1),
                        'ndvi': round(ndvi_mean, 3),
                        'growth_stage': field_info.get('growth_classification', {}).get('growth_stage', 'Unknown'),
                        'last_updated': field_info.get('last_updated', datetime.now().isoformat()),
                        'data_source': field_info.get('source', 'mcp_processing')
                    }
                    
                    dashboard_data['fields'].append(field_summary)
                    total_health += health
                
                dashboard_data['avg_health'] = round(total_health / len(fields_to_update), 1)
                
                # Send to dashboard webhook if configured
                if self.config.dashboard_webhook_url:
                    await self._send_dashboard_update(dashboard_data)
                
                return [TextContent(type="text", text=json.dumps(dashboard_data, indent=2))]
                
            except Exception as e:
                logger.error(f"Error updating dashboard: {e}")
                return [TextContent(type="text", text=f"Error: {str(e)}")]
        
        @self.server.call_tool()
        async def schedule_weekly_processing() -> List[TextContent]:
            """
            Set up weekly automated satellite processing
            """
            try:
                logger.info("MCP: Setting up weekly satellite processing schedule")
                
                # Schedule weekly processing
                schedule.every().monday.at(self.config.weekly_processing_time).do(
                    self._weekly_processing_job
                )
                
                result = {
                    'status': 'scheduled',
                    'day': self.config.weekly_processing_day,
                    'time': self.config.weekly_processing_time,
                    'next_run': schedule.next_run().isoformat() if schedule.next_run() else None,
                    'message': 'Weekly satellite processing scheduled successfully'
                }
                
                return [TextContent(type="text", text=json.dumps(result, indent=2))]
                
            except Exception as e:
                logger.error(f"Error scheduling weekly processing: {e}")
                return [TextContent(type="text", text=f"Error: {str(e)}")]
    
    async def _trigger_ml_analysis(self, field_id: str):
        """Trigger ML analysis cascade for a field"""
        try:
            await classify_growth_stage(field_id)
            for nutrient in ['nitrogen', 'phosphorus', 'potassium']:
                await predict_nutrient_levels(field_id, nutrient)
            await generate_recommendations(field_id)
        except Exception as e:
            logger.error(f"Error in ML analysis cascade: {e}")
    
    async def _trigger_recommendations(self, field_id: str):
        """Trigger recommendation generation"""
        try:
            await generate_recommendations(field_id)
        except Exception as e:
            logger.error(f"Error triggering recommendations: {e}")
    
    def _get_field_coordinates(self, field_id: str) -> Dict:
        """Get field coordinates (mock implementation)"""
        # In real implementation, this would query a database
        coords_map = {
            'field_001': {'bbox': (77.5, 12.9, 77.6, 13.0)},
            'field_002': {'bbox': (77.6, 12.9, 77.7, 13.0)},
            'field_003': {'bbox': (77.7, 12.9, 77.8, 13.0)}
        }
        return coords_map.get(field_id, {'bbox': (77.5946, 12.9716, 77.6946, 13.0716)})
    
    def _should_update_satellite_data(self, field_id: str) -> bool:
        """Check if satellite data needs updating"""
        if field_id not in self.field_cache:
            return True
        
        last_update = self.field_cache[field_id].get('last_updated')
        if not last_update:
            return True
        
        last_update_time = datetime.fromisoformat(last_update.replace('Z', '+00:00'))
        return datetime.now() - last_update_time > timedelta(hours=6)
    
    def _get_optimal_date_range(self) -> tuple:
        """Get optimal date range for satellite imagery"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        return (start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
    
    def _create_zone_analysis_from_cache(self, field_id: str) -> 'pd.DataFrame':
        """Create zone analysis data from cached field information"""
        import pandas as pd
        import numpy as np
        
        field_data = self.field_cache[field_id]
        growth_stage = field_data.get('growth_classification', {}).get('growth_stage', 'Vegetative_Growth')
        
        # Create sample zone data based on cached information
        zone_data = pd.DataFrame({
            'zone_id': [1, 2, 3],
            'area_ha': [2.5, 3.0, 2.0],
            'growth_stage': [growth_stage] * 3,
            'NDVI_mean': [0.65, 0.75, 0.55],
            'NDRE_mean': [0.40, 0.50, 0.35],
            'nitrogen_level': [35, 55, 25],
            'phosphorus_level': [20, 25, 15],
            'potassium_level': [180, 200, 160],
            'soil_moisture': [65, 70, 60],
            'temperature': [22, 23, 21]
        })
        
        return zone_data
    
    async def _send_dashboard_update(self, data: Dict):
        """Send update to dashboard webhook"""
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.post(self.config.dashboard_webhook_url, json=data) as response:
                    if response.status == 200:
                        logger.info("Dashboard update sent successfully")
                    else:
                        logger.warning(f"Dashboard update failed: {response.status}")
        except Exception as e:
            logger.error(f"Error sending dashboard update: {e}")
    
    def _weekly_processing_job(self):
        """Weekly processing job to be scheduled"""
        logger.info("Running weekly satellite processing job")
        # This would trigger processing for all fields
        # In async context, you'd need to handle this differently
    
    def _schedule_automated_tasks(self):
        """Set up automated task scheduling"""
        def run_scheduler():
            while True:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
        
        scheduler_thread = Thread(target=run_scheduler, daemon=True)
        scheduler_thread.start()

# MCP Server entry point
async def main():
    """Main MCP server entry point"""
    
    # Load configuration
    config = MCPConfig()
    
    # Initialize server
    mcp_server = PotatoCropMCPServer(config)
    
    logger.info("Starting Potato Crop AI MCP Server...")
    
    # Run the server
    async with stdio_server() as (read_stream, write_stream):
        await mcp_server.server.run(
            read_stream,
            write_stream,
            mcp_server.server.create_initialization_options()
        )

if __name__ == "__main__":
    # Import required modules
    import numpy as np
    import pandas as pd
    
    # Run the MCP server
    asyncio.run(main())
