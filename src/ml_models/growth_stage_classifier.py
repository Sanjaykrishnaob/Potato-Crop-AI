"""
Growth stage classification model for potato crops
Uses CNN and Random Forest for multi-class classification
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.optimizers import Adam
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Tuple, Dict, List, Optional
import logging
from scipy import ndimage

logger = logging.getLogger(__name__)

class PotatoGrowthStageClassifier:
    """
    Multi-modal classifier for potato growth stages using satellite imagery features
    """
    
    def __init__(self):
        self.rf_model = None
        self.cnn_model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.feature_importance = None
        
        # Define growth stages
        self.growth_stages = [
            'Planting',
            'Emergence', 
            'Vegetative_Growth',
            'Tuber_Initiation',
            'Tuber_Bulking',
            'Maturation'
        ]
        
        # Define stage characteristics for synthetic data generation
        self.stage_characteristics = {
            'Planting': {'NDVI': (0.1, 0.2), 'NDRE': (0.05, 0.15), 'biomass': (0.0, 0.1)},
            'Emergence': {'NDVI': (0.2, 0.4), 'NDRE': (0.15, 0.25), 'biomass': (0.1, 0.3)},
            'Vegetative_Growth': {'NDVI': (0.4, 0.7), 'NDRE': (0.25, 0.4), 'biomass': (0.3, 0.6)},
            'Tuber_Initiation': {'NDVI': (0.7, 0.85), 'NDRE': (0.4, 0.6), 'biomass': (0.6, 0.8)},
            'Tuber_Bulking': {'NDVI': (0.8, 0.9), 'NDRE': (0.5, 0.7), 'biomass': (0.8, 0.95)},
            'Maturation': {'NDVI': (0.6, 0.8), 'NDRE': (0.3, 0.5), 'biomass': (0.7, 0.9)}
        }
    
    def generate_synthetic_training_data(self, n_samples_per_stage: int = 1000) -> Tuple[pd.DataFrame, np.ndarray]:
        """
        Generate synthetic training data for potato growth stages
        """
        synthetic_data = []
        labels = []
        
        for stage in self.growth_stages:
            stage_chars = self.stage_characteristics[stage]
            
            for _ in range(n_samples_per_stage):
                # Generate NDVI and NDRE based on stage characteristics
                ndvi = np.random.uniform(*stage_chars['NDVI'])
                ndre = np.random.uniform(*stage_chars['NDRE'])
                
                # Add some correlation and noise
                ndvi += np.random.normal(0, 0.05)
                ndre += np.random.normal(0, 0.03)
                
                # Calculate derived indices
                gndvi = ndvi + np.random.normal(0, 0.02)
                savi = ndvi * 1.2 + np.random.normal(0, 0.03)
                evi = ndvi * 1.5 + np.random.normal(0, 0.04)
                
                # Simulate band values
                nir = 0.3 + ndvi * 0.7 + np.random.normal(0, 0.02)
                red = 0.2 - ndvi * 0.15 + np.random.normal(0, 0.02)
                green = 0.15 - ndvi * 0.1 + np.random.normal(0, 0.015)
                red_edge = 0.2 + ndre * 0.6 + np.random.normal(0, 0.02)
                
                # Environmental factors affecting growth
                temperature = np.random.normal(20, 5)  # Celsius
                humidity = np.random.normal(65, 10)    # Percentage
                soil_moisture = np.random.normal(25, 5) # Percentage
                
                # Growing degree days (accumulated)
                stage_gdd = {
                    'Planting': np.random.normal(50, 20),
                    'Emergence': np.random.normal(150, 30),
                    'Vegetative_Growth': np.random.normal(400, 50),
                    'Tuber_Initiation': np.random.normal(700, 60),
                    'Tuber_Bulking': np.random.normal(1000, 80),
                    'Maturation': np.random.normal(1300, 100)
                }
                gdd = max(0, stage_gdd[stage])
                
                # Create feature vector
                features = {
                    'NDVI': ndvi,
                    'NDRE': ndre,
                    'GNDVI': gndvi,
                    'SAVI': savi,
                    'EVI': evi,
                    'red': red,
                    'green': green,
                    'nir': nir,
                    'red_edge': red_edge,
                    'red_nir_ratio': red / (nir + 1e-10),
                    'green_red_ratio': green / (red + 1e-10),
                    'nir_red_edge_ratio': nir / (red_edge + 1e-10),
                    'temperature': temperature,
                    'humidity': humidity,
                    'soil_moisture': soil_moisture,
                    'growing_degree_days': gdd,
                    'days_from_planting': max(0, gdd / 10),  # Approximate
                }
                
                synthetic_data.append(features)
                labels.append(stage)
        
        df = pd.DataFrame(synthetic_data)
        labels = np.array(labels)
        
        logger.info(f"Generated {len(df)} synthetic samples across {len(self.growth_stages)} growth stages")
        return df, labels
    
    def create_cnn_model(self, input_shape: Tuple[int, int, int]) -> Model:
        """
        Create CNN model for image-based growth stage classification
        """
        model = Sequential([
            Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
            MaxPooling2D(2, 2),
            Conv2D(64, (3, 3), activation='relu'),
            MaxPooling2D(2, 2),
            Conv2D(128, (3, 3), activation='relu'),
            MaxPooling2D(2, 2),
            Conv2D(128, (3, 3), activation='relu'),
            MaxPooling2D(2, 2),
            Flatten(),
            Dropout(0.5),
            Dense(512, activation='relu'),
            Dropout(0.5),
            Dense(256, activation='relu'),
            Dense(len(self.growth_stages), activation='softmax')
        ])
        
        model.compile(
            optimizer=Adam(learning_rate=0.001),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def prepare_image_patches(self, satellite_data: np.ndarray, 
                            indices: Dict[str, np.ndarray]) -> np.ndarray:
        """
        Prepare image patches for CNN training
        """
        # Stack vegetation indices to create multi-channel images
        channels = [
            indices['NDVI'],
            indices['NDRE'], 
            indices['SAVI'],
            indices['EVI'] if 'EVI' in indices else indices['GNDVI']
        ]
        
        # Stack channels
        image_stack = np.stack(channels, axis=-1)
        
        # Create patches (simulate field segments)
        patch_size = 32
        patches = []
        
        h, w = image_stack.shape[:2]
        for i in range(0, h - patch_size + 1, patch_size // 2):
            for j in range(0, w - patch_size + 1, patch_size // 2):
                patch = image_stack[i:i+patch_size, j:j+patch_size]
                patches.append(patch)
        
        return np.array(patches)
    
    def train_random_forest(self, X: pd.DataFrame, y: np.ndarray) -> Dict[str, float]:
        """
        Train Random Forest classifier
        """
        # Encode labels
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Hyperparameter tuning
        param_grid = {
            'n_estimators': [100, 200, 300],
            'max_depth': [10, 20, None],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4]
        }
        
        rf = RandomForestClassifier(random_state=42)
        grid_search = GridSearchCV(rf, param_grid, cv=5, scoring='accuracy', n_jobs=1)
        grid_search.fit(X_train_scaled, y_train)
        
        # Best model
        self.rf_model = grid_search.best_estimator_
        
        # Evaluate
        y_pred = self.rf_model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Feature importance
        self.feature_importance = pd.DataFrame({
            'feature': X.columns,
            'importance': self.rf_model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        # Cross-validation
        cv_scores = cross_val_score(self.rf_model, X_train_scaled, y_train, cv=5)
        
        results = {
            'accuracy': accuracy,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'best_params': grid_search.best_params_
        }
        
        logger.info(f"Random Forest trained - Accuracy: {accuracy:.3f}, CV: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
        return results
    
    def predict_growth_stage(self, features: pd.DataFrame) -> Dict[str, np.ndarray]:
        """
        Predict growth stage for given features
        """
        if self.rf_model is None:
            raise ValueError("Model not trained. Call train_random_forest first.")
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Predict
        predictions = self.rf_model.predict(features_scaled)
        probabilities = self.rf_model.predict_proba(features_scaled)
        
        # Decode predictions
        stage_predictions = self.label_encoder.inverse_transform(predictions)
        
        return {
            'predictions': stage_predictions,
            'probabilities': probabilities,
            'confidence': np.max(probabilities, axis=1)
        }
    
    def create_growth_stage_map(self, features: pd.DataFrame, 
                               original_shape: Tuple[int, int]) -> np.ndarray:
        """
        Create spatial map of growth stages
        """
        predictions = self.predict_growth_stage(features)
        
        # Map predictions back to spatial grid
        stage_map = np.zeros(original_shape, dtype=int)
        
        # Assuming features have x_coord and y_coord
        for i, (x, y) in enumerate(zip(features['x_coord'], features['y_coord'])):
            if 0 <= y < original_shape[0] and 0 <= x < original_shape[1]:
                stage_idx = np.where(self.label_encoder.classes_ == predictions['predictions'][i])[0][0]
                stage_map[int(y), int(x)] = stage_idx
        
        return stage_map
    
    def save_model(self, model_path: str):
        """Save trained model"""
        model_data = {
            'rf_model': self.rf_model,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'feature_importance': self.feature_importance,
            'growth_stages': self.growth_stages
        }
        joblib.dump(model_data, model_path)
        logger.info(f"Model saved to {model_path}")
    
    def load_model(self, model_path: str):
        """Load trained model"""
        model_data = joblib.load(model_path)
        self.rf_model = model_data['rf_model']
        self.scaler = model_data['scaler']
        self.label_encoder = model_data['label_encoder']
        self.feature_importance = model_data['feature_importance']
        self.growth_stages = model_data['growth_stages']
        logger.info(f"Model loaded from {model_path}")
    
    def plot_feature_importance(self, top_n: int = 15):
        """Plot feature importance"""
        if self.feature_importance is None:
            logger.warning("No feature importance available. Train model first.")
            return
        
        plt.figure(figsize=(10, 8))
        top_features = self.feature_importance.head(top_n)
        
        sns.barplot(data=top_features, x='importance', y='feature')
        plt.title('Top Feature Importance for Growth Stage Classification')
        plt.xlabel('Importance Score')
        plt.tight_layout()
        plt.show()
    
    def generate_classification_report(self, X_test: pd.DataFrame, 
                                     y_test: np.ndarray) -> str:
        """Generate detailed classification report"""
        predictions = self.predict_growth_stage(X_test)
        
        # Convert true labels to encoded format for comparison
        y_test_encoded = self.label_encoder.transform(y_test)
        pred_encoded = self.label_encoder.transform(predictions['predictions'])
        
        report = classification_report(
            y_test_encoded, 
            pred_encoded,
            target_names=self.growth_stages,
            output_dict=False
        )
        
        return report

class FieldAnalyzer:
    """Analyze field-level growth patterns"""
    
    def __init__(self, classifier: PotatoGrowthStageClassifier):
        self.classifier = classifier
    
    def analyze_field_uniformity(self, stage_map: np.ndarray) -> Dict[str, float]:
        """Analyze growth stage uniformity across the field"""
        unique_stages, counts = np.unique(stage_map, return_counts=True)
        total_pixels = stage_map.size
        
        # Calculate entropy (uniformity measure)
        proportions = counts / total_pixels
        entropy = -np.sum(proportions * np.log2(proportions + 1e-10))
        max_entropy = np.log2(len(self.classifier.growth_stages))
        uniformity_score = 1 - (entropy / max_entropy)
        
        # Dominant stage
        dominant_stage_idx = unique_stages[np.argmax(counts)]
        dominant_stage = self.classifier.growth_stages[dominant_stage_idx]
        dominant_percentage = counts[np.argmax(counts)] / total_pixels * 100
        
        return {
            'uniformity_score': uniformity_score,
            'entropy': entropy,
            'dominant_stage': dominant_stage,
            'dominant_percentage': dominant_percentage,
            'num_stages_present': len(unique_stages)
        }
    
    def detect_growth_anomalies(self, stage_map: np.ndarray, 
                               confidence_map: np.ndarray,
                               confidence_threshold: float = 0.7) -> np.ndarray:
        """Detect areas with abnormal growth patterns"""
        # Low confidence predictions indicate potential anomalies
        low_confidence_mask = confidence_map < confidence_threshold
        
        # Areas significantly different from neighbors
        
        # Mode filter to identify isolated pixels
        mode_filtered = ndimage.generic_filter(stage_map, np.median, size=5)
        anomaly_mask = (stage_map != mode_filtered) | low_confidence_mask
        
        return anomaly_mask.astype(int)

def demo_growth_stage_classification():
    """Demonstration of growth stage classification"""
    
    # Initialize classifier
    classifier = PotatoGrowthStageClassifier()
    
    # Generate synthetic training data
    print("Generating synthetic training data...")
    X, y = classifier.generate_synthetic_training_data(n_samples_per_stage=800)
    
    # Train Random Forest model
    print("Training Random Forest classifier...")
    results = classifier.train_random_forest(X, y)
    
    print(f"Training Results:")
    for key, value in results.items():
        print(f"  {key}: {value}")
    
    # Generate test data
    print("\nGenerating test data...")
    X_test, y_test = classifier.generate_synthetic_training_data(n_samples_per_stage=100)
    
    # Make predictions
    print("Making predictions...")
    predictions = classifier.predict_growth_stage(X_test)
    
    # Calculate accuracy
    accuracy = np.mean(predictions['predictions'] == y_test)
    print(f"Test Accuracy: {accuracy:.3f}")
    
    # Show prediction distribution
    unique, counts = np.unique(predictions['predictions'], return_counts=True)
    print(f"\nPrediction Distribution:")
    for stage, count in zip(unique, counts):
        print(f"  {stage}: {count}")
    
    # Feature importance
    print(f"\nTop 10 Most Important Features:")
    top_features = classifier.feature_importance.head(10)
    for _, row in top_features.iterrows():
        print(f"  {row['feature']}: {row['importance']:.3f}")
    
    return classifier, X_test, y_test

if __name__ == "__main__":
    classifier, X_test, y_test = demo_growth_stage_classification()
