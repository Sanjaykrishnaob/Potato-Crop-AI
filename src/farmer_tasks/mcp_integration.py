"""
MCP Integration for Farmer Task Management
Extends MCP server with task management and alert capabilities
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List

# Add to existing MCP server
def register_task_management_tools(mcp_server):
    """Register task management tools with MCP server"""
    
    @mcp_server.server.call_tool()
    async def create_farmer_task(field_id: str, title: str, description: str, 
                                category: str, priority: str, due_hours: int = 24) -> List:
        """
        Create a new farmer task
        
        Args:
            field_id: Field identifier
            title: Task title
            description: Task description
            category: Task category (irrigation, fertilization, etc.)
            priority: Task priority (low, medium, high, urgent)
            due_hours: Hours from now when task is due
        """
        try:
            from src.farmer_tasks.task_manager import FarmerTaskManager, FarmerTask, TaskCategory, TaskPriority, TaskStatus
            import uuid
            
            task_manager = FarmerTaskManager()
            
            task = FarmerTask(
                id=str(uuid.uuid4()),
                title=title,
                description=description,
                category=TaskCategory(category),
                priority=TaskPriority(priority),
                status=TaskStatus.PENDING,
                field_id=field_id,
                created_at=datetime.now(),
                due_date=datetime.now() + timedelta(hours=due_hours),
                estimated_duration=60,
                cost_estimate=0.0,
                auto_generated=False,
                ai_confidence=0.0
            )
            
            task_id = task_manager.create_task(task)
            
            result = {
                'task_id': task_id,
                'status': 'created',
                'due_date': task.due_date.isoformat(),
                'message': f'Task "{title}" created successfully'
            }
            
            return [{"type": "text", "text": json.dumps(result, indent=2)}]
            
        except Exception as e:
            return [{"type": "text", "text": f"Error creating task: {str(e)}"}]
    
    @mcp_server.server.call_tool()
    async def get_farmer_tasks(field_id: str, status_filter: str = "active") -> List:
        """
        Get farmer tasks for a field
        
        Args:
            field_id: Field identifier
            status_filter: Filter by status (active, completed, overdue, all)
        """
        try:
            from src.farmer_tasks.task_manager import FarmerTaskManager, TaskStatus
            
            task_manager = FarmerTaskManager()
            
            # Set up status filter
            status_filters = {
                'active': [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
                'completed': [TaskStatus.COMPLETED],
                'overdue': [TaskStatus.OVERDUE],
                'all': None
            }
            
            tasks = task_manager.get_tasks_for_farmer(
                [field_id],
                status_filter=status_filters.get(status_filter)
            )
            
            # Convert tasks to serializable format
            task_list = []
            for task in tasks:
                task_dict = {
                    'id': task.id,
                    'title': task.title,
                    'description': task.description,
                    'category': task.category.value,
                    'priority': task.priority.value,
                    'status': task.status.value,
                    'due_date': task.due_date.isoformat(),
                    'estimated_duration': task.estimated_duration,
                    'cost_estimate': task.cost_estimate,
                    'auto_generated': task.auto_generated,
                    'zone_id': task.zone_id,
                    'area_hectares': task.area_hectares
                }
                task_list.append(task_dict)
            
            result = {
                'field_id': field_id,
                'total_tasks': len(task_list),
                'status_filter': status_filter,
                'tasks': task_list
            }
            
            return [{"type": "text", "text": json.dumps(result, indent=2)}]
            
        except Exception as e:
            return [{"type": "text", "text": f"Error getting tasks: {str(e)}"}]
    
    @mcp_server.server.call_tool()
    async def update_task_status(task_id: str, new_status: str, notes: str = "") -> List:
        """
        Update task status
        
        Args:
            task_id: Task identifier
            new_status: New status (pending, in_progress, completed, cancelled)
            notes: Optional completion notes
        """
        try:
            from src.farmer_tasks.task_manager import FarmerTaskManager, TaskStatus
            
            task_manager = FarmerTaskManager()
            
            success = task_manager.update_task_status(
                task_id,
                TaskStatus(new_status),
                notes if notes else None
            )
            
            result = {
                'task_id': task_id,
                'new_status': new_status,
                'success': success,
                'notes': notes,
                'updated_at': datetime.now().isoformat()
            }
            
            return [{"type": "text", "text": json.dumps(result, indent=2)}]
            
        except Exception as e:
            return [{"type": "text", "text": f"Error updating task: {str(e)}"}]
    
    @mcp_server.server.call_tool()
    async def generate_ai_tasks(field_id: str, growth_stage: str, field_health: float) -> List:
        """
        Generate AI-powered tasks based on field conditions
        
        Args:
            field_id: Field identifier
            growth_stage: Current growth stage
            field_health: Field health percentage (0-100)
        """
        try:
            from src.farmer_tasks.task_manager import FarmerTaskManager
            
            task_manager = FarmerTaskManager()
            
            # Generate growth stage tasks
            task_ids = task_manager.generate_growth_stage_tasks(field_id, growth_stage, field_health)
            
            # Generate weather alerts (mock weather)
            weather_forecast = {
                'temperature': 25,
                'precipitation': 30,
                'wind_speed': 15,
                'humidity': 70
            }
            
            weather_task_ids = task_manager.generate_weather_alerts(field_id, weather_forecast)
            
            result = {
                'field_id': field_id,
                'growth_stage': growth_stage,
                'field_health': field_health,
                'generated_tasks': {
                    'growth_stage_tasks': len(task_ids),
                    'weather_tasks': len(weather_task_ids),
                    'total': len(task_ids) + len(weather_task_ids)
                },
                'task_ids': task_ids + weather_task_ids,
                'timestamp': datetime.now().isoformat()
            }
            
            return [{"type": "text", "text": json.dumps(result, indent=2)}]
            
        except Exception as e:
            return [{"type": "text", "text": f"Error generating AI tasks: {str(e)}"}]
    
    @mcp_server.server.call_tool()
    async def get_task_summary(field_ids: str) -> List:
        """
        Get task summary for dashboard
        
        Args:
            field_ids: Comma-separated field IDs
        """
        try:
            from src.farmer_tasks.task_manager import FarmerTaskManager
            
            task_manager = FarmerTaskManager()
            field_list = [fid.strip() for fid in field_ids.split(',')]
            
            summary = task_manager.get_task_summary(field_list)
            
            # Add upcoming tasks
            upcoming_tasks = task_manager.get_upcoming_tasks(field_list, days_ahead=7)
            overdue_tasks = task_manager.get_overdue_tasks(field_list)
            
            detailed_summary = {
                **summary,
                'fields': field_list,
                'upcoming_tasks': [
                    {
                        'id': task.id,
                        'title': task.title,
                        'due_date': task.due_date.isoformat(),
                        'priority': task.priority.value,
                        'field_id': task.field_id
                    }
                    for task in upcoming_tasks[:5]  # Top 5 upcoming
                ],
                'overdue_tasks': [
                    {
                        'id': task.id,
                        'title': task.title,
                        'due_date': task.due_date.isoformat(),
                        'priority': task.priority.value,
                        'field_id': task.field_id
                    }
                    for task in overdue_tasks
                ],
                'timestamp': datetime.now().isoformat()
            }
            
            return [{"type": "text", "text": json.dumps(detailed_summary, indent=2)}]
            
        except Exception as e:
            return [{"type": "text", "text": f"Error getting task summary: {str(e)}"}]
    
    @mcp_server.server.call_tool()
    async def check_and_send_alerts(field_ids: str) -> List:
        """
        Check for tasks requiring alerts and send notifications
        
        Args:
            field_ids: Comma-separated field IDs
        """
        try:
            from src.farmer_tasks.task_manager import FarmerTaskManager
            from src.farmer_tasks.alert_system import FarmerAlertSystem, AlertConfig
            
            task_manager = FarmerTaskManager()
            alert_config = AlertConfig(
                email_enabled=True,
                whatsapp_enabled=True,
                push_notifications=True
            )
            alert_system = FarmerAlertSystem(task_manager, alert_config)
            
            field_list = [fid.strip() for fid in field_ids.split(',')]
            alerts_sent = await alert_system.check_and_send_alerts(field_list)
            
            # Get active alerts
            active_alerts = alert_system.get_active_alerts()
            
            result = {
                'fields': field_list,
                'alerts_sent': alerts_sent,
                'active_alerts': len(active_alerts),
                'recent_alerts': [
                    {
                        'id': alert['id'],
                        'title': alert['title'],
                        'type': alert['type'],
                        'priority': alert['priority'],
                        'task_id': alert['task_id']
                    }
                    for alert in active_alerts[-5:]  # Last 5 alerts
                ],
                'timestamp': datetime.now().isoformat()
            }
            
            return [{"type": "text", "text": json.dumps(result, indent=2)}]
            
        except Exception as e:
            return [{"type": "text", "text": f"Error checking alerts: {str(e)}"}]

# Updated MCP package.json to include task management tools
UPDATED_MCP_PACKAGE = {
    "mcp": {
        "server": {
            "command": "python",
            "args": ["mcp_server.py"],
            "env": {
                "SATELLITE_API_KEY": "demo_key",
                "SATELLITE_SECRET": "demo_secret",
                "UPDATE_INTERVAL": "30",
                "DASHBOARD_WEBHOOK": ""
            }
        },
        "tools": [
            {
                "name": "trigger_satellite_processing",
                "description": "Download and process satellite imagery for field analysis"
            },
            {
                "name": "classify_growth_stage",
                "description": "Trigger ML classification of potato crop growth stage"
            },
            {
                "name": "predict_nutrient_levels",
                "description": "Predict soil nutrient levels using ML regression models"
            },
            {
                "name": "generate_recommendations",
                "description": "Generate AI-powered zone-wise agricultural recommendations"
            },
            {
                "name": "update_dashboard",
                "description": "Trigger real-time dashboard updates with latest field data"
            },
            {
                "name": "schedule_weekly_processing",
                "description": "Set up automated weekly satellite processing schedule"
            },
            {
                "name": "create_farmer_task",
                "description": "Create a new farmer task with alerts and scheduling",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "field_id": {"type": "string", "description": "Field identifier"},
                        "title": {"type": "string", "description": "Task title"},
                        "description": {"type": "string", "description": "Task description"},
                        "category": {
                            "type": "string",
                            "enum": ["irrigation", "fertilization", "pest_control", "monitoring", "harvesting", "equipment"],
                            "description": "Task category"
                        },
                        "priority": {
                            "type": "string",
                            "enum": ["low", "medium", "high", "urgent"],
                            "description": "Task priority"
                        },
                        "due_hours": {"type": "integer", "description": "Hours from now when task is due", "default": 24}
                    },
                    "required": ["field_id", "title", "description", "category", "priority"]
                }
            },
            {
                "name": "get_farmer_tasks",
                "description": "Get farmer tasks for a field with filtering options",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "field_id": {"type": "string", "description": "Field identifier"},
                        "status_filter": {
                            "type": "string",
                            "enum": ["active", "completed", "overdue", "all"],
                            "description": "Filter tasks by status",
                            "default": "active"
                        }
                    },
                    "required": ["field_id"]
                }
            },
            {
                "name": "update_task_status",
                "description": "Update the status of a farmer task",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "task_id": {"type": "string", "description": "Task identifier"},
                        "new_status": {
                            "type": "string",
                            "enum": ["pending", "in_progress", "completed", "cancelled"],
                            "description": "New task status"
                        },
                        "notes": {"type": "string", "description": "Optional completion notes", "default": ""}
                    },
                    "required": ["task_id", "new_status"]
                }
            },
            {
                "name": "generate_ai_tasks",
                "description": "Generate AI-powered tasks based on field conditions",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "field_id": {"type": "string", "description": "Field identifier"},
                        "growth_stage": {"type": "string", "description": "Current growth stage"},
                        "field_health": {"type": "number", "description": "Field health percentage (0-100)"}
                    },
                    "required": ["field_id", "growth_stage", "field_health"]
                }
            },
            {
                "name": "get_task_summary",
                "description": "Get comprehensive task summary for dashboard",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "field_ids": {"type": "string", "description": "Comma-separated field IDs"}
                    },
                    "required": ["field_ids"]
                }
            },
            {
                "name": "check_and_send_alerts",
                "description": "Check for tasks requiring alerts and send notifications",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "field_ids": {"type": "string", "description": "Comma-separated field IDs"}
                    },
                    "required": ["field_ids"]
                }
            }
        ]
    }
}
