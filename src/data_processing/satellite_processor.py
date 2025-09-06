"""
Satellite imagery processing module for Sentinel-2 data
Handles downloading, preprocessing, and feature extraction
"""

import numpy as np
import rasterio
from rasterio.warp import calculate_default_transform, reproject, Resampling
from rasterio.windows import Window
import geopandas as gpd
from shapely.geometry import box
import pandas as pd
from typing import Tuple, Dict, List, Optional
from datetime import datetime, timedelta
import requests
import os
from dataclasses import dataclass
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class BandData:
    """Container for satellite band data"""
    red: np.ndarray
    green: np.ndarray
    blue: np.ndarray
    nir: np.ndarray
    red_edge: np.ndarray
    
class SentinelProcessor:
    """Main class for processing Sentinel-2 satellite imagery"""
    
    def __init__(self, client_id: str, client_secret: str):
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token = None
        self.token_expires = None
        
    def authenticate(self) -> bool:
        """Authenticate with Sentinel Hub API"""
        try:
            auth_url = "https://services.sentinel-hub.com/oauth/token"
            data = {
                'grant_type': 'client_credentials',
                'client_id': self.client_id,
                'client_secret': self.client_secret
            }
            
            response = requests.post(auth_url, data=data)
            response.raise_for_status()
            
            token_data = response.json()
            self.access_token = token_data['access_token']
            self.token_expires = datetime.now() + timedelta(seconds=token_data['expires_in'])
            
            logger.info("Successfully authenticated with Sentinel Hub")
            return True
            
        except Exception as e:
            logger.error(f"Authentication failed: {e}")
            return False
    
    def download_sentinel_image(self, 
                              bbox: Tuple[float, float, float, float],
                              date_range: Tuple[str, str],
                              resolution: int = 10,
                              max_cloud_coverage: float = 20.0) -> Optional[BandData]:
        """
        Download Sentinel-2 imagery for specified area and time range
        
        Args:
            bbox: Bounding box (min_lon, min_lat, max_lon, max_lat)
            date_range: Date range tuple (start_date, end_date) in 'YYYY-MM-DD' format
            resolution: Spatial resolution in meters
            max_cloud_coverage: Maximum allowed cloud coverage percentage
            
        Returns:
            BandData object containing all relevant bands
        """
        if not self.access_token or datetime.now() >= self.token_expires:
            if not self.authenticate():
                return None
                
        try:
            # Sentinel Hub Process API request
            evalscript = """
            //VERSION=3
            function setup() {
                return {
                    input: ["B02", "B03", "B04", "B05", "B08", "SCL"],
                    output: { bands: 6 }
                };
            }
            
            function evaluatePixel(sample) {
                return [sample.B02/10000, sample.B03/10000, sample.B04/10000, 
                       sample.B05/10000, sample.B08/10000, sample.SCL];
            }
            """
            
            request_payload = {
                "input": {
                    "bounds": {
                        "bbox": bbox,
                        "properties": {"crs": "http://www.opengis.net/def/crs/EPSG/0/4326"}
                    },
                    "data": [{
                        "type": "sentinel-2-l2a",
                        "dataFilter": {
                            "timeRange": {
                                "from": f"{date_range[0]}T00:00:00Z",
                                "to": f"{date_range[1]}T23:59:59Z"
                            },
                            "maxCloudCoverage": max_cloud_coverage
                        }
                    }]
                },
                "output": {
                    "width": 512,
                    "height": 512,
                    "responses": [{
                        "identifier": "default",
                        "format": {"type": "image/tiff"}
                    }]
                },
                "evalscript": evalscript
            }
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            process_url = "https://services.sentinel-hub.com/api/v1/process"
            response = requests.post(process_url, json=request_payload, headers=headers)
            response.raise_for_status()
            
            # Save temporary file and read bands
            temp_file = "temp_sentinel.tif"
            with open(temp_file, 'wb') as f:
                f.write(response.content)
                
            # Read the multi-band TIFF
            with rasterio.open(temp_file) as dataset:
                blue = dataset.read(1)    # B02
                green = dataset.read(2)   # B03
                red = dataset.read(3)     # B04
                red_edge = dataset.read(4) # B05
                nir = dataset.read(5)     # B08
                
            # Clean up
            os.remove(temp_file)
            
            logger.info(f"Successfully downloaded Sentinel-2 imagery for bbox {bbox}")
            return BandData(red=red, green=green, blue=blue, nir=nir, red_edge=red_edge)
            
        except Exception as e:
            logger.error(f"Failed to download Sentinel-2 imagery: {e}")
            return None
    
    def calculate_vegetation_indices(self, band_data: BandData) -> Dict[str, np.ndarray]:
        """
        Calculate various vegetation indices from band data
        
        Args:
            band_data: BandData object containing satellite bands
            
        Returns:
            Dictionary containing calculated indices
        """
        indices = {}
        
        # NDVI (Normalized Difference Vegetation Index)
        # NDVI = (NIR - RED) / (NIR + RED)
        ndvi_denominator = band_data.nir + band_data.red
        ndvi_denominator = np.where(ndvi_denominator == 0, 1e-10, ndvi_denominator)
        indices['NDVI'] = (band_data.nir - band_data.red) / ndvi_denominator
        
        # NDRE (Normalized Difference Red Edge)
        # NDRE = (NIR - RedEdge) / (NIR + RedEdge)
        ndre_denominator = band_data.nir + band_data.red_edge
        ndre_denominator = np.where(ndre_denominator == 0, 1e-10, ndre_denominator)
        indices['NDRE'] = (band_data.nir - band_data.red_edge) / ndre_denominator
        
        # GNDVI (Green Normalized Difference Vegetation Index)
        # GNDVI = (NIR - GREEN) / (NIR + GREEN)
        gndvi_denominator = band_data.nir + band_data.green
        gndvi_denominator = np.where(gndvi_denominator == 0, 1e-10, gndvi_denominator)
        indices['GNDVI'] = (band_data.nir - band_data.green) / gndvi_denominator
        
        # SAVI (Soil Adjusted Vegetation Index)
        # SAVI = ((NIR - RED) / (NIR + RED + L)) * (1 + L), where L = 0.5
        L = 0.5
        savi_denominator = band_data.nir + band_data.red + L
        savi_denominator = np.where(savi_denominator == 0, 1e-10, savi_denominator)
        indices['SAVI'] = ((band_data.nir - band_data.red) / savi_denominator) * (1 + L)
        
        # EVI (Enhanced Vegetation Index)
        # EVI = 2.5 * ((NIR - RED) / (NIR + 6*RED - 7.5*BLUE + 1))
        evi_denominator = band_data.nir + 6*band_data.red - 7.5*band_data.blue + 1
        evi_denominator = np.where(evi_denominator == 0, 1e-10, evi_denominator)
        indices['EVI'] = 2.5 * ((band_data.nir - band_data.red) / evi_denominator)
        
        # MCARI (Modified Chlorophyll Absorption Ratio Index)
        # MCARI = ((RedEdge - RED) - 0.2 * (RedEdge - GREEN)) * (RedEdge / RED)
        red_safe = np.where(band_data.red == 0, 1e-10, band_data.red)
        indices['MCARI'] = ((band_data.red_edge - band_data.red) - 
                           0.2 * (band_data.red_edge - band_data.green)) * \
                           (band_data.red_edge / red_safe)
        
        # Clip indices to reasonable ranges
        for key in indices:
            indices[key] = np.clip(indices[key], -1, 1)
            
        logger.info(f"Calculated {len(indices)} vegetation indices")
        return indices
    
    def extract_features_for_ml(self, band_data: BandData, 
                               indices: Dict[str, np.ndarray]) -> pd.DataFrame:
        """
        Extract features suitable for machine learning from imagery data
        
        Args:
            band_data: BandData object containing satellite bands
            indices: Dictionary of calculated vegetation indices
            
        Returns:
            DataFrame with extracted features
        """
        features = []
        
        # Get dimensions
        height, width = band_data.red.shape
        
        # Create pixel coordinates
        y_coords, x_coords = np.mgrid[0:height, 0:width]
        
        # Flatten all arrays
        data = {
            'x_coord': x_coords.flatten(),
            'y_coord': y_coords.flatten(),
            'red': band_data.red.flatten(),
            'green': band_data.green.flatten(),
            'blue': band_data.blue.flatten(),
            'nir': band_data.nir.flatten(),
            'red_edge': band_data.red_edge.flatten()
        }
        
        # Add vegetation indices
        for name, index in indices.items():
            data[name] = index.flatten()
        
        # Add texture features (local standard deviation)
        from scipy.ndimage import generic_filter
        
        def local_std(arr):
            return np.std(arr)
        
        for band_name, band_array in [('red', band_data.red), ('nir', band_data.nir)]:
            texture = generic_filter(band_array, local_std, size=3)
            data[f'{band_name}_texture'] = texture.flatten()
        
        # Add spectral ratios
        data['red_nir_ratio'] = data['red'] / (data['nir'] + 1e-10)
        data['green_red_ratio'] = data['green'] / (data['red'] + 1e-10)
        data['nir_red_edge_ratio'] = data['nir'] / (data['red_edge'] + 1e-10)
        
        df = pd.DataFrame(data)
        
        # Remove invalid pixels (clouds, water, etc.)
        df = df[df['NDVI'] > -0.5]  # Basic filter for valid vegetation pixels
        
        logger.info(f"Extracted features for {len(df)} valid pixels")
        return df
    
    def segment_field_zones(self, indices: Dict[str, np.ndarray], 
                           n_zones: int = 5) -> np.ndarray:
        """
        Segment field into management zones based on vegetation indices
        
        Args:
            indices: Dictionary of vegetation indices
            n_zones: Number of zones to create
            
        Returns:
            Array with zone labels for each pixel
        """
        from sklearn.cluster import KMeans
        from sklearn.preprocessing import StandardScaler
        
        # Stack indices for clustering
        features = np.stack([indices['NDVI'], indices['NDRE'], indices['SAVI']], axis=-1)
        original_shape = features.shape[:2]
        
        # Reshape for clustering
        features_flat = features.reshape(-1, features.shape[-1])
        
        # Remove invalid pixels
        valid_mask = ~np.isnan(features_flat).any(axis=1)
        valid_features = features_flat[valid_mask]
        
        if len(valid_features) == 0:
            logger.warning("No valid pixels found for zone segmentation")
            return np.zeros(original_shape, dtype=int)
        
        # Standardize features
        scaler = StandardScaler()
        scaled_features = scaler.fit_transform(valid_features)
        
        # Perform clustering
        kmeans = KMeans(n_clusters=n_zones, random_state=42, n_init=10)
        labels = kmeans.fit_predict(scaled_features)
        
        # Map back to original shape
        zone_map = np.full(len(features_flat), -1, dtype=int)
        zone_map[valid_mask] = labels
        zone_map = zone_map.reshape(original_shape)
        
        logger.info(f"Segmented field into {n_zones} management zones")
        return zone_map
    
    def calculate_zone_statistics(self, indices: Dict[str, np.ndarray], 
                                 zone_map: np.ndarray) -> pd.DataFrame:
        """
        Calculate statistics for each management zone
        
        Args:
            indices: Dictionary of vegetation indices
            zone_map: Array with zone labels
            
        Returns:
            DataFrame with zone statistics
        """
        zone_stats = []
        
        for zone_id in np.unique(zone_map):
            if zone_id == -1:  # Skip invalid pixels
                continue
                
            zone_mask = zone_map == zone_id
            zone_area = np.sum(zone_mask)
            
            stats = {
                'zone_id': zone_id,
                'area_pixels': zone_area,
                'area_percentage': (zone_area / zone_map.size) * 100
            }
            
            # Calculate mean and std for each index
            for index_name, index_array in indices.items():
                zone_values = index_array[zone_mask]
                stats[f'{index_name}_mean'] = np.mean(zone_values)
                stats[f'{index_name}_std'] = np.std(zone_values)
                stats[f'{index_name}_min'] = np.min(zone_values)
                stats[f'{index_name}_max'] = np.max(zone_values)
            
            zone_stats.append(stats)
        
        df_stats = pd.DataFrame(zone_stats)
        logger.info(f"Calculated statistics for {len(df_stats)} zones")
        return df_stats

