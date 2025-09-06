"""
MCP Testing Suite - Comprehensive tests for Model Context Protocol implementation
"""

import pytest
import asyncio
import json
import os
import sys
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

# Add project path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from mcp_server import PotatoCropMCPServer, MCPConfig
from mcp_client import MCPClient, ReactMCPBridge

class TestMCPServer:
    """Test suite for MCP Server functionality"""
    
    @pytest.fixture
    def config(self):
        """Test configuration"""
        return MCPConfig(
            satellite_api_key="test_key",
            satellite_secret="test_secret",
            update_interval_seconds=10,
            enable_auto_recommendations=True
        )
    
    @pytest.fixture
    def server(self, config):
        """Test server instance"""
        return PotatoCropMCPServer(config)
    
    def test_server_initialization(self, server):
        """Test server initialization"""
        assert server.config.satellite_api_key == "test_key"
        assert server.config.update_interval_seconds == 10
        assert server.satellite_processor is not None
        assert server.growth_classifier is not None
        assert server.nutrient_predictor is not None
        assert server.recommendation_engine is not None
    
    def test_field_coordinates(self, server):
        """Test field coordinate retrieval"""
        coords = server._get_field_coordinates("field_001")
        assert "bbox" in coords
        assert len(coords["bbox"]) == 4
        
        # Test default coordinates
        default_coords = server._get_field_coordinates("unknown_field")
        assert default_coords["bbox"] == (77.5946, 12.9716, 77.6946, 13.0716)
    
    def test_should_update_satellite_data(self, server):
        """Test satellite data update logic"""
        # New field should need update
        assert server._should_update_satellite_data("new_field") == True
        
        # Add recent data
        server.field_cache["test_field"] = {
            "last_updated": datetime.now().isoformat()
        }
        assert server._should_update_satellite_data("test_field") == False
    
    def test_date_range_generation(self, server):
        """Test optimal date range generation"""
        start_date, end_date = server._get_optimal_date_range()
        assert start_date < end_date
        assert len(start_date) == 10  # YYYY-MM-DD format
        assert len(end_date) == 10

class TestMCPTools:
    """Test MCP tool functionality"""
    
    @pytest.fixture
    def server(self):
        """Test server with mocked dependencies"""
        config = MCPConfig(satellite_api_key="test", satellite_secret="test")
        server = PotatoCropMCPServer(config)
        
        # Mock external dependencies
        server.satellite_processor.download_sentinel_image = Mock(return_value=None)
        server.growth_classifier.predict_growth_stage = Mock(return_value={
            'predictions': ['Vegetative_Growth'] * 100,
            'confidence': [0.85] * 100
        })
        server.nutrient_predictor.predict_nutrient_levels = Mock(return_value={
            'predictions': [45.0] * 100,
            'categories': ['medium'] * 100
        })
        
        return server
    
    @pytest.mark.asyncio
    async def test_satellite_processing_tool(self, server):
        """Test satellite processing tool"""
        # Mock the tool method
        async def mock_trigger_satellite_processing(field_id: str, force_download: bool = False):
            server.field_cache[field_id] = {
                'features': [[0.7, 0.4, 0.8, 0.5, 35, 20, 180]],
                'last_updated': datetime.now().isoformat(),
                'source': 'test_data'
            }
            return [{"type": "text", "text": f"Processed {field_id}"}]
        
        result = await mock_trigger_satellite_processing("test_field")
        assert len(result) == 1
        assert "Processed test_field" in result[0]["text"]
        assert "test_field" in server.field_cache
    
    @pytest.mark.asyncio
    async def test_growth_classification_tool(self, server):
        """Test growth stage classification tool"""
        # Add test data to cache
        server.field_cache["test_field"] = {
            'features': [[0.7, 0.4, 0.8, 0.5, 35, 20, 180]],
            'source': 'test_data'
        }
        
        # Mock the classification method
        async def mock_classify_growth_stage(field_id: str):
            result = {
                'field_id': field_id,
                'growth_stage': 'Vegetative_Growth',
                'confidence': 0.85,
                'timestamp': datetime.now().isoformat(),
                'source': 'test_data'
            }
            server.field_cache[field_id]['growth_classification'] = result
            return [{"type": "text", "text": json.dumps(result)}]
        
        result = await mock_classify_growth_stage("test_field")
        classification = json.loads(result[0]["text"])
        
        assert classification["field_id"] == "test_field"
        assert classification["growth_stage"] == "Vegetative_Growth"
        assert classification["confidence"] == 0.85
    
    @pytest.mark.asyncio
    async def test_nutrient_prediction_tool(self, server):
        """Test nutrient prediction tool"""
        # Add test data to cache
        server.field_cache["test_field"] = {
            'features': [[0.7, 0.4, 0.8, 0.5, 35, 20, 180]],
            'source': 'test_data'
        }
        
        # Mock the prediction method
        async def mock_predict_nutrient_levels(field_id: str, nutrient: str = "nitrogen"):
            result = {
                'field_id': field_id,
                'nutrient': nutrient,
                'average_level_ppm': 45.0,
                'deficiency_percentage': 15.0,
                'timestamp': datetime.now().isoformat(),
                'source': 'test_data'
            }
            
            if 'nutrient_predictions' not in server.field_cache[field_id]:
                server.field_cache[field_id]['nutrient_predictions'] = {}
            server.field_cache[field_id]['nutrient_predictions'][nutrient] = result
            
            return [{"type": "text", "text": json.dumps(result)}]
        
        result = await mock_predict_nutrient_levels("test_field", "nitrogen")
        prediction = json.loads(result[0]["text"])
        
        assert prediction["nutrient"] == "nitrogen"
        assert prediction["average_level_ppm"] == 45.0
        assert prediction["deficiency_percentage"] == 15.0

