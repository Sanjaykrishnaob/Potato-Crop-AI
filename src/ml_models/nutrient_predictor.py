"""
Nutrient prediction models for potato crops
Predicts nitrogen levels and identifies low-fertility zones
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge, Lasso
from sklearn.svm import SVR
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import xgboost as xgb
import lightgbm as lgb
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Tuple, Dict, List, Optional
import logging
from scipy import stats

logger = logging.getLogger(__name__)

class NutrientPredictor:
    """
    Machine learning models for predicting nutrient levels in potato crops
    """
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.feature_importance = {}
        self.model_performance = {}
        
        # Define nutrient ranges for potatoes (ppm or %)
        self.nutrient_ranges = {
            'nitrogen': {'low': 30, 'medium': 50, 'high': 70, 'optimal': (40, 60)},
            'phosphorus': {'low': 15, 'medium': 25, 'high': 35, 'optimal': (20, 30)},
            'potassium': {'low': 150, 'medium': 200, 'high': 250, 'optimal': (180, 220)},
            'sulfur': {'low': 10, 'medium': 20, 'high': 30, 'optimal': (15, 25)},
            'magnesium': {'low': 50, 'medium': 80, 'high': 120, 'optimal': (60, 100)},
            'calcium': {'low': 1000, 'medium': 1500, 'high': 2000, 'optimal': (1200, 1800)}
        }
    
    def generate_synthetic_nutrient_data(self, n_samples: int = 5000) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Generate synthetic data linking vegetation indices to nutrient levels
        """
        np.random.seed(42)
        
        # Generate base vegetation indices
        ndvi = np.random.beta(4, 2, n_samples) * 0.9 + 0.1  # Skewed towards higher values
        ndre = ndvi * 0.7 + np.random.normal(0, 0.05, n_samples)
        savi = ndvi * 1.2 + np.random.normal(0, 0.03, n_samples)
        gndvi = ndvi * 0.9 + np.random.normal(0, 0.04, n_samples)
        evi = ndvi * 1.3 + np.random.normal(0, 0.06, n_samples)
        
        # Clip to valid ranges
        ndre = np.clip(ndre, 0, 1)
        savi = np.clip(savi, 0, 1.5)
        gndvi = np.clip(gndvi, 0, 1)
        evi = np.clip(evi, -1, 3)
        
        # Generate spectral bands
        red = 0.2 - ndvi * 0.15 + np.random.normal(0, 0.02, n_samples)
        green = 0.15 - ndvi * 0.1 + np.random.normal(0, 0.015, n_samples)
        blue = 0.1 - ndvi * 0.08 + np.random.normal(0, 0.01, n_samples)
        nir = 0.3 + ndvi * 0.6 + np.random.normal(0, 0.03, n_samples)
        red_edge = 0.25 + ndre * 0.5 + np.random.normal(0, 0.025, n_samples)
        
        # Clip spectral bands
        red = np.clip(red, 0, 1)
        green = np.clip(green, 0, 1)
        blue = np.clip(blue, 0, 1)
        nir = np.clip(nir, 0, 1)
        red_edge = np.clip(red_edge, 0, 1)
        
        # Environmental factors
        soil_ph = np.random.normal(6.5, 0.8, n_samples)
        soil_ph = np.clip(soil_ph, 4.5, 8.5)
        
        soil_organic_matter = np.random.gamma(2, 1.5, n_samples)
        soil_organic_matter = np.clip(soil_organic_matter, 0.5, 8.0)
        
        temperature = np.random.normal(20, 5, n_samples)
        humidity = np.random.normal(65, 15, n_samples)
        humidity = np.clip(humidity, 30, 100)
        
        precipitation = np.random.exponential(2, n_samples)
        precipitation = np.clip(precipitation, 0, 10)
        
        # Growth stage influence (encoded as numeric)
        growth_stage = np.random.choice([0, 1, 2, 3, 4, 5], n_samples)  # 6 stages
        
        # Texture features (simulated)
        red_texture = np.random.exponential(0.05, n_samples)
        nir_texture = np.random.exponential(0.08, n_samples)
        
        # Create features DataFrame
        features = pd.DataFrame({
            'NDVI': ndvi,
            'NDRE': ndre,
            'SAVI': savi,
            'GNDVI': gndvi,
            'EVI': evi,
            'red': red,
            'green': green,
            'blue': blue,
            'nir': nir,
            'red_edge': red_edge,
            'red_nir_ratio': red / (nir + 1e-10),
            'green_red_ratio': green / (red + 1e-10),
            'nir_red_edge_ratio': nir / (red_edge + 1e-10),
            'soil_ph': soil_ph,
            'soil_organic_matter': soil_organic_matter,
            'temperature': temperature,
            'humidity': humidity,
            'precipitation': precipitation,
            'growth_stage': growth_stage,
            'red_texture': red_texture,
            'nir_texture': nir_texture
        })
        
        # Generate nutrient levels based on realistic relationships
        # Nitrogen - strongly correlated with NDVI and biomass
        nitrogen_base = (ndvi * 80 + 
                        soil_organic_matter * 8 + 
                        (growth_stage / 5) * 20 + 
                        np.random.normal(0, 8, n_samples))
        nitrogen = np.clip(nitrogen_base, 15, 100)
        
        # Phosphorus - influenced by soil pH and organic matter
        ph_factor = 1.0 - abs(soil_ph - 6.5) / 3.0  # Optimal at pH 6.5
        phosphorus_base = (soil_organic_matter * 6 + 
                          ph_factor * 15 + 
                          ndvi * 10 + 
                          np.random.normal(0, 5, n_samples))
        phosphorus = np.clip(phosphorus_base, 8, 50)
        
        # Potassium - less correlated with vegetation indices
        potassium_base = (150 + 
                         soil_organic_matter * 20 + 
                         ndvi * 30 + 
                         np.random.normal(0, 30, n_samples))
        potassium = np.clip(potassium_base, 80, 300)
        
        # Sulfur - moderate correlation with biomass
        sulfur_base = (soil_organic_matter * 3 + 
                      ndvi * 15 + 
                      np.random.normal(0, 4, n_samples))
        sulfur = np.clip(sulfur_base, 5, 40)
        
        # Magnesium - influenced by pH and clay content (simulated)
        magnesium_base = (60 + 
                         ph_factor * 30 + 
                         soil_organic_matter * 8 + 
                         np.random.normal(0, 15, n_samples))
        magnesium = np.clip(magnesium_base, 20, 150)
        
        # Calcium - strongly influenced by pH
        calcium_base = (ph_factor * 800 + 
                       soil_organic_matter * 100 + 
                       800 + 
                       np.random.normal(0, 200, n_samples))
        calcium = np.clip(calcium_base, 400, 2500)
        
        # Create targets DataFrame
        targets = pd.DataFrame({
            'nitrogen': nitrogen,
            'phosphorus': phosphorus,
            'potassium': potassium,
            'sulfur': sulfur,
            'magnesium': magnesium,
            'calcium': calcium
        })
        
        logger.info(f"Generated {n_samples} synthetic nutrient samples")
        return features, targets
    
    def train_models(self, X: pd.DataFrame, y: pd.DataFrame, 
                    target_nutrient: str = 'nitrogen') -> Dict[str, float]:
        """
        Train multiple models for nutrient prediction
        """
        if target_nutrient not in y.columns:
            raise ValueError(f"Target nutrient '{target_nutrient}' not found in targets")
        
        y_target = y[target_nutrient]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_target, test_size=0.2, random_state=42
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        self.scalers[target_nutrient] = scaler
        
        # Define models to train
        models_to_train = {
            'RandomForest': RandomForestRegressor(n_estimators=200, random_state=42),
            'GradientBoosting': GradientBoostingRegressor(n_estimators=200, random_state=42),
            'XGBoost': xgb.XGBRegressor(n_estimators=200, random_state=42),
            'LightGBM': lgb.LGBMRegressor(n_estimators=200, random_state=42, verbose=-1),
            'Ridge': Ridge(alpha=1.0),
            'SVR': SVR(kernel='rbf', C=1.0, gamma='scale')
        }
        
        results = {}
        best_score = -np.inf
        best_model = None
        best_name = None
        
        for name, model in models_to_train.items():
            try:
                # Use scaled data for linear models and SVR
                if name in ['Ridge', 'Lasso', 'SVR']:
                    model.fit(X_train_scaled, y_train)
                    y_pred = model.predict(X_test_scaled)
                    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, 
                                              scoring='neg_mean_squared_error')
                else:
                    model.fit(X_train, y_train)
                    y_pred = model.predict(X_test)
                    cv_scores = cross_val_score(model, X_train, y_train, cv=5, 
                                              scoring='neg_mean_squared_error')
                
                # Calculate metrics
                mse = mean_squared_error(y_test, y_pred)
                rmse = np.sqrt(mse)
                mae = mean_absolute_error(y_test, y_pred)
                r2 = r2_score(y_test, y_pred)
                
                results[name] = {
                    'mse': mse,
                    'rmse': rmse,
                    'mae': mae,
                    'r2': r2,
                    'cv_rmse_mean': np.sqrt(-cv_scores.mean()),
                    'cv_rmse_std': np.sqrt(cv_scores.std())
                }
                
                # Track best model based on R²
                if r2 > best_score:
                    best_score = r2
                    best_model = model
                    best_name = name
                
                logger.info(f"{name} - R²: {r2:.3f}, RMSE: {rmse:.2f}")
                
            except Exception as e:
                logger.error(f"Failed to train {name}: {e}")
                continue
        
        # Store best model
        self.models[target_nutrient] = best_model
        self.model_performance[target_nutrient] = results
        
        # Feature importance for tree-based models
        if hasattr(best_model, 'feature_importances_'):
            self.feature_importance[target_nutrient] = pd.DataFrame({
                'feature': X.columns,
                'importance': best_model.feature_importances_
            }).sort_values('importance', ascending=False)
        
        logger.info(f"Best model for {target_nutrient}: {best_name} (R² = {best_score:.3f})")
        return results
    
    def predict_nutrient_levels(self, X: pd.DataFrame, 
                               nutrient: str = 'nitrogen') -> Dict[str, np.ndarray]:
        """
        Predict nutrient levels for given features
        """
        if nutrient not in self.models:
            raise ValueError(f"No trained model found for {nutrient}")
        
        model = self.models[nutrient]
        
        # Use appropriate scaling based on model type
        model_name = type(model).__name__
        if model_name in ['Ridge', 'Lasso', 'SVR']:
            X_processed = self.scalers[nutrient].transform(X)
        else:
            X_processed = X
        
        predictions = model.predict(X_processed)
        
        # Calculate prediction intervals (approximate)
        if hasattr(model, 'estimators_'):  # For ensemble methods
            tree_predictions = np.array([tree.predict(X_processed) for tree in model.estimators_])
            prediction_std = np.std(tree_predictions, axis=0)
        else:
            prediction_std = np.full_like(predictions, np.std(predictions) * 0.1)
        
        # Classify nutrient levels
        categories = self._classify_nutrient_levels(predictions, nutrient)
        
        return {
            'predictions': predictions,
            'prediction_std': prediction_std,
            'categories': categories,
            'confidence_intervals': {
                'lower': predictions - 1.96 * prediction_std,
                'upper': predictions + 1.96 * prediction_std
            }
        }
    
    def _classify_nutrient_levels(self, values: np.ndarray, nutrient: str) -> np.ndarray:
        """
        Classify nutrient values into categories (low, medium, high)
        """
        ranges = self.nutrient_ranges[nutrient]
        
        categories = np.full(len(values), 'medium', dtype=object)
        categories[values < ranges['low']] = 'low'
        categories[values > ranges['high']] = 'high'
        
        return categories
    
    def create_deficiency_map(self, predictions: Dict[str, np.ndarray], 
                             nutrient: str,
                             shape: Tuple[int, int],
                             coordinates: pd.DataFrame) -> np.ndarray:
        """
        Create spatial map of nutrient deficiency zones
        """
        deficiency_map = np.zeros(shape)
        
        ranges = self.nutrient_ranges[nutrient]
        values = predictions['predictions']
        
        # Define deficiency levels
        # 0: Adequate, 1: Mild deficiency, 2: Moderate deficiency, 3: Severe deficiency
        for i, (x, y, value) in enumerate(zip(coordinates['x_coord'], 
                                            coordinates['y_coord'], 
                                            values)):
            if 0 <= y < shape[0] and 0 <= x < shape[1]:
                if value < ranges['low'] * 0.7:
                    deficiency_map[int(y), int(x)] = 3  # Severe
                elif value < ranges['low']:
                    deficiency_map[int(y), int(x)] = 2  # Moderate
                elif value < ranges['optimal'][0]:
                    deficiency_map[int(y), int(x)] = 1  # Mild
                else:
                    deficiency_map[int(y), int(x)] = 0  # Adequate
        
        return deficiency_map
    
    def calculate_fertilizer_requirements(self, predictions: Dict[str, np.ndarray], 
                                        field_area_ha: float,
                                        target_nutrient: str = 'nitrogen') -> Dict[str, float]:
        """
        Calculate fertilizer requirements based on predictions
        """
        values = predictions['predictions']
        categories = predictions['categories']
        
        # Count pixels by deficiency level
        low_count = np.sum(categories == 'low')
        total_pixels = len(categories)
        
        # Estimate deficient area
        deficient_area_ha = (low_count / total_pixels) * field_area_ha
        
        # Calculate fertilizer needs (simplified)
        ranges = self.nutrient_ranges[target_nutrient]
        avg_deficiency = ranges['low'] - np.mean(values[categories == 'low']) if low_count > 0 else 0
        
        # Fertilizer conversion factors (kg/ha per ppm increase)
        conversion_factors = {
            'nitrogen': 2.5,    # kg N/ha per ppm increase
            'phosphorus': 4.0,  # kg P2O5/ha per ppm increase  
            'potassium': 1.8,   # kg K2O/ha per ppm increase
        }
        
        if target_nutrient in conversion_factors:
            fertilizer_rate = avg_deficiency * conversion_factors[target_nutrient]
            total_fertilizer = fertilizer_rate * deficient_area_ha
        else:
            fertilizer_rate = 0
            total_fertilizer = 0
        
        return {
            'deficient_area_ha': deficient_area_ha,
            'deficient_percentage': (low_count / total_pixels) * 100,
            'avg_deficiency_ppm': avg_deficiency,
            'fertilizer_rate_kg_ha': fertilizer_rate,
            'total_fertilizer_kg': total_fertilizer,
            'estimated_cost_inr': total_fertilizer * self._get_fertilizer_price(target_nutrient)
        }
    
    def _get_fertilizer_price(self, nutrient: str) -> float:
        """Get fertilizer price per kg (INR)"""
        prices = {
            'nitrogen': 99.6,    # Urea (1.2 USD * 83)
            'phosphorus': 124.5,  # MAP/DAP (1.5 USD * 83)
            'potassium': 66.4,   # MOP (0.8 USD * 83)
            'sulfur': 49.8,      # 0.6 USD * 83
            'magnesium': 166.0,  # 2.0 USD * 83
            'calcium': 24.9      # 0.3 USD * 83
        }
        return prices.get(nutrient, 83.0)
    
    def analyze_nutrient_correlations(self, features: pd.DataFrame, 
                                    targets: pd.DataFrame) -> pd.DataFrame:
        """
        Analyze correlations between features and nutrients
        """
        # Calculate correlations
        correlation_data = []
        
        for nutrient in targets.columns:
            for feature in features.columns:
                corr = features[feature].corr(targets[nutrient])
                correlation_data.append({
                    'nutrient': nutrient,
                    'feature': feature,
                    'correlation': corr,
                    'abs_correlation': abs(corr)
                })
        
        corr_df = pd.DataFrame(correlation_data)
        return corr_df.sort_values('abs_correlation', ascending=False)
    
    def save_models(self, model_dir: str):
        """Save all trained models"""
        import os
        os.makedirs(model_dir, exist_ok=True)
        
        for nutrient in self.models:
            model_path = os.path.join(model_dir, f'{nutrient}_model.pkl')
            model_data = {
                'model': self.models[nutrient],
                'scaler': self.scalers[nutrient],
                'feature_importance': self.feature_importance.get(nutrient),
                'performance': self.model_performance.get(nutrient)
            }
            joblib.dump(model_data, model_path)
        
        logger.info(f"Models saved to {model_dir}")
    
    def load_models(self, model_dir: str):
        """Load trained models"""
        import os
        
        for nutrient in ['nitrogen', 'phosphorus', 'potassium']:
            model_path = os.path.join(model_dir, f'{nutrient}_model.pkl')
            if os.path.exists(model_path):
                model_data = joblib.load(model_path)
                self.models[nutrient] = model_data['model']
                self.scalers[nutrient] = model_data['scaler']
                self.feature_importance[nutrient] = model_data.get('feature_importance')
                self.model_performance[nutrient] = model_data.get('performance')
        
        logger.info(f"Models loaded from {model_dir}")

