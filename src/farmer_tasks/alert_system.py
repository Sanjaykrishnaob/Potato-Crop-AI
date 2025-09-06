"""
Task Alert System - Real-time notifications and reminders for farmers
Integrates with the task management system to provide timely alerts
"""

import asyncio
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dataclasses import dataclass
import sqlite3
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import logging

from task_manager import FarmerTaskManager, TaskStatus, TaskPriority

logger = logging.getLogger(__name__)

@dataclass
class AlertConfig:
    """Configuration for alert system"""
    email_enabled: bool = True
    sms_enabled: bool = False
    whatsapp_enabled: bool = True
    push_notifications: bool = True
    reminder_hours_before: List[int] = None
    
    def __post_init__(self):
        if self.reminder_hours_before is None:
            self.reminder_hours_before = [24, 4, 1]  # 1 day, 4 hours, 1 hour before

class FarmerAlertSystem:
    """Comprehensive alert system for farmer tasks"""
    
    def __init__(self, task_manager: FarmerTaskManager, config: AlertConfig):
        self.task_manager = task_manager
        self.config = config
        self.active_alerts = {}
        
        # Initialize alert database
        self.init_alert_database()
    
    def init_alert_database(self):
        """Initialize database for tracking sent alerts"""
        conn = sqlite3.connect(self.task_manager.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS sent_alerts (
            id TEXT PRIMARY KEY,
            task_id TEXT,
            alert_type TEXT,
            recipient TEXT,
            sent_at TEXT,
            status TEXT,
            FOREIGN KEY (task_id) REFERENCES farmer_tasks (id)
        )
        ''')
        
        conn.commit()
        conn.close()
    
    async def check_and_send_alerts(self, field_ids: List[str]) -> Dict:
        """Check for tasks requiring alerts and send notifications"""
        alerts_sent = {
            'overdue': 0,
            'urgent': 0,
            'reminders': 0,
            'weather': 0,
            'total': 0
        }
        
        # Get all pending and in-progress tasks
        tasks = self.task_manager.get_tasks_for_farmer(
            field_ids,
            status_filter=[TaskStatus.PENDING, TaskStatus.IN_PROGRESS]
        )
        
        current_time = datetime.now()
        
        for task in tasks:
            # Check for overdue tasks
            if task.due_date < current_time and task.status != TaskStatus.OVERDUE:
                await self._send_overdue_alert(task)
                alerts_sent['overdue'] += 1
            
            # Check for urgent tasks
            elif task.priority == TaskPriority.URGENT and not self._alert_sent(task.id, 'urgent'):
                await self._send_urgent_alert(task)
                alerts_sent['urgent'] += 1
            
            # Check for scheduled reminders
            else:
                reminder_alerts = await self._check_reminder_alerts(task, current_time)
                alerts_sent['reminders'] += reminder_alerts
            
            # Check for weather-dependent tasks
            if task.weather_dependent:
                weather_alerts = await self._check_weather_alerts(task)
                alerts_sent['weather'] += weather_alerts
        
        alerts_sent['total'] = sum(alerts_sent.values()) - alerts_sent['total']
        
        logger.info(f"Sent {alerts_sent['total']} alerts across {len(field_ids)} fields")
        return alerts_sent
    
    async def _send_overdue_alert(self, task):
        """Send alert for overdue task"""
        message = {
            'title': f'⚠️ Overdue Task: {task.title}',
            'body': f'Task "{task.title}" was due on {task.due_date.strftime("%Y-%m-%d %H:%M")}. '
                   f'Please complete this task as soon as possible.',
            'priority': 'high',
            'task_id': task.id,
            'field_id': task.field_id,
            'actions': [
                {'text': 'Mark Complete', 'action': 'complete_task'},
                {'text': 'Extend Deadline', 'action': 'extend_deadline'},
                {'text': 'View Details', 'action': 'view_task'}
            ]
        }
        
        await self._send_notification(message, 'overdue')
        self._log_alert_sent(task.id, 'overdue', 'farmer@example.com')
    
    async def _send_urgent_alert(self, task):
        """Send alert for urgent task"""
        time_until_due = task.due_date - datetime.now()
        hours_remaining = int(time_until_due.total_seconds() / 3600)
        
        message = {
            'title': f'🚨 Urgent Task: {task.title}',
            'body': f'Urgent task due in {hours_remaining} hours. '
                   f'Cost impact: ₹{task.cost_estimate:,.0f}',
            'priority': 'urgent',
            'task_id': task.id,
            'field_id': task.field_id,
            'equipment_needed': task.equipment_needed,
            'materials_needed': task.materials_needed,
            'actions': [
                {'text': 'Start Now', 'action': 'start_task'},
                {'text': 'Get Resources', 'action': 'view_resources'},
                {'text': 'Postpone', 'action': 'postpone_task'}
            ]
        }
        
        await self._send_notification(message, 'urgent')
        self._log_alert_sent(task.id, 'urgent', 'farmer@example.com')
    
    async def _check_reminder_alerts(self, task, current_time) -> int:
        """Check and send reminder alerts"""
        alerts_sent = 0
        
        for hours_before in self.config.reminder_hours_before:
            reminder_time = task.due_date - timedelta(hours=hours_before)
            
            if (current_time >= reminder_time and 
                current_time < reminder_time + timedelta(minutes=30) and
                not self._alert_sent(task.id, f'reminder_{hours_before}h')):
                
                await self._send_reminder_alert(task, hours_before)
                alerts_sent += 1
        
        return alerts_sent
    
    async def _send_reminder_alert(self, task, hours_before):
        """Send reminder alert"""
        if hours_before >= 24:
            time_text = f"{int(hours_before/24)} day(s)"
        else:
            time_text = f"{hours_before} hour(s)"
        
        message = {
            'title': f'⏰ Reminder: {task.title}',
            'body': f'Task "{task.title}" is due in {time_text}. '
                   f'Duration: {task.estimated_duration} minutes.',
            'priority': 'medium',
            'task_id': task.id,
            'field_id': task.field_id,
            'zone_id': task.zone_id,
            'actions': [
                {'text': 'View Task', 'action': 'view_task'},
                {'text': 'Snooze 1hr', 'action': 'snooze_1h'},
                {'text': 'Mark Complete', 'action': 'complete_task'}
            ]
        }
        
        await self._send_notification(message, f'reminder_{hours_before}h')
        self._log_alert_sent(task.id, f'reminder_{hours_before}h', 'farmer@example.com')
    
    async def _check_weather_alerts(self, task) -> int:
        """Check weather conditions for weather-dependent tasks"""
        # This would integrate with weather API
        # For demo, we'll simulate weather conditions
        
        simulated_weather = {
            'temperature': 25,
            'humidity': 70,
            'wind_speed': 15,
            'precipitation_probability': 20,
            'conditions': 'partly_cloudy'
        }
        
        alerts_sent = 0
        
        # Check if weather conditions are suitable for task
        if task.weather_dependent and not self._alert_sent(task.id, 'weather_suitable'):
            if self._is_weather_suitable(task, simulated_weather):
                await self._send_weather_suitable_alert(task, simulated_weather)
                alerts_sent += 1
            elif self._is_weather_unsuitable(task, simulated_weather):
                await self._send_weather_warning_alert(task, simulated_weather)
                alerts_sent += 1
        
        return alerts_sent
    
    def _is_weather_suitable(self, task, weather) -> bool:
        """Check if weather is suitable for task"""
        # Define suitable conditions for different task categories
        suitable_conditions = {
            'irrigation': weather['precipitation_probability'] < 30,
            'fertilization': weather['wind_speed'] < 20 and weather['precipitation_probability'] < 20,
            'pest_control': weather['wind_speed'] < 15 and weather['precipitation_probability'] < 10,
            'harvesting': weather['precipitation_probability'] < 10
        }
        
        return suitable_conditions.get(task.category.value, True)
    
    def _is_weather_unsuitable(self, task, weather) -> bool:
        """Check if weather is unsuitable for task"""
        # Define unsuitable conditions
        unsuitable_conditions = {
            'irrigation': weather['precipitation_probability'] > 70,
            'fertilization': weather['wind_speed'] > 30 or weather['precipitation_probability'] > 60,
            'pest_control': weather['wind_speed'] > 25 or weather['precipitation_probability'] > 50,
            'harvesting': weather['precipitation_probability'] > 40
        }
        
        return unsuitable_conditions.get(task.category.value, False)
    
    async def _send_weather_suitable_alert(self, task, weather):
        """Send alert when weather becomes suitable"""
        message = {
            'title': f'☀️ Good Weather for: {task.title}',
            'body': f'Weather conditions are now suitable for "{task.title}". '
                   f'Temperature: {weather["temperature"]}°C, '
                   f'Wind: {weather["wind_speed"]} km/h, '
                   f'Rain chance: {weather["precipitation_probability"]}%',
            'priority': 'medium',
            'task_id': task.id,
            'field_id': task.field_id,
            'weather': weather,
            'actions': [
                {'text': 'Start Task', 'action': 'start_task'},
                {'text': 'Check Details', 'action': 'view_task'},
                {'text': 'Schedule Later', 'action': 'schedule_later'}
            ]
        }
        
        await self._send_notification(message, 'weather_suitable')
        self._log_alert_sent(task.id, 'weather_suitable', 'farmer@example.com')
    
    async def _send_weather_warning_alert(self, task, weather):
        """Send warning when weather becomes unsuitable"""
        message = {
            'title': f'🌧️ Weather Warning: {task.title}',
            'body': f'Weather conditions are not suitable for "{task.title}". '
                   f'Consider postponing. Rain chance: {weather["precipitation_probability"]}%, '
                   f'Wind: {weather["wind_speed"]} km/h',
            'priority': 'medium',
            'task_id': task.id,
            'field_id': task.field_id,
            'weather': weather,
            'actions': [
                {'text': 'Postpone Task', 'action': 'postpone_task'},
                {'text': 'Continue Anyway', 'action': 'start_task'},
                {'text': 'Check Forecast', 'action': 'view_weather'}
            ]
        }
        
        await self._send_notification(message, 'weather_warning')
        self._log_alert_sent(task.id, 'weather_warning', 'farmer@example.com')
    
    async def _send_notification(self, message: Dict, alert_type: str):
        """Send notification via configured channels"""
        # Email notification
        if self.config.email_enabled:
            await self._send_email_notification(message)
        
        # WhatsApp notification (would integrate with WhatsApp Business API)
        if self.config.whatsapp_enabled:
            await self._send_whatsapp_notification(message)
        
        # Push notification (would integrate with FCM or similar)
        if self.config.push_notifications:
            await self._send_push_notification(message)
        
        # Store notification for dashboard
        self._store_notification_for_dashboard(message, alert_type)
    
    async def _send_email_notification(self, message: Dict):
        """Send email notification"""
        try:
            # This is a demo implementation - in production, use proper email service
            email_body = f"""
            {message['title']}
            
            {message['body']}
            
            Field: {message['field_id']}
            Task ID: {message['task_id']}
            Priority: {message['priority']}
            
            Available Actions:
            {chr(10).join([f"- {action['text']}" for action in message.get('actions', [])])}
            
            ---
            Potato Crop AI Alert System
            """
            
            logger.info(f"Email alert sent: {message['title']}")
            
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
    
    async def _send_whatsapp_notification(self, message: Dict):
        """Send WhatsApp notification"""
        try:
            # Demo implementation - would integrate with WhatsApp Business API
            whatsapp_message = f"🥔 *{message['title']}*\n\n{message['body']}"
            
            if message.get('equipment_needed'):
                whatsapp_message += f"\n\n🔧 Equipment: {', '.join(message['equipment_needed'])}"
            
            if message.get('materials_needed'):
                whatsapp_message += f"\n📦 Materials: {', '.join(message['materials_needed'])}"
            
            logger.info(f"WhatsApp alert sent: {message['title']}")
            
        except Exception as e:
            logger.error(f"Failed to send WhatsApp notification: {e}")
    
    async def _send_push_notification(self, message: Dict):
        """Send push notification"""
        try:
            # Demo implementation - would integrate with FCM
            push_payload = {
                'title': message['title'],
                'body': message['body'][:100] + '...' if len(message['body']) > 100 else message['body'],
                'data': {
                    'task_id': message['task_id'],
                    'field_id': message['field_id'],
                    'priority': message['priority']
                }
            }
            
            logger.info(f"Push notification sent: {message['title']}")
            
        except Exception as e:
            logger.error(f"Failed to send push notification: {e}")
    
    def _store_notification_for_dashboard(self, message: Dict, alert_type: str):
        """Store notification for dashboard display"""
        notification_id = f"alert_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{message['task_id'][:8]}"
        
        self.active_alerts[notification_id] = {
            'id': notification_id,
            'title': message['title'],
            'body': message['body'],
            'type': alert_type,
            'priority': message['priority'],
            'task_id': message['task_id'],
            'field_id': message['field_id'],
            'timestamp': datetime.now().isoformat(),
            'actions': message.get('actions', []),
            'read': False
        }
    
    def _alert_sent(self, task_id: str, alert_type: str) -> bool:
        """Check if specific alert was already sent"""
        conn = sqlite3.connect(self.task_manager.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT COUNT(*) FROM sent_alerts 
        WHERE task_id = ? AND alert_type = ? AND status = 'sent'
        ''', (task_id, alert_type))
        
        count = cursor.fetchone()[0]
        conn.close()
        
        return count > 0
    
    def _log_alert_sent(self, task_id: str, alert_type: str, recipient: str):
        """Log sent alert to database"""
        conn = sqlite3.connect(self.task_manager.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
        INSERT INTO sent_alerts (id, task_id, alert_type, recipient, sent_at, status)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            f"alert_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            task_id,
            alert_type,
            recipient,
            datetime.now().isoformat(),
            'sent'
        ))
        
        conn.commit()
        conn.close()
    
    def get_active_alerts(self) -> List[Dict]:
        """Get active alerts for dashboard"""
        return list(self.active_alerts.values())
    
    def mark_alert_read(self, alert_id: str) -> bool:
        """Mark alert as read"""
        if alert_id in self.active_alerts:
            self.active_alerts[alert_id]['read'] = True
            return True
        return False
    
    def clear_old_alerts(self, hours_old: int = 24):
        """Clear alerts older than specified hours"""
        cutoff_time = datetime.now() - timedelta(hours=hours_old)
        
        alerts_to_remove = []
        for alert_id, alert in self.active_alerts.items():
            alert_time = datetime.fromisoformat(alert['timestamp'])
            if alert_time < cutoff_time:
                alerts_to_remove.append(alert_id)
        
        for alert_id in alerts_to_remove:
            del self.active_alerts[alert_id]
        
        logger.info(f"Cleared {len(alerts_to_remove)} old alerts")

# Demo usage
async def demo_alert_system():
    """Demonstrate the farmer alert system"""
    from task_manager import FarmerTaskManager
    
    # Initialize systems
    task_manager = FarmerTaskManager()
    alert_config = AlertConfig(
        email_enabled=True,
        whatsapp_enabled=True,
        push_notifications=True,
        reminder_hours_before=[24, 4, 1]
    )
    alert_system = FarmerAlertSystem(task_manager, alert_config)
    
    # Check and send alerts for demo fields
    field_ids = ['field_001', 'field_002', 'field_003']
    alerts_sent = await alert_system.check_and_send_alerts(field_ids)
    
    print("Alert System Demo:")
    print(f"Alerts sent: {alerts_sent}")
    
    # Show active alerts
    active_alerts = alert_system.get_active_alerts()
    print(f"\nActive alerts: {len(active_alerts)}")
    for alert in active_alerts[:3]:  # Show first 3
        print(f"- {alert['title']} ({alert['type']})")

if __name__ == "__main__":
    asyncio.run(demo_alert_system())