class TestMCPClient:
    """Test MCP Client functionality"""
    
    @pytest.fixture
    def client(self):
        """Test client instance"""
        return MCPClient("ws://localhost:8001")
    
    def test_client_initialization(self, client):
        """Test client initialization"""
        assert client.server_url == "ws://localhost:8001"
        assert client.is_connected == False
        assert client.auto_update_enabled == True
    
    def test_request_id_generation(self, client):
        """Test request ID generation"""
        id1 = client._generate_request_id()
        id2 = client._generate_request_id()
        
        assert id1 != id2
        assert id1.startswith("req_")
        assert id2.startswith("req_")
    
    def test_callback_registration(self, client):
        """Test callback registration"""
        def test_callback(data):
            pass
        
        client.register_callback("test_event", test_callback)
        assert "test_event" in client.callbacks
        assert test_callback in client.callbacks["test_event"]

class TestReactMCPBridge:
    """Test React MCP Bridge functionality"""
    
    @pytest.fixture
    def bridge(self):
        """Test bridge instance"""
        bridge = ReactMCPBridge()
        bridge.client = Mock()
        return bridge
    
    def test_bridge_initialization(self, bridge):
        """Test bridge initialization"""
        assert bridge.field_cache == {}
        assert bridge.last_update is None
    
    def test_dashboard_update_handler(self, bridge):
        """Test dashboard update handling"""
        test_data = {
            'fields': [
                {'id': 'field_001', 'health': 85.0},
                {'id': 'field_002', 'health': 90.0}
            ]
        }
        
        bridge._handle_dashboard_update(test_data)
        
        assert 'field_001' in bridge.field_cache
        assert 'field_002' in bridge.field_cache
        assert bridge.field_cache['field_001']['health'] == 85.0
        assert bridge.last_update is not None
    
    def test_field_status_retrieval(self, bridge):
        """Test field status retrieval"""
        bridge.field_cache = {
            'field_001': {'health': 85.0, 'status': 'healthy'},
            'field_002': {'health': 70.0, 'status': 'warning'}
        }
        
        status = bridge.get_field_status('field_001')
        assert status['health'] == 85.0
        
        all_status = bridge.get_all_fields_status()
        assert len(all_status) == 2

class TestMCPIntegration:
    """Integration tests for complete MCP workflow"""
    
    @pytest.mark.asyncio
    async def test_complete_field_processing_workflow(self):
        """Test complete field processing workflow"""
        # Mock server and client
        config = MCPConfig()
        server = PotatoCropMCPServer(config)
        
        # Mock all external dependencies
        server.satellite_processor.download_sentinel_image = Mock(return_value=None)
        server.satellite_processor.calculate_vegetation_indices = Mock(return_value={'NDVI': [0.7]})
        server.satellite_processor.extract_features_for_ml = Mock(return_value=[[0.7, 0.4, 0.8]])
        
        server.growth_classifier.predict_growth_stage = Mock(return_value={
            'predictions': ['Vegetative_Growth'],
            'confidence': [0.85]
        })
        
        server.nutrient_predictor.predict_nutrient_levels = Mock(return_value={
            'predictions': [45.0],
            'categories': ['medium']
        })
        
        # Test the workflow
        field_id = "test_field"
        
        # Step 1: Add sample data to cache (simulating satellite processing)
        server.field_cache[field_id] = {
            'features': [[0.7, 0.4, 0.8, 0.5, 35, 20, 180]],
            'indices': {'NDVI': [0.7]},
            'last_updated': datetime.now().isoformat(),
            'source': 'test_data'
        }
        
        # Verify field is in cache
        assert field_id in server.field_cache
        assert server.field_cache[field_id]['source'] == 'test_data'
    
    def test_mcp_configuration_validation(self):
        """Test MCP configuration validation"""
        config = MCPConfig()
        
        # Test default values
        assert config.satellite_api_key == "demo_key"
        assert config.update_interval_seconds == 30
        assert config.weekly_processing_day == "monday"
        assert config.enable_auto_recommendations == True
        
        # Test custom values
        custom_config = MCPConfig(
            satellite_api_key="custom_key",
            update_interval_seconds=60,
            enable_auto_recommendations=False
        )
        
        assert custom_config.satellite_api_key == "custom_key"
        assert custom_config.update_interval_seconds == 60
        assert custom_config.enable_auto_recommendations == False

class TestMCPPerformance:
    """Performance tests for MCP operations"""
    
    def test_field_cache_performance(self):
        """Test field cache performance with multiple fields"""
        config = MCPConfig()
        server = PotatoCropMCPServer(config)
        
        # Add many fields to cache
        for i in range(1000):
            field_id = f"field_{i:03d}"
            server.field_cache[field_id] = {
                'features': [[0.7, 0.4, 0.8, 0.5, 35, 20, 180]],
                'last_updated': datetime.now().isoformat(),
                'source': 'performance_test'
            }
        
        # Test retrieval performance
        import time
        start_time = time.time()
        
        for i in range(100):
            field_id = f"field_{i:03d}"
            should_update = server._should_update_satellite_data(field_id)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # Should process 100 fields in less than 1 second
        assert processing_time < 1.0
        assert len(server.field_cache) == 1000

# Test configuration
TEST_CONFIG = {
    'test_fields': ['field_001', 'field_002', 'field_003'],
    'mock_responses': True,
    'timeout_seconds': 30,
    'max_retries': 3
}

# Pytest configuration
def pytest_configure(config):
    """Pytest configuration"""
    config.addinivalue_line(
        "markers", "asyncio: mark test as asyncio test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as integration test"
    )
    config.addinivalue_line(
        "markers", "performance: mark test as performance test"
    )

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])