def demo_nutrient_prediction():
    """Demonstration of nutrient prediction system"""
    
    # Initialize predictor
    predictor = NutrientPredictor()
    
    # Generate synthetic data
    print("Generating synthetic nutrient data...")
    X, y = predictor.generate_synthetic_nutrient_data(n_samples=3000)
    
    print(f"Features shape: {X.shape}")
    print(f"Targets shape: {y.shape}")
    
    # Train models for each nutrient
    nutrients = ['nitrogen', 'phosphorus', 'potassium']
    
    for nutrient in nutrients:
        print(f"\nTraining models for {nutrient}...")
        results = predictor.train_models(X, y, target_nutrient=nutrient)
        
        print(f"Model performance for {nutrient}:")
        for model_name, metrics in results.items():
            print(f"  {model_name}: R² = {metrics['r2']:.3f}, RMSE = {metrics['rmse']:.2f}")
    
    # Make predictions on test data
    print(f"\nMaking predictions...")
    X_test, y_test = predictor.generate_synthetic_nutrient_data(n_samples=500)
    
    for nutrient in nutrients:
        predictions = predictor.predict_nutrient_levels(X_test, nutrient)
        
        # Calculate actual performance
        actual_values = y_test[nutrient]
        predicted_values = predictions['predictions']
        
        r2 = r2_score(actual_values, predicted_values)
        rmse = np.sqrt(mean_squared_error(actual_values, predicted_values))
        
        print(f"{nutrient}: R² = {r2:.3f}, RMSE = {rmse:.2f}")
        
        # Show category distribution
        categories = predictions['categories']
        unique, counts = np.unique(categories, return_counts=True)
        print(f"  Category distribution: {dict(zip(unique, counts))}")
    
    # Analyze correlations
    print(f"\nTop correlations with nitrogen:")
    correlations = predictor.analyze_nutrient_correlations(X_test, y_test)
    nitrogen_corr = correlations[correlations['nutrient'] == 'nitrogen'].head(10)
    for _, row in nitrogen_corr.iterrows():
        print(f"  {row['feature']}: {row['correlation']:.3f}")
    
    return predictor, X_test, y_test

if __name__ == "__main__":
    predictor, X_test, y_test = demo_nutrient_prediction()