def create_sample_data():
    """Create sample satellite data for demonstration purposes"""
    # Generate synthetic Sentinel-2 like data
    height, width = 256, 256
    
    # Create realistic-looking agricultural field data
    np.random.seed(42)
    
    # Base vegetation pattern
    x = np.linspace(0, 10, width)
    y = np.linspace(0, 10, height)
    X, Y = np.meshgrid(x, y)
    
    # Create field patterns with growth stages
    base_vegetation = 0.3 + 0.4 * np.sin(X/2) * np.cos(Y/2)
    
    # Add noise and variations
    noise = np.random.normal(0, 0.05, (height, width))
    vegetation_pattern = np.clip(base_vegetation + noise, 0, 1)
    
    # Create band data based on vegetation pattern
    red = 0.1 + 0.3 * (1 - vegetation_pattern) + np.random.normal(0, 0.02, (height, width))
    green = 0.15 + 0.35 * (1 - vegetation_pattern) + np.random.normal(0, 0.02, (height, width))
    blue = 0.08 + 0.25 * (1 - vegetation_pattern) + np.random.normal(0, 0.02, (height, width))
    nir = 0.2 + 0.6 * vegetation_pattern + np.random.normal(0, 0.03, (height, width))
    red_edge = 0.15 + 0.5 * vegetation_pattern + np.random.normal(0, 0.025, (height, width))
    
    # Clip to valid ranges
    red = np.clip(red, 0, 1)
    green = np.clip(green, 0, 1)
    blue = np.clip(blue, 0, 1)
    nir = np.clip(nir, 0, 1)
    red_edge = np.clip(red_edge, 0, 1)
    
    return BandData(red=red, green=green, blue=blue, nir=nir, red_edge=red_edge)

if __name__ == "__main__":
    # Demo usage
    print("Creating sample satellite data...")
    sample_data = create_sample_data()
    
    # Initialize processor (with dummy credentials for demo)
    processor = SentinelProcessor("demo_client_id", "demo_client_secret")
    
    # Calculate vegetation indices
    print("Calculating vegetation indices...")
    indices = processor.calculate_vegetation_indices(sample_data)
    
    # Extract ML features
    print("Extracting ML features...")
    features_df = processor.extract_features_for_ml(sample_data, indices)
    print(f"Extracted {len(features_df)} feature vectors")
    print(f"Feature columns: {list(features_df.columns)}")
    
    # Segment into zones
    print("Segmenting field into management zones...")
    zone_map = processor.segment_field_zones(indices, n_zones=5)
    
    # Calculate zone statistics
    print("Calculating zone statistics...")
    zone_stats = processor.calculate_zone_statistics(indices, zone_map)
    print("\nZone Statistics:")
    print(zone_stats[['zone_id', 'area_percentage', 'NDVI_mean', 'NDRE_mean']].round(3))
