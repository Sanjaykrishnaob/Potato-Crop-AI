"""
MCP Client Integration for React Dashboard
Connects the frontend with MCP server for real-time automated updates
"""

import asyncio
import json
import logging
import websockets
from typing import Dict, List, Optional, Callable
from datetime import datetime
import threading
import time

logger = logging.getLogger("mcp-client")

class MCPClient:
    """Client for connecting to Potato Crop AI MCP Server"""
    
    def __init__(self, server_url: str = "ws://localhost:8001"):
        self.server_url = server_url
        self.connection = None
        self.is_connected = False
        self.callbacks = {}
        self.auto_update_enabled = True
        self.update_thread = None
        
    async def connect(self):
        """Connect to MCP server"""
        try:
            self.connection = await websockets.connect(self.server_url)
            self.is_connected = True
            logger.info(f"Connected to MCP server at {self.server_url}")
            
            # Start auto-update thread
            if self.auto_update_enabled:
                self._start_auto_update()
                
        except Exception as e:
            logger.error(f"Failed to connect to MCP server: {e}")
            self.is_connected = False
    
    async def disconnect(self):
        """Disconnect from MCP server"""
        if self.connection:
            await self.connection.close()
            self.is_connected = False
            logger.info("Disconnected from MCP server")
    
    async def call_tool(self, tool_name: str, params: Dict) -> Dict:
        """Call an MCP tool with parameters"""
        if not self.is_connected:
            await self.connect()
        
        if not self.is_connected:
            raise Exception("Not connected to MCP server")
        
        request = {
            "jsonrpc": "2.0",
            "id": self._generate_request_id(),
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": params
            }
        }
        
        try:
            await self.connection.send(json.dumps(request))
            response = await self.connection.recv()
            result = json.loads(response)
            
            if "error" in result:
                raise Exception(f"MCP Error: {result['error']}")
            
            return result.get("result", {})
            
        except Exception as e:
            logger.error(f"Error calling MCP tool {tool_name}: {e}")
            raise
    
    async def trigger_field_processing(self, field_id: str, force_download: bool = False) -> Dict:
        """Trigger complete field processing pipeline"""
        return await self.call_tool("trigger_satellite_processing", {
            "field_id": field_id,
            "force_download": force_download
        })
    
    async def classify_growth_stage(self, field_id: str) -> Dict:
        """Trigger growth stage classification"""
        return await self.call_tool("classify_growth_stage", {
            "field_id": field_id
        })
    
    async def predict_nutrients(self, field_id: str, nutrient: str = "nitrogen") -> Dict:
        """Predict nutrient levels"""
        return await self.call_tool("predict_nutrient_levels", {
            "field_id": field_id,
            "nutrient": nutrient
        })
    
    async def generate_recommendations(self, field_id: str) -> Dict:
        """Generate AI recommendations"""
        return await self.call_tool("generate_recommendations", {
            "field_id": field_id
        })
    
    async def update_dashboard(self, field_id: str = "all") -> Dict:
        """Update dashboard with latest data"""
        return await self.call_tool("update_dashboard", {
            "field_id": field_id
        })
    
    async def schedule_weekly_processing(self) -> Dict:
        """Set up weekly automated processing"""
        return await self.call_tool("schedule_weekly_processing", {})
    
    def register_callback(self, event_type: str, callback: Callable):
        """Register callback for MCP events"""
        if event_type not in self.callbacks:
            self.callbacks[event_type] = []
        self.callbacks[event_type].append(callback)
    
    def _trigger_callbacks(self, event_type: str, data: Dict):
        """Trigger registered callbacks"""
        if event_type in self.callbacks:
            for callback in self.callbacks[event_type]:
                try:
                    callback(data)
                except Exception as e:
                    logger.error(f"Error in callback: {e}")
    
    def _generate_request_id(self) -> str:
        """Generate unique request ID"""
        return f"req_{int(time.time() * 1000)}"
    
    def _start_auto_update(self):
        """Start automatic update thread"""
        def auto_update_worker():
            while self.auto_update_enabled and self.is_connected:
                try:
                    # Run dashboard update every 30 seconds
                    asyncio.run(self._periodic_update())
                    time.sleep(30)
                except Exception as e:
                    logger.error(f"Error in auto-update: {e}")
        
        self.update_thread = threading.Thread(target=auto_update_worker, daemon=True)
        self.update_thread.start()
    
    async def _periodic_update(self):
        """Periodic update for dashboard"""
        try:
            result = await self.update_dashboard("all")
            self._trigger_callbacks("dashboard_update", result)
        except Exception as e:
            logger.error(f"Error in periodic update: {e}")

