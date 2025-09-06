"""
Farmer Task Management System - To-Do List with Alerts and Recommendations
Automatically generates tasks based on field conditions and AI recommendations
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from enum import Enum
from dataclasses import dataclass, asdict
import sqlite3
import logging

logger = logging.getLogger(__name__)

class TaskPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class TaskCategory(Enum):
    IRRIGATION = "irrigation"
    FERTILIZATION = "fertilization"
    PEST_CONTROL = "pest_control"
    HARVESTING = "harvesting"
    PLANTING = "planting"
    MONITORING = "monitoring"
    EQUIPMENT = "equipment"
    WEATHER_ALERT = "weather_alert"
    MARKET = "market"
    COMPLIANCE = "compliance"

@dataclass
class FarmerTask:
    """Individual farmer task with all necessary details"""
    id: str
    title: str
    description: str
    category: TaskCategory
    priority: TaskPriority
    status: TaskStatus
    field_id: str
    created_at: datetime
    due_date: datetime
    estimated_duration: int  # minutes
    cost_estimate: float
    auto_generated: bool
    ai_confidence: float
    completion_notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    reminder_sent: bool = False
    
    # Location and area details
    zone_id: Optional[str] = None
    area_hectares: Optional[float] = None
    coordinates: Optional[Dict] = None
    
    # Resource requirements
    equipment_needed: List[str] = None
    materials_needed: List[str] = None
    labor_hours: Optional[float] = None
    
    # AI recommendations
    weather_dependent: bool = False
    optimal_conditions: Optional[Dict] = None
    risk_factors: List[str] = None
    
    # Dependencies
    depends_on: List[str] = None  # Task IDs this task depends on
    blocks: List[str] = None     # Task IDs this task blocks
    
    def __post_init__(self):
        if self.equipment_needed is None:
            self.equipment_needed = []
        if self.materials_needed is None:
            self.materials_needed = []
        if self.risk_factors is None:
            self.risk_factors = []
        if self.depends_on is None:
            self.depends_on = []
        if self.blocks is None:
            self.blocks = []

class FarmerTaskManager:
    """Comprehensive task management system for farmers"""
    
    def __init__(self, db_path: str = "farmer_tasks.db"):
        self.db_path = db_path
        self.init_database()
        
    def init_database(self):
        """Initialize SQLite database for task storage"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS farmer_tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            priority TEXT NOT NULL,
            status TEXT NOT NULL,
            field_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            due_date TEXT NOT NULL,
            estimated_duration INTEGER,
            cost_estimate REAL,
            auto_generated BOOLEAN,
            ai_confidence REAL,
            completion_notes TEXT,
            completed_at TEXT,
            reminder_sent BOOLEAN DEFAULT FALSE,
            zone_id TEXT,
            area_hectares REAL,
            coordinates TEXT,
            equipment_needed TEXT,
            materials_needed TEXT,
            labor_hours REAL,
            weather_dependent BOOLEAN DEFAULT FALSE,
            optimal_conditions TEXT,
            risk_factors TEXT,
            depends_on TEXT,
            blocks TEXT
        )
        ''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS task_history (
            id TEXT PRIMARY KEY,
            task_id TEXT,
            action TEXT,
            timestamp TEXT,
            details TEXT,
            FOREIGN KEY (task_id) REFERENCES farmer_tasks (id)
        )
        ''')
        
        conn.commit()
        conn.close()
    
    def create_task(self, task: FarmerTask) -> str:
        """Create a new farmer task"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT INTO farmer_tasks VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        ''', (
            task.id, task.title, task.description, task.category.value,
            task.priority.value, task.status.value, task.field_id,
            task.created_at.isoformat(), task.due_date.isoformat(),
            task.estimated_duration, task.cost_estimate, task.auto_generated,
            task.ai_confidence, task.completion_notes,
            task.completed_at.isoformat() if task.completed_at else None,
            task.reminder_sent, task.zone_id, task.area_hectares,
            json.dumps(task.coordinates) if task.coordinates else None,
            json.dumps(task.equipment_needed), json.dumps(task.materials_needed),
            task.labor_hours, task.weather_dependent,
            json.dumps(task.optimal_conditions) if task.optimal_conditions else None,
            json.dumps(task.risk_factors), json.dumps(task.depends_on),
            json.dumps(task.blocks)
        ))
        
        # Log task creation
        self._log_task_action(task.id, "created", {"auto_generated": task.auto_generated})
        
        conn.commit()
        conn.close()
        
        logger.info(f"Created task: {task.title} for field {task.field_id}")
        return task.id
    
    def get_tasks_for_farmer(self, field_ids: List[str], 
                           status_filter: Optional[List[TaskStatus]] = None,
                           category_filter: Optional[List[TaskCategory]] = None,
                           priority_filter: Optional[List[TaskPriority]] = None) -> List[FarmerTask]:
        """Get tasks for specific fields with optional filters"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = "SELECT * FROM farmer_tasks WHERE field_id IN ({})".format(
            ','.join(['?' for _ in field_ids])
        )
        params = field_ids.copy()
        
        # Add filters
        if status_filter:
            query += " AND status IN ({})".format(','.join(['?' for _ in status_filter]))
            params.extend([s.value for s in status_filter])
        
        if category_filter:
            query += " AND category IN ({})".format(','.join(['?' for _ in category_filter]))
            params.extend([c.value for c in category_filter])
        
        if priority_filter:
            query += " AND priority IN ({})".format(','.join(['?' for _ in priority_filter]))
            params.extend([p.value for p in priority_filter])
        
        query += " ORDER BY due_date ASC, priority DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        return [self._row_to_task(row) for row in rows]
    
    def update_task_status(self, task_id: str, new_status: TaskStatus, 
                          completion_notes: Optional[str] = None) -> bool:
        """Update task status"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        update_fields = ["status = ?"]
        params = [new_status.value]
        
        if new_status == TaskStatus.COMPLETED:
            update_fields.append("completed_at = ?")
            params.append(datetime.now().isoformat())
        
        if completion_notes:
            update_fields.append("completion_notes = ?")
            params.append(completion_notes)
        
        params.append(task_id)
        
        cursor.execute(f'''
        UPDATE farmer_tasks 
        SET {', '.join(update_fields)}
        WHERE id = ?
        ''', params)
        
        # Log status change
        self._log_task_action(task_id, "status_changed", {
            "new_status": new_status.value,
            "notes": completion_notes
        })
        
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return success
    
    def get_overdue_tasks(self, field_ids: List[str]) -> List[FarmerTask]:
        """Get overdue tasks for fields"""
        tasks = self.get_tasks_for_farmer(
            field_ids, 
            status_filter=[TaskStatus.PENDING, TaskStatus.IN_PROGRESS]
        )
        
        current_time = datetime.now()
        overdue_tasks = []
        
        for task in tasks:
            if task.due_date < current_time:
                # Update status to overdue
                self.update_task_status(task.id, TaskStatus.OVERDUE)
                task.status = TaskStatus.OVERDUE
                overdue_tasks.append(task)
        
        return overdue_tasks
    
    def get_upcoming_tasks(self, field_ids: List[str], days_ahead: int = 7) -> List[FarmerTask]:
        """Get tasks due within specified days"""
        tasks = self.get_tasks_for_farmer(
            field_ids,
            status_filter=[TaskStatus.PENDING, TaskStatus.IN_PROGRESS]
        )
        
        cutoff_date = datetime.now() + timedelta(days=days_ahead)
        upcoming_tasks = [task for task in tasks if task.due_date <= cutoff_date]
        
        return sorted(upcoming_tasks, key=lambda t: (t.due_date, t.priority.value))
    
    def generate_ai_tasks_from_recommendations(self, field_id: str, 
                                              recommendations: Dict) -> List[str]:
        """Generate tasks from AI recommendations"""
        created_task_ids = []
        
        if 'zones' not in recommendations:
            return created_task_ids
        
        for zone in recommendations['zones']:
            zone_id = zone['zone_id']
            
            for action in zone.get('actions', []):
                task = self._create_task_from_action(field_id, zone_id, zone, action)
                task_id = self.create_task(task)
                created_task_ids.append(task_id)
        
        return created_task_ids
    
    def generate_weather_alerts(self, field_id: str, weather_forecast: Dict) -> List[str]:
        """Generate weather-based alert tasks"""
        created_task_ids = []
        
        # High wind alert
        if weather_forecast.get('wind_speed', 0) > 40:  # km/h
            task = FarmerTask(
                id=str(uuid.uuid4()),
                title="🌪️ High Wind Alert",
                description=f"High winds expected ({weather_forecast['wind_speed']} km/h). Secure equipment and check irrigation systems.",
                category=TaskCategory.WEATHER_ALERT,
                priority=TaskPriority.HIGH,
                status=TaskStatus.PENDING,
                field_id=field_id,
                created_at=datetime.now(),
                due_date=datetime.now() + timedelta(hours=6),
                estimated_duration=30,
                cost_estimate=0.0,
                auto_generated=True,
                ai_confidence=0.95,
                weather_dependent=True,
                risk_factors=["equipment_damage", "irrigation_disruption"]
            )
            created_task_ids.append(self.create_task(task))
        
        # Frost alert
        if weather_forecast.get('min_temperature', 10) < 2:
            task = FarmerTask(
                id=str(uuid.uuid4()),
                title="🧊 Frost Warning",
                description=f"Frost risk with temperature dropping to {weather_forecast['min_temperature']}°C. Protect vulnerable crops.",
                category=TaskCategory.WEATHER_ALERT,
                priority=TaskPriority.URGENT,
                status=TaskStatus.PENDING,
                field_id=field_id,
                created_at=datetime.now(),
                due_date=datetime.now() + timedelta(hours=12),
                estimated_duration=60,
                cost_estimate=500.0,
                auto_generated=True,
                ai_confidence=0.98,
                weather_dependent=True,
                equipment_needed=["frost_protection_covers", "irrigation_system"],
                risk_factors=["crop_damage", "yield_loss"]
            )
            created_task_ids.append(self.create_task(task))
        
        # Heavy rain alert
        if weather_forecast.get('precipitation', 0) > 50:  # mm
            task = FarmerTask(
                id=str(uuid.uuid4()),
                title="🌧️ Heavy Rain Alert",
                description=f"Heavy rainfall expected ({weather_forecast['precipitation']}mm). Check drainage and postpone field operations.",
                category=TaskCategory.WEATHER_ALERT,
                priority=TaskPriority.MEDIUM,
                status=TaskStatus.PENDING,
                field_id=field_id,
                created_at=datetime.now(),
                due_date=datetime.now() + timedelta(hours=8),
                estimated_duration=45,
                cost_estimate=0.0,
                auto_generated=True,
                ai_confidence=0.90,
                weather_dependent=True,
                risk_factors=["waterlogging", "soil_compaction"]
            )
            created_task_ids.append(self.create_task(task))
        
        return created_task_ids
    
    def generate_growth_stage_tasks(self, field_id: str, growth_stage: str, 
                                   field_health: float) -> List[str]:
        """Generate tasks based on crop growth stage"""
        created_task_ids = []
        
        stage_tasks = {
            'Emergence': [
                {
                    'title': '🌱 Monitor Emergence Rate',
                    'description': 'Check plant emergence percentage and identify any gaps in planting.',
                    'category': TaskCategory.MONITORING,
                    'priority': TaskPriority.MEDIUM,
                    'duration': 60,
                    'cost': 0.0
                }
            ],
            'Vegetative_Growth': [
                {
                    'title': '💧 Optimize Irrigation Schedule',
                    'description': 'Adjust irrigation frequency for optimal vegetative growth.',
                    'category': TaskCategory.IRRIGATION,
                    'priority': TaskPriority.HIGH,
                    'duration': 90,
                    'cost': 200.0
                },
                {
                    'title': '🌿 Apply Nitrogen Fertilizer',
                    'description': 'Apply nitrogen fertilizer to support leaf and stem growth.',
                    'category': TaskCategory.FERTILIZATION,
                    'priority': TaskPriority.HIGH,
                    'duration': 120,
                    'cost': 800.0
                }
            ],
            'Tuber_Initiation': [
                {
                    'title': '🥔 Reduce Nitrogen, Increase Potassium',
                    'description': 'Adjust fertilizer ratio to promote tuber development.',
                    'category': TaskCategory.FERTILIZATION,
                    'priority': TaskPriority.HIGH,
                    'duration': 90,
                    'cost': 600.0
                }
            ],
            'Tuber_Bulking': [
                {
                    'title': '💧 Maintain Consistent Moisture',
                    'description': 'Ensure consistent soil moisture for optimal tuber sizing.',
                    'category': TaskCategory.IRRIGATION,
                    'priority': TaskPriority.URGENT,
                    'duration': 45,
                    'cost': 150.0
                }
            ],
            'Maturation': [
                {
                    'title': '📋 Plan Harvest Schedule',
                    'description': 'Prepare harvest plan and check equipment readiness.',
                    'category': TaskCategory.HARVESTING,
                    'priority': TaskPriority.HIGH,
                    'duration': 120,
                    'cost': 0.0
                }
            ]
        }
        
        if growth_stage in stage_tasks:
            for task_data in stage_tasks[growth_stage]:
                # Adjust priority based on field health
                priority = task_data['priority']
                if field_health < 70:
                    if priority == TaskPriority.MEDIUM:
                        priority = TaskPriority.HIGH
                    elif priority == TaskPriority.HIGH:
                        priority = TaskPriority.URGENT
                
                task = FarmerTask(
                    id=str(uuid.uuid4()),
                    title=task_data['title'],
                    description=task_data['description'],
                    category=task_data['category'],
                    priority=priority,
                    status=TaskStatus.PENDING,
                    field_id=field_id,
                    created_at=datetime.now(),
                    due_date=datetime.now() + timedelta(days=2),
                    estimated_duration=task_data['duration'],
                    cost_estimate=task_data['cost'],
                    auto_generated=True,
                    ai_confidence=0.85
                )
                
                created_task_ids.append(self.create_task(task))
        
        return created_task_ids
    
    def get_task_summary(self, field_ids: List[str]) -> Dict:
        """Get summary of tasks for dashboard"""
        all_tasks = self.get_tasks_for_farmer(field_ids)
        overdue_tasks = self.get_overdue_tasks(field_ids)
        upcoming_tasks = self.get_upcoming_tasks(field_ids, days_ahead=3)
        
        summary = {
            'total_tasks': len(all_tasks),
            'pending': len([t for t in all_tasks if t.status == TaskStatus.PENDING]),
            'in_progress': len([t for t in all_tasks if t.status == TaskStatus.IN_PROGRESS]),
            'completed': len([t for t in all_tasks if t.status == TaskStatus.COMPLETED]),
            'overdue': len(overdue_tasks),
            'upcoming_3_days': len(upcoming_tasks),
            'urgent_tasks': len([t for t in all_tasks if t.priority == TaskPriority.URGENT and t.status in [TaskStatus.PENDING, TaskStatus.IN_PROGRESS]]),
            'auto_generated': len([t for t in all_tasks if t.auto_generated]),
            'total_estimated_cost': sum(t.cost_estimate for t in all_tasks if t.status != TaskStatus.COMPLETED),
            'categories': self._get_category_breakdown(all_tasks)
        }
        
        return summary
    
    def _create_task_from_action(self, field_id: str, zone_id: str, 
                                zone_data: Dict, action: Dict) -> FarmerTask:
        """Create task from AI recommendation action"""
        category_mapping = {
            'irrigation': TaskCategory.IRRIGATION,
            'fertilization': TaskCategory.FERTILIZATION,
            'pest_control': TaskCategory.PEST_CONTROL,
            'monitoring': TaskCategory.MONITORING
        }
        
        priority_mapping = {
            'low': TaskPriority.LOW,
            'medium': TaskPriority.MEDIUM,
            'high': TaskPriority.HIGH,
            'urgent': TaskPriority.URGENT
        }
        
        # Calculate due date based on timing
        timing_days = {
            'immediate': 1,
            'within_week': 3,
            'within_month': 14
        }
        
        days_ahead = timing_days.get(action.get('timing', 'within_week'), 3)
        
        return FarmerTask(
            id=str(uuid.uuid4()),
            title=f"🤖 {action.get('description', 'AI Recommendation')}",
            description=f"AI-generated task for Zone {zone_id}: {action.get('description', '')}",
            category=category_mapping.get(action.get('type', 'monitoring'), TaskCategory.MONITORING),
            priority=priority_mapping.get(action.get('priority', 'medium'), TaskPriority.MEDIUM),
            status=TaskStatus.PENDING,
            field_id=field_id,
            zone_id=zone_id,
            area_hectares=zone_data.get('area_ha', 0),
            created_at=datetime.now(),
            due_date=datetime.now() + timedelta(days=days_ahead),
            estimated_duration=90,
            cost_estimate=action.get('cost', 0.0),
            auto_generated=True,
            ai_confidence=0.88,
            equipment_needed=self._extract_equipment_from_action(action),
            materials_needed=self._extract_materials_from_action(action)
        )
    
    def _extract_equipment_from_action(self, action: Dict) -> List[str]:
        """Extract equipment needs from action"""
        action_type = action.get('type', '')
        equipment_map = {
            'irrigation': ['irrigation_system', 'water_pump'],
            'fertilization': ['spreader', 'tractor'],
            'pest_control': ['sprayer', 'protective_equipment']
        }
        return equipment_map.get(action_type, [])
    
    def _extract_materials_from_action(self, action: Dict) -> List[str]:
        """Extract material needs from action"""
        action_type = action.get('type', '')
        rate = action.get('rate', '')
        
        materials = []
        if 'fertilizer' in action_type or 'nitrogen' in rate.lower():
            materials.append('nitrogen_fertilizer')
        if 'pesticide' in action_type or 'spray' in rate.lower():
            materials.append('pesticide')
        
        return materials
    
    def _get_category_breakdown(self, tasks: List[FarmerTask]) -> Dict:
        """Get breakdown of tasks by category"""
        categories = {}
        for task in tasks:
            category = task.category.value
            if category not in categories:
                categories[category] = {'count': 0, 'pending': 0, 'completed': 0}
            
            categories[category]['count'] += 1
            if task.status == TaskStatus.PENDING:
                categories[category]['pending'] += 1
            elif task.status == TaskStatus.COMPLETED:
                categories[category]['completed'] += 1
        
        return categories
    
    def _log_task_action(self, task_id: str, action: str, details: Dict):
        """Log task action to history"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT INTO task_history (id, task_id, action, timestamp, details)
        VALUES (?, ?, ?, ?, ?)
        ''', (
            str(uuid.uuid4()),
            task_id,
            action,
            datetime.now().isoformat(),
            json.dumps(details)
        ))
        
        conn.commit()
        conn.close()
    
    def _row_to_task(self, row) -> FarmerTask:
        """Convert database row to FarmerTask object"""
        return FarmerTask(
            id=row[0],
            title=row[1],
            description=row[2],
            category=TaskCategory(row[3]),
            priority=TaskPriority(row[4]),
            status=TaskStatus(row[5]),
            field_id=row[6],
            created_at=datetime.fromisoformat(row[7]),
            due_date=datetime.fromisoformat(row[8]),
            estimated_duration=row[9],
            cost_estimate=row[10],
            auto_generated=row[11],
            ai_confidence=row[12],
            completion_notes=row[13],
            completed_at=datetime.fromisoformat(row[14]) if row[14] else None,
            reminder_sent=row[15],
            zone_id=row[16],
            area_hectares=row[17],
            coordinates=json.loads(row[18]) if row[18] else None,
            equipment_needed=json.loads(row[19]) if row[19] else [],
            materials_needed=json.loads(row[20]) if row[20] else [],
            labor_hours=row[21],
            weather_dependent=row[22],
            optimal_conditions=json.loads(row[23]) if row[23] else None,
            risk_factors=json.loads(row[24]) if row[24] else [],
            depends_on=json.loads(row[25]) if row[25] else [],
            blocks=json.loads(row[26]) if row[26] else []
        )

# Demo usage
def demo_farmer_task_system():
    """Demonstrate the farmer task management system"""
    task_manager = FarmerTaskManager()
    
    # Example: Generate tasks from AI recommendations
    mock_recommendations = {
        'zones': [
            {
                'zone_id': 1,
                'area_ha': 2.5,
                'growth_stage': 'Vegetative_Growth',
                'actions': [
                    {
                        'type': 'irrigation',
                        'priority': 'high',
                        'description': 'Increase irrigation frequency',
                        'timing': 'immediate',
                        'cost': 200.0,
                        'rate': '25mm daily'
                    },
                    {
                        'type': 'fertilization',
                        'priority': 'medium',
                        'description': 'Apply nitrogen fertilizer',
                        'timing': 'within_week',
                        'cost': 400.0,
                        'rate': '50kg/ha'
                    }
                ]
            }
        ]
    }
    
    # Generate AI tasks
    field_id = "field_001"
    task_ids = task_manager.generate_ai_tasks_from_recommendations(field_id, mock_recommendations)
    
    # Generate weather alerts
    weather_forecast = {
        'wind_speed': 45,
        'min_temperature': 1,
        'precipitation': 60
    }
    
    weather_task_ids = task_manager.generate_weather_alerts(field_id, weather_forecast)
    
    # Generate growth stage tasks
    growth_task_ids = task_manager.generate_growth_stage_tasks(field_id, 'Vegetative_Growth', 65)
    
    # Get task summary
    summary = task_manager.get_task_summary([field_id])
    
    print("Farmer Task Management Demo:")
    print(f"Created {len(task_ids)} AI recommendation tasks")
    print(f"Created {len(weather_task_ids)} weather alert tasks")
    print(f"Created {len(growth_task_ids)} growth stage tasks")
    print(f"Task Summary: {summary}")
    
    # Get upcoming tasks
    upcoming = task_manager.get_upcoming_tasks([field_id], days_ahead=7)
    print(f"\nUpcoming tasks ({len(upcoming)}):")
    for task in upcoming[:5]:  # Show first 5
        print(f"- {task.title} (Due: {task.due_date.strftime('%Y-%m-%d %H:%M')})")

if __name__ == "__main__":
    demo_farmer_task_system()
