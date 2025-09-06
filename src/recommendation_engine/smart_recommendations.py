"""
AI-powered recommendation engine for potato crop management
Generates zone-wise, stage-specific irrigation and fertilizer recommendations
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import json
import logging
from dataclasses import dataclass, asdict
from enum import Enum

logger = logging.getLogger(__name__)

class GrowthStage(Enum):
    PLANTING = "Planting"
    EMERGENCE = "Emergence" 
    VEGETATIVE_GROWTH = "Vegetative_Growth"
    TUBER_INITIATION = "Tuber_Initiation"
    TUBER_BULKING = "Tuber_Bulking"
    MATURATION = "Maturation"

class RecommendationType(Enum):
    IRRIGATION = "irrigation"
    FERTILIZATION = "fertilization"
    PEST_MANAGEMENT = "pest_management"
    HARVESTING = "harvesting"

@dataclass
class RecommendationAction:
    """Single recommendation action"""
    action_type: RecommendationType
    priority: str  # "high", "medium", "low"
    description: str
    timing: str  # "immediate", "within_week", "within_month"
    zone_ids: List[int]
    application_rate: Optional[float] = None
    application_unit: Optional[str] = None
    estimated_cost: Optional[float] = None
    expected_benefit: Optional[str] = None

@dataclass
class ZoneRecommendation:
    """Recommendations for a specific management zone"""
    zone_id: int
    area_ha: float
    growth_stage: str
    health_status: str
    nutrient_status: Dict[str, str]
    stress_indicators: Dict[str, float]
    actions: List[RecommendationAction]
    estimated_yield_impact: float
    total_cost: float

@dataclass
class FieldRecommendation:
    """Complete field-level recommendations"""
    field_id: str
    analysis_date: datetime
    zones: List[ZoneRecommendation]
    summary: Dict[str, any]
    total_cost: float
    expected_roi: float

class CropManagementExpert:
    """Expert system for crop management recommendations"""
    
    def __init__(self):
        self.growth_stage_requirements = self._initialize_stage_requirements()
        self.nutrient_thresholds = self._initialize_nutrient_thresholds()
        self.irrigation_coefficients = self._initialize_irrigation_coefficients()
        self.fertilizer_prices = self._initialize_fertilizer_prices()
        
    def _initialize_stage_requirements(self) -> Dict:
        """Define crop requirements for each growth stage"""
        return {
            GrowthStage.PLANTING: {
                "water_requirement_mm": 20,
                "critical_nutrients": ["phosphorus"],
                "irrigation_frequency": "daily",
                "fertilizer_focus": "starter"
            },
            GrowthStage.EMERGENCE: {
                "water_requirement_mm": 25,
                "critical_nutrients": ["nitrogen", "phosphorus"],
                "irrigation_frequency": "every_2_days",
                "fertilizer_focus": "balanced"
            },
            GrowthStage.VEGETATIVE_GROWTH: {
                "water_requirement_mm": 35,
                "critical_nutrients": ["nitrogen"],
                "irrigation_frequency": "every_2_days",
                "fertilizer_focus": "nitrogen"
            },
            GrowthStage.TUBER_INITIATION: {
                "water_requirement_mm": 45,
                "critical_nutrients": ["potassium", "calcium"],
                "irrigation_frequency": "daily",
                "fertilizer_focus": "potassium"
            },
            GrowthStage.TUBER_BULKING: {
                "water_requirement_mm": 50,
                "critical_nutrients": ["potassium", "magnesium"],
                "irrigation_frequency": "daily",
                "fertilizer_focus": "potassium"
            },
            GrowthStage.MATURATION: {
                "water_requirement_mm": 15,
                "critical_nutrients": [],
                "irrigation_frequency": "reduce",
                "fertilizer_focus": "none"
            }
        }
    
    def _initialize_nutrient_thresholds(self) -> Dict:
        """Define nutrient deficiency and sufficiency thresholds"""
        return {
            "nitrogen": {
                "severe_deficiency": 25,
                "deficiency": 35,
                "sufficient": 45,
                "excess": 75
            },
            "phosphorus": {
                "severe_deficiency": 12,
                "deficiency": 18,
                "sufficient": 25,
                "excess": 40
            },
            "potassium": {
                "severe_deficiency": 120,
                "deficiency": 160,
                "sufficient": 200,
                "excess": 280
            },
            "magnesium": {
                "severe_deficiency": 40,
                "deficiency": 60,
                "sufficient": 80,
                "excess": 140
            },
            "calcium": {
                "severe_deficiency": 800,
                "deficiency": 1200,
                "sufficient": 1500,
                "excess": 2200
            }
        }
    
    def _initialize_irrigation_coefficients(self) -> Dict:
        """Define irrigation efficiency coefficients"""
        return {
            "base_evapotranspiration": 1.0,
            "growth_stage_multipliers": {
                GrowthStage.PLANTING: 0.6,
                GrowthStage.EMERGENCE: 0.8,
                GrowthStage.VEGETATIVE_GROWTH: 1.1,
                GrowthStage.TUBER_INITIATION: 1.3,
                GrowthStage.TUBER_BULKING: 1.4,
                GrowthStage.MATURATION: 0.5
            },
            "stress_multipliers": {
                "temperature_stress": 1.2,
                "humidity_stress": 1.1,
                "wind_stress": 1.05
            }
        }
    
    def _initialize_fertilizer_prices(self) -> Dict:
        """Initialize fertilizer prices (INR per kg)"""
        return {
            "nitrogen": 99.6,     # 1.20 USD * 83
            "phosphorus": 124.5,  # 1.50 USD * 83
            "potassium": 66.4,    # 0.80 USD * 83
            "magnesium": 166.0,   # 2.00 USD * 83
            "calcium": 24.9,      # 0.30 USD * 83
            "sulfur": 49.8        # 0.60 USD * 83
        }

class RecommendationEngine:
    """Main recommendation engine"""
    
    def __init__(self):
        self.expert = CropManagementExpert()
        self.recommendation_history = []
        
    def generate_field_recommendations(self, 
                                     field_data: Dict,
                                     zone_analysis: pd.DataFrame,
                                     weather_forecast: Dict,
                                     field_id: str) -> FieldRecommendation:
        """
        Generate comprehensive field recommendations
        """
        zone_recommendations = []
        total_cost = 0
        
        for _, zone_data in zone_analysis.iterrows():
            zone_rec = self._generate_zone_recommendations(
                zone_data, weather_forecast, field_data
            )
            zone_recommendations.append(zone_rec)
            total_cost += zone_rec.total_cost
        
        # Calculate overall field metrics
        summary = self._calculate_field_summary(zone_recommendations)
        expected_roi = self._estimate_roi(zone_recommendations, total_cost)
        
        field_recommendation = FieldRecommendation(
            field_id=field_id,
            analysis_date=datetime.now(),
            zones=zone_recommendations,
            summary=summary,
            total_cost=total_cost,
            expected_roi=expected_roi
        )
        
        self.recommendation_history.append(field_recommendation)
        return field_recommendation
    
    def _generate_zone_recommendations(self, 
                                     zone_data: pd.Series,
                                     weather_forecast: Dict,
                                     field_data: Dict) -> ZoneRecommendation:
        """
        Generate recommendations for a specific zone
        """
        zone_id = zone_data['zone_id']
        area_ha = zone_data.get('area_ha', 1.0)
        growth_stage = zone_data.get('growth_stage', 'Vegetative_Growth')
        
        # Assess zone health and nutrient status
        health_status = self._assess_zone_health(zone_data)
        nutrient_status = self._assess_nutrient_status(zone_data)
        stress_indicators = self._calculate_stress_indicators(zone_data, weather_forecast)
        
        # Generate specific recommendations
        actions = []
        
        # Irrigation recommendations
        irrigation_actions = self._generate_irrigation_recommendations(
            zone_data, growth_stage, weather_forecast, stress_indicators
        )
        actions.extend(irrigation_actions)
        
        # Fertilization recommendations
        fertilizer_actions = self._generate_fertilizer_recommendations(
            zone_data, growth_stage, nutrient_status
        )
        actions.extend(fertilizer_actions)
        
        # Pest and disease management
        pest_actions = self._generate_pest_management_recommendations(
            zone_data, growth_stage, weather_forecast
        )
        actions.extend(pest_actions)
        
        # Calculate costs and yield impact
        total_cost = sum(action.estimated_cost or 0 for action in actions)
        yield_impact = self._estimate_yield_impact(actions, zone_data)
        
        return ZoneRecommendation(
            zone_id=zone_id,
            area_ha=area_ha,
            growth_stage=growth_stage,
            health_status=health_status,
            nutrient_status=nutrient_status,
            stress_indicators=stress_indicators,
            actions=actions,
            estimated_yield_impact=yield_impact,
            total_cost=total_cost
        )
    
    def _assess_zone_health(self, zone_data: pd.Series) -> str:
        """Assess overall zone health status"""
        ndvi = zone_data.get('NDVI_mean', 0.5)
        ndre = zone_data.get('NDRE_mean', 0.3)
        
        if ndvi > 0.7 and ndre > 0.4:
            return "excellent"
        elif ndvi > 0.5 and ndre > 0.3:
            return "good"
        elif ndvi > 0.3 and ndre > 0.2:
            return "fair"
        else:
            return "poor"
    
    def _assess_nutrient_status(self, zone_data: pd.Series) -> Dict[str, str]:
        """Assess nutrient status for the zone"""
        nutrient_status = {}
        
        for nutrient in ['nitrogen', 'phosphorus', 'potassium']:
            level = zone_data.get(f'{nutrient}_level', 50)
            thresholds = self.expert.nutrient_thresholds[nutrient]
            
            if level < thresholds['severe_deficiency']:
                status = "severe_deficiency"
            elif level < thresholds['deficiency']:
                status = "deficiency"
            elif level < thresholds['sufficient']:
                status = "marginal"
            elif level > thresholds['excess']:
                status = "excess"
            else:
                status = "sufficient"
            
            nutrient_status[nutrient] = status
        
        return nutrient_status
    
    def _calculate_stress_indicators(self, 
                                   zone_data: pd.Series, 
                                   weather_forecast: Dict) -> Dict[str, float]:
        """Calculate various stress indicators"""
        stress_indicators = {}
        
        # Water stress
        soil_moisture = zone_data.get('soil_moisture', 25)
        precipitation = weather_forecast.get('precipitation_7day', 10)
        water_stress = max(0, (25 - soil_moisture) / 25) * max(0, (20 - precipitation) / 20)
        stress_indicators['water_stress'] = min(water_stress, 1.0)
        
        # Temperature stress
        max_temp = weather_forecast.get('max_temperature_7day', 25)
        temp_stress = max(0, (max_temp - 30) / 10) if max_temp > 30 else 0
        stress_indicators['temperature_stress'] = min(temp_stress, 1.0)
        
        # Nutrient stress
        nitrogen_level = zone_data.get('nitrogen_level', 50)
        nitrogen_threshold = self.expert.nutrient_thresholds['nitrogen']['sufficient']
        nutrient_stress = max(0, (nitrogen_threshold - nitrogen_level) / nitrogen_threshold)
        stress_indicators['nutrient_stress'] = min(nutrient_stress, 1.0)
        
        return stress_indicators
    
    def _generate_irrigation_recommendations(self, 
                                           zone_data: pd.Series,
                                           growth_stage: str,
                                           weather_forecast: Dict,
                                           stress_indicators: Dict) -> List[RecommendationAction]:
        """Generate irrigation recommendations"""
        actions = []
        
        # Get growth stage requirements
        try:
            stage_enum = GrowthStage(growth_stage)
            stage_req = self.expert.growth_stage_requirements[stage_enum]
        except ValueError:
            stage_enum = GrowthStage.VEGETATIVE_GROWTH
            stage_req = self.expert.growth_stage_requirements[stage_enum]
        
        # Calculate water requirement
        base_requirement = stage_req["water_requirement_mm"]
        stress_multiplier = 1 + stress_indicators.get('water_stress', 0) * 0.3
        precipitation = weather_forecast.get('precipitation_7day', 0)
        
        net_requirement = max(0, (base_requirement * stress_multiplier) - precipitation)
        
        if net_requirement > 5:  # Minimum threshold
            priority = "high" if stress_indicators.get('water_stress', 0) > 0.7 else "medium"
            timing = "immediate" if priority == "high" else "within_week"
            
            # Calculate cost (assuming irrigation cost of ₹830/ha/mm)
            cost_per_ha = net_requirement * 830
            
            action = RecommendationAction(
                action_type=RecommendationType.IRRIGATION,
                priority=priority,
                description=f"Apply {net_requirement:.1f}mm irrigation based on growth stage requirements and stress indicators",
                timing=timing,
                zone_ids=[zone_data['zone_id']],
                application_rate=net_requirement,
                application_unit="mm",
                estimated_cost=cost_per_ha * zone_data.get('area_ha', 1.0),
                expected_benefit=f"Reduce water stress, maintain optimal soil moisture for {growth_stage} stage"
            )
            actions.append(action)
        
        return actions
    
    def _generate_fertilizer_recommendations(self, 
                                           zone_data: pd.Series,
                                           growth_stage: str,
                                           nutrient_status: Dict[str, str]) -> List[RecommendationAction]:
        """Generate fertilizer recommendations"""
        actions = []
        
        # Get growth stage requirements
        try:
            stage_enum = GrowthStage(growth_stage)
            stage_req = self.expert.growth_stage_requirements[stage_enum]
        except ValueError:
            stage_enum = GrowthStage.VEGETATIVE_GROWTH
            stage_req = self.expert.growth_stage_requirements[stage_enum]
        
        critical_nutrients = stage_req["critical_nutrients"]
        
        for nutrient in nutrient_status:
            status = nutrient_status[nutrient]
            current_level = zone_data.get(f'{nutrient}_level', 50)
            
            if status in ['severe_deficiency', 'deficiency']:
                # Calculate fertilizer requirement
                target_level = self.expert.nutrient_thresholds[nutrient]['sufficient']
                deficit = target_level - current_level
                
                # Convert to fertilizer application rate (simplified)
                conversion_factors = {
                    'nitrogen': 2.5,    # kg/ha per ppm
                    'phosphorus': 4.0,
                    'potassium': 1.8,
                    'magnesium': 3.0,
                    'calcium': 1.0
                }
                
                application_rate = deficit * conversion_factors.get(nutrient, 2.0)
                
                # Determine priority based on deficiency severity and growth stage criticality
                if status == 'severe_deficiency' or nutrient in critical_nutrients:
                    priority = "high"
                    timing = "immediate"
                else:
                    priority = "medium"
                    timing = "within_week"
                
                # Calculate cost
                price_per_kg = self.expert.fertilizer_prices[nutrient]
                total_cost = application_rate * zone_data.get('area_ha', 1.0) * price_per_kg
                
                action = RecommendationAction(
                    action_type=RecommendationType.FERTILIZATION,
                    priority=priority,
                    description=f"Apply {nutrient} fertilizer to address {status} (current: {current_level:.1f} ppm, target: {target_level} ppm)",
                    timing=timing,
                    zone_ids=[zone_data['zone_id']],
                    application_rate=application_rate,
                    application_unit="kg/ha",
                    estimated_cost=total_cost,
                    expected_benefit=f"Increase {nutrient} levels to support {growth_stage} requirements"
                )
                actions.append(action)
        
        return actions
    
    def _generate_pest_management_recommendations(self, 
                                                zone_data: pd.Series,
                                                growth_stage: str,
                                                weather_forecast: Dict) -> List[RecommendationAction]:
        """Generate pest and disease management recommendations"""
        actions = []
        
        # Assess pest risk based on conditions
        humidity = weather_forecast.get('avg_humidity_7day', 65)
        temperature = weather_forecast.get('avg_temperature_7day', 20)
        
        # Late blight risk assessment
        if humidity > 80 and 15 < temperature < 25:
            action = RecommendationAction(
                action_type=RecommendationType.PEST_MANAGEMENT,
                priority="high",
                description="High late blight risk detected. Apply preventive fungicide treatment",
                timing="immediate",
                zone_ids=[zone_data['zone_id']],
                application_rate=2.5,
                application_unit="L/ha",
                estimated_cost=45.0 * zone_data.get('area_ha', 1.0),
                expected_benefit="Prevent late blight infection and potential yield loss"
            )
            actions.append(action)
        
        # Colorado potato beetle monitoring
        if growth_stage in ['Emergence', 'Vegetative_Growth'] and temperature > 15:
            action = RecommendationAction(
                action_type=RecommendationType.PEST_MANAGEMENT,
                priority="medium",
                description="Monitor for Colorado potato beetle and apply treatment if threshold exceeded",
                timing="within_week",
                zone_ids=[zone_data['zone_id']],
                estimated_cost=25.0 * zone_data.get('area_ha', 1.0),
                expected_benefit="Early detection and control of Colorado potato beetle"
            )
            actions.append(action)
        
        return actions
    
    def _estimate_yield_impact(self, 
                             actions: List[RecommendationAction],
                             zone_data: pd.Series) -> float:
        """Estimate yield impact of recommendations"""
        total_impact = 0
        
        for action in actions:
            if action.action_type == RecommendationType.IRRIGATION:
                # Irrigation can increase yield by 5-15%
                if action.priority == "high":
                    total_impact += 0.12
                else:
                    total_impact += 0.08
            
            elif action.action_type == RecommendationType.FERTILIZATION:
                # Fertilization impact depends on deficiency severity
                if "severe_deficiency" in action.description:
                    total_impact += 0.20
                elif "deficiency" in action.description:
                    total_impact += 0.10
                else:
                    total_impact += 0.05
            
            elif action.action_type == RecommendationType.PEST_MANAGEMENT:
                # Pest management prevents losses
                if action.priority == "high":
                    total_impact += 0.15  # Preventing major disease
                else:
                    total_impact += 0.05  # Monitoring/minor treatment
        
        return min(total_impact, 0.40)  # Cap at 40% improvement
    
    def _calculate_field_summary(self, zone_recommendations: List[ZoneRecommendation]) -> Dict:
        """Calculate field-level summary statistics"""
        total_area = sum(zone.area_ha for zone in zone_recommendations)
        total_zones = len(zone_recommendations)
        
        # Count zones by health status
        health_counts = {}
        for zone in zone_recommendations:
            health = zone.health_status
            health_counts[health] = health_counts.get(health, 0) + 1
        
        # Count high priority actions
        high_priority_actions = sum(
            len([a for a in zone.actions if a.priority == "high"])
            for zone in zone_recommendations
        )
        
        # Average yield impact
        avg_yield_impact = np.mean([zone.estimated_yield_impact for zone in zone_recommendations])
        
        return {
            "total_area_ha": total_area,
            "total_zones": total_zones,
            "health_distribution": health_counts,
            "high_priority_actions": high_priority_actions,
            "average_yield_impact": avg_yield_impact,
            "zones_needing_attention": len([z for z in zone_recommendations if z.health_status in ['poor', 'fair']])
        }
    
    def _estimate_roi(self, zone_recommendations: List[ZoneRecommendation], total_cost: float) -> float:
        """Estimate return on investment for recommendations"""
        if total_cost == 0:
            return 0
        
        # Estimate total value from yield improvements
        total_area = sum(zone.area_ha for zone in zone_recommendations)
        avg_yield_impact = np.mean([zone.estimated_yield_impact for zone in zone_recommendations])
        
        # Assume base yield of 25 tonnes/ha and price of $300/tonne
        base_yield_value = total_area * 25 * 300
        yield_improvement_value = base_yield_value * avg_yield_impact
        
        roi = ((yield_improvement_value - total_cost) / total_cost) * 100
        return max(roi, 0)  # Don't show negative ROI
    
    def generate_action_schedule(self, 
                               field_recommendation: FieldRecommendation,
                               days_ahead: int = 30) -> pd.DataFrame:
        """Generate a schedule of actions for the next period"""
        schedule_data = []
        base_date = datetime.now()
        
        for zone in field_recommendation.zones:
            for action in zone.actions:
                # Determine specific date based on timing
                if action.timing == "immediate":
                    action_date = base_date
                elif action.timing == "within_week":
                    action_date = base_date + timedelta(days=np.random.randint(1, 8))
                elif action.timing == "within_month":
                    action_date = base_date + timedelta(days=np.random.randint(7, 31))
                else:
                    action_date = base_date + timedelta(days=7)
                
                if action_date <= base_date + timedelta(days=days_ahead):
                    schedule_data.append({
                        'date': action_date,
                        'zone_id': zone.zone_id,
                        'action_type': action.action_type.value,
                        'priority': action.priority,
                        'description': action.description,
                        'application_rate': action.application_rate,
                        'application_unit': action.application_unit,
                        'estimated_cost': action.estimated_cost,
                        'area_ha': zone.area_ha
                    })
        
        schedule_df = pd.DataFrame(schedule_data)
        if not schedule_df.empty:
            schedule_df = schedule_df.sort_values(['date', 'priority'])
        
        return schedule_df
    
    def export_recommendations(self, 
                             field_recommendation: FieldRecommendation,
                             format: str = 'json') -> str:
        """Export recommendations in specified format"""
        if format == 'json':
            # Convert to JSON-serializable format
            export_data = {
                'field_id': field_recommendation.field_id,
                'analysis_date': field_recommendation.analysis_date.isoformat(),
                'summary': field_recommendation.summary,
                'total_cost': field_recommendation.total_cost,
                'expected_roi': field_recommendation.expected_roi,
                'zones': []
            }
            
            for zone in field_recommendation.zones:
                zone_data = {
                    'zone_id': zone.zone_id,
                    'area_ha': zone.area_ha,
                    'growth_stage': zone.growth_stage,
                    'health_status': zone.health_status,
                    'nutrient_status': zone.nutrient_status,
                    'stress_indicators': zone.stress_indicators,
                    'estimated_yield_impact': zone.estimated_yield_impact,
                    'total_cost': zone.total_cost,
                    'actions': []
                }
                
                for action in zone.actions:
                    action_data = {
                        'action_type': action.action_type.value,
                        'priority': action.priority,
                        'description': action.description,
                        'timing': action.timing,
                        'application_rate': action.application_rate,
                        'application_unit': action.application_unit,
                        'estimated_cost': action.estimated_cost,
                        'expected_benefit': action.expected_benefit
                    }
                    zone_data['actions'].append(action_data)
                
                export_data['zones'].append(zone_data)
            
            return json.dumps(export_data, indent=2)
        
        else:
            raise ValueError(f"Unsupported export format: {format}")

def demo_recommendation_engine():
    """Demonstration of the recommendation engine"""
    
    # Initialize engine
    engine = RecommendationEngine()
    
    # Create sample zone analysis data
    zone_analysis = pd.DataFrame({
        'zone_id': [1, 2, 3, 4, 5],
        'area_ha': [2.5, 3.0, 1.8, 2.2, 2.8],
        'growth_stage': ['Vegetative_Growth', 'Tuber_Initiation', 'Vegetative_Growth', 'Tuber_Bulking', 'Emergence'],
        'NDVI_mean': [0.65, 0.75, 0.45, 0.80, 0.35],
        'NDRE_mean': [0.40, 0.50, 0.25, 0.55, 0.20],
        'nitrogen_level': [35, 55, 25, 60, 30],
        'phosphorus_level': [22, 28, 15, 30, 18],
        'potassium_level': [180, 210, 140, 220, 160],
        'soil_moisture': [22, 28, 18, 30, 20]
    })
    
    # Sample weather forecast
    weather_forecast = {
        'precipitation_7day': 15,
        'max_temperature_7day': 28,
        'avg_temperature_7day': 22,
        'avg_humidity_7day': 75
    }
    
    # Sample field data
    field_data = {
        'field_size_ha': 12.3,
        'soil_type': 'loam',
        'irrigation_system': 'sprinkler'
    }
    
    # Generate recommendations
    print("Generating field recommendations...")
    recommendations = engine.generate_field_recommendations(
        field_data=field_data,
        zone_analysis=zone_analysis,
        weather_forecast=weather_forecast,
        field_id="DEMO_FIELD_001"
    )
    
    # Display results
    print(f"\n=== FIELD RECOMMENDATIONS ===")
    print(f"Field ID: {recommendations.field_id}")
    print(f"Analysis Date: {recommendations.analysis_date}")
    print(f"Total Cost: ${recommendations.total_cost:.2f}")
    print(f"Expected ROI: {recommendations.expected_roi:.1f}%")
    
    print(f"\n=== FIELD SUMMARY ===")
    summary = recommendations.summary
    print(f"Total Area: {summary['total_area_ha']:.1f} ha")
    print(f"Total Zones: {summary['total_zones']}")
    print(f"Health Distribution: {summary['health_distribution']}")
    print(f"High Priority Actions: {summary['high_priority_actions']}")
    print(f"Average Yield Impact: {summary['average_yield_impact']:.1%}")
    
    print(f"\n=== ZONE RECOMMENDATIONS ===")
    for zone in recommendations.zones:
        print(f"\nZone {zone.zone_id} ({zone.area_ha:.1f} ha)")
        print(f"  Growth Stage: {zone.growth_stage}")
        print(f"  Health Status: {zone.health_status}")
        print(f"  Nutrient Status: {zone.nutrient_status}")
        print(f"  Stress Indicators: {zone.stress_indicators}")
        print(f"  Actions ({len(zone.actions)}):")
        
        for action in zone.actions:
            print(f"    - {action.action_type.value.title()} ({action.priority} priority)")
            print(f"      {action.description}")
            if action.application_rate:
                print(f"      Rate: {action.application_rate} {action.application_unit}")
            print(f"      Cost: ${action.estimated_cost:.2f}")
            print(f"      Timing: {action.timing}")
        
        print(f"  Zone Cost: ${zone.total_cost:.2f}")
        print(f"  Yield Impact: {zone.estimated_yield_impact:.1%}")
    
    # Generate action schedule
    print(f"\n=== ACTION SCHEDULE (Next 30 days) ===")
    schedule = engine.generate_action_schedule(recommendations, days_ahead=30)
    
    if not schedule.empty:
        for _, action in schedule.head(10).iterrows():  # Show first 10 actions
            print(f"{action['date'].strftime('%Y-%m-%d')} - Zone {action['zone_id']}: {action['description'][:60]}...")
    else:
        print("No scheduled actions in the next 30 days")
    
    return engine, recommendations

if __name__ == "__main__":
    engine, recommendations = demo_recommendation_engine()