# React integration helper
class ReactMCPBridge:
    """Bridge between React frontend and MCP client"""
    
    def __init__(self):
        self.client = MCPClient()
        self.field_cache = {}
        self.last_update = None
        
    async def initialize(self):
        """Initialize MCP connection"""
        await self.client.connect()
        
        # Set up callbacks for real-time updates
        self.client.register_callback("dashboard_update", self._handle_dashboard_update)
        
        # Schedule weekly processing
        await self.client.schedule_weekly_processing()
        
        logger.info("MCP Bridge initialized successfully")
    
    def _handle_dashboard_update(self, data: Dict):
        """Handle dashboard updates from MCP"""
        self.last_update = datetime.now()
        
        # Update field cache
        if 'fields' in data:
            for field in data['fields']:
                self.field_cache[field['id']] = field
        
        # Trigger frontend update (would integrate with React state management)
        logger.info(f"Dashboard updated with {len(data.get('fields', []))} fields")
    
    async def process_field_complete(self, field_id: str) -> Dict:
        """Complete processing pipeline for a field"""
        try:
            # Step 1: Satellite processing
            await self.client.trigger_field_processing(field_id, force_download=True)
            
            # Step 2: Growth stage classification
            classification = await self.client.classify_growth_stage(field_id)
            
            # Step 3: Nutrient predictions
            nutrients = {}
            for nutrient in ['nitrogen', 'phosphorus', 'potassium']:
                nutrients[nutrient] = await self.client.predict_nutrients(field_id, nutrient)
            
            # Step 4: Generate recommendations
            recommendations = await self.client.generate_recommendations(field_id)
            
            # Step 5: Update dashboard
            dashboard = await self.client.update_dashboard(field_id)
            
            result = {
                'field_id': field_id,
                'timestamp': datetime.now().isoformat(),
                'classification': classification,
                'nutrients': nutrients,
                'recommendations': recommendations,
                'dashboard': dashboard
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error in complete field processing: {e}")
            raise
    
    def get_field_status(self, field_id: str) -> Dict:
        """Get current status of a field"""
        return self.field_cache.get(field_id, {})
    
    def get_all_fields_status(self) -> List[Dict]:
        """Get status of all fields"""
        return list(self.field_cache.values())
    
    async def trigger_emergency_analysis(self, field_ids: List[str]) -> Dict:
        """Trigger emergency analysis for multiple fields"""
        results = {}
        
        for field_id in field_ids:
            try:
                result = await self.process_field_complete(field_id)
                results[field_id] = {
                    'status': 'success',
                    'data': result
                }
            except Exception as e:
                results[field_id] = {
                    'status': 'error',
                    'error': str(e)
                }
        
        return results

# Configuration for dashboard integration
MCP_CONFIG = {
    'server_url': 'ws://localhost:8001',
    'auto_connect': True,
    'update_interval': 30,
    'enable_real_time': True,
    'fields': ['field_001', 'field_002', 'field_003'],
    'default_processing_schedule': {
        'day': 'monday',
        'time': '06:00',
        'timezone': 'Asia/Kolkata'
    }
}

# Example usage for React integration
async def demo_mcp_integration():
    """Demo of MCP integration"""
    bridge = ReactMCPBridge()
    
    try:
        # Initialize connection
        await bridge.initialize()
        
        # Process all demo fields
        for field_id in MCP_CONFIG['fields']:
            result = await bridge.process_field_complete(field_id)
            print(f"Processed {field_id}: {result['classification']}")
        
        # Get overall status
        all_fields = bridge.get_all_fields_status()
        print(f"Total fields: {len(all_fields)}")
        
    except Exception as e:
        logger.error(f"Demo failed: {e}")
    
    finally:
        await bridge.client.disconnect()

if __name__ == "__main__":
    # Run demo
    asyncio.run(demo_mcp_integration())
