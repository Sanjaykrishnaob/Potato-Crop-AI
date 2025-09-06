/*
React Component for Farmer Task Dashboard
Displays to-do list, alerts, and task management interface
*/

import React, { useState, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  BellIcon,
  ChartBarIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyRupeeIcon
} from '@heroicons/react/24/outline';

const TaskDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [taskSummary, setSummary] = useState({});
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);

  // Sample task data with Indian agriculture context
  const sampleTasks = [
    {
      id: '1',
      title: '🌧️ Heavy Rain Alert',
      description: 'Heavy rainfall expected (65mm). Check drainage and postpone field operations.',
      category: 'weather_alert',
      priority: 'urgent',
      status: 'pending',
      field_id: 'field_001',
      due_date: '2025-09-05T08:00:00',
      estimated_duration: 45,
      cost_estimate: 0,
      auto_generated: true,
      weather_dependent: true,
      risk_factors: ['waterlogging', 'soil_compaction']
    },
    {
      id: '2',
      title: '💧 Optimize Irrigation Schedule',
      description: 'Adjust irrigation frequency for optimal vegetative growth in Zone 2.',
      category: 'irrigation',
      priority: 'high',
      status: 'pending',
      field_id: 'field_001',
      due_date: '2025-09-06T06:00:00',
      estimated_duration: 90,
      cost_estimate: 1500,
      auto_generated: true,
      equipment_needed: ['irrigation_system', 'water_pump'],
      zone_id: '2',
      area_hectares: 3.0
    },
    {
      id: '3',
      title: '🌿 Apply Nitrogen Fertilizer',
      description: 'Apply nitrogen fertilizer to support leaf and stem growth (50kg/ha).',
      category: 'fertilization',
      priority: 'high',
      status: 'in_progress',
      field_id: 'field_001',
      due_date: '2025-09-08T07:00:00',
      estimated_duration: 120,
      cost_estimate: 6000,
      auto_generated: true,
      equipment_needed: ['spreader', 'tractor'],
      materials_needed: ['nitrogen_fertilizer']
    },
    {
      id: '4',
      title: '🥔 Monitor Tuber Development',
      description: 'Check tuber formation progress and soil conditions.',
      category: 'monitoring',
      priority: 'medium',
      status: 'pending',
      field_id: 'field_002',
      due_date: '2025-09-10T09:00:00',
      estimated_duration: 60,
      cost_estimate: 0,
      auto_generated: false
    },
    {
      id: '5',
      title: '🧊 Frost Protection Setup',
      description: 'Temperature dropping to 1°C. Set up frost protection covers.',
      category: 'weather_alert',
      priority: 'urgent',
      status: 'completed',
      field_id: 'field_002',
      due_date: '2025-09-04T18:00:00',
      estimated_duration: 60,
      cost_estimate: 3500,
      completed_at: '2025-09-04T17:30:00',
      completion_notes: 'Covers installed successfully. All plants protected.'
    }
  ];

  const taskSummaryData = {
    total_tasks: 12,
    pending: 6,
    in_progress: 3,
    completed: 3,
    overdue: 1,
    upcoming_3_days: 4,
    urgent_tasks: 2,
    auto_generated: 9,
    total_estimated_cost: 18500
  };

  useEffect(() => {
    setTasks(sampleTasks);
    setSummary(taskSummaryData);
  }, []);

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      weather_alert: '🌤️',
      irrigation: '💧',
      fertilization: '🌿',
      monitoring: '👁️',
      pest_control: '🐛',
      harvesting: '🚜',
      equipment: '⚙️'
    };
    return icons[category] || '📋';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays <= 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTasks = tasks.filter(task => {
    if (!showCompleted && task.status === 'completed') return false;
    if (selectedFilter !== 'all' && task.category !== selectedFilter) return false;
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;
    return true;
  });

  const updateTaskStatus = (taskId, newStatus) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }
        : task
    ));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Farmer Task Dashboard</h1>
        <p className="text-gray-600">Manage your agricultural tasks, alerts, and to-do items</p>
      </div>

      {/* Task Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{taskSummary.total_tasks}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Urgent Tasks</p>
              <p className="text-3xl font-bold text-red-900">{taskSummary.urgent_tasks}</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Due Soon</p>
              <p className="text-3xl font-bold text-orange-900">{taskSummary.upcoming_3_days}</p>
            </div>
            <ClockIcon className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Cost</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(taskSummary.total_estimated_cost)}</p>
            </div>
            <CurrencyRupeeIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select 
              value={selectedFilter} 
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="weather_alert">Weather Alerts</option>
              <option value="irrigation">Irrigation</option>
              <option value="fertilization">Fertilization</option>
              <option value="monitoring">Monitoring</option>
              <option value="pest_control">Pest Control</option>
              <option value="harvesting">Harvesting</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select 
              value={selectedPriority} 
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="showCompleted"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showCompleted" className="ml-2 text-sm text-gray-700">
              Show Completed Tasks
            </label>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getCategoryIcon(task.category)}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    {task.auto_generated && (
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                        AI Generated
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4">{task.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {formatDateTime(task.due_date)}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      {task.estimated_duration} min
                    </div>
                    
                    {task.cost_estimate > 0 && (
                      <div className="flex items-center gap-1">
                        <CurrencyRupeeIcon className="h-4 w-4" />
                        {formatCurrency(task.cost_estimate)}
                      </div>
                    )}
                    
                    {task.zone_id && (
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="h-4 w-4" />
                        Zone {task.zone_id} ({task.area_hectares}ha)
                      </div>
                    )}
                  </div>

                  {/* Equipment and Materials */}
                  {(task.equipment_needed?.length > 0 || task.materials_needed?.length > 0) && (
                    <div className="mt-4 space-y-2">
                      {task.equipment_needed?.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Equipment: </span>
                          <span className="text-sm text-gray-600">
                            {task.equipment_needed.join(', ')}
                          </span>
                        </div>
                      )}
                      {task.materials_needed?.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Materials: </span>
                          <span className="text-sm text-gray-600">
                            {task.materials_needed.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Risk Factors */}
                  {task.risk_factors?.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm font-medium text-red-700">Risk Factors: </span>
                      <span className="text-sm text-red-600">
                        {task.risk_factors.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3 ml-6">
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                      {task.priority.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {task.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          Start
                        </button>
                        <button
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                          className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                        >
                          Complete
                        </button>
                      </>
                    )}
                    
                    {task.status === 'in_progress' && (
                      <button
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                        className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                      >
                        Complete
                      </button>
                    )}
                    
                    {task.status === 'completed' && task.completion_notes && (
                      <div className="text-xs text-gray-500 max-w-xs text-right">
                        <p className="font-medium">Completed:</p>
                        <p>{new Date(task.completed_at).toLocaleString('en-IN')}</p>
                        <p className="mt-1">{task.completion_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {showCompleted ? 'Try adjusting your filters.' : 'All tasks completed or try showing completed tasks.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskDashboard;
