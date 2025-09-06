import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Fab,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  PlayArrow as StartIcon,
  Check as CompleteIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  FilterList as FilterIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  Build as EquipmentIcon,
  Inventory as MaterialIcon,
  TrendingUp as TrendingUpIcon,
  NotificationsActive as AlertIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const TaskCard = styled(Card)(({ theme, priority, status }) => {
  let borderColor = theme.palette.grey[300];
  let backgroundColor = theme.palette.background.paper;
  
  if (priority === 'urgent') {
    borderColor = theme.palette.error.main;
    backgroundColor = theme.palette.error.light + '10';
  } else if (priority === 'high') {
    borderColor = theme.palette.warning.main;
    backgroundColor = theme.palette.warning.light + '10';
  } else if (status === 'completed') {
    borderColor = theme.palette.success.main;
    backgroundColor = theme.palette.success.light + '10';
  }
  
  return {
    borderLeft: `4px solid ${borderColor}`,
    backgroundColor,
    marginBottom: theme.spacing(2),
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: theme.shadows[4],
      transform: 'translateY(-2px)',
    },
  };
});

const SummaryCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}));

const StatsCard = styled(Card)(({ theme, color }) => {
  const colors = {
    primary: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
    success: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
    warning: 'linear-gradient(135deg, #FF9800 0%, #FFC107 100%)',
    error: 'linear-gradient(135deg, #F44336 0%, #E91E63 100%)',
  };
  
  return {
    background: colors[color] || colors.primary,
    color: 'white',
    height: '100%',
  };
});

function TaskManagement({ addNotification }) {
  const [tasks, setTasks] = useState([]);
  const [taskSummary, setSummary] = useState({});
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'monitoring',
    priority: 'medium',
    field_id: 'field_001',
    due_hours: 24
  });

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
      risk_factors: ['waterlogging', 'soil_compaction'],
      created_at: '2025-09-04T10:00:00'
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
    },
    {
      id: '6',
      title: '📋 Equipment Maintenance Check',
      description: 'Routine maintenance check for irrigation pumps and sprinklers.',
      category: 'equipment',
      priority: 'medium',
      status: 'pending',
      field_id: 'field_001',
      due_date: '2025-09-12T10:00:00',
      estimated_duration: 180,
      cost_estimate: 2000,
      auto_generated: false,
      equipment_needed: ['maintenance_tools', 'replacement_parts']
    }
  ];

  const taskSummaryData = {
    total_tasks: 15,
    pending: 8,
    in_progress: 4,
    completed: 3,
    overdue: 2,
    upcoming_3_days: 5,
    urgent_tasks: 3,
    auto_generated: 12,
    total_estimated_cost: 28500
  };

  useEffect(() => {
    setTasks(sampleTasks);
    setSummary(taskSummaryData);
    setLoading(false);
    
    // Show welcome notification
    addNotification({
      type: 'info',
      title: '📋 Task Management Loaded',
      message: `Found ${sampleTasks.length} tasks. ${taskSummaryData.urgent_tasks} urgent tasks require attention.`,
      priority: 'Medium'
    });
  }, [addNotification]);

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'error',
      high: 'warning',
      medium: 'info',
      low: 'success'
    };
    return colors[priority] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'default',
      in_progress: 'primary',
      completed: 'success',
      overdue: 'error'
    };
    return colors[status] || 'default';
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
    
    const task = tasks.find(t => t.id === taskId);
    addNotification({
      type: newStatus === 'completed' ? 'success' : 'info',
      title: `Task ${newStatus === 'completed' ? 'Completed' : 'Updated'}`,
      message: `"${task.title}" status changed to ${newStatus}`,
      priority: 'Medium'
    });
  };

  const handleCreateTask = () => {
    const task = {
      id: Date.now().toString(),
      ...newTask,
      status: 'pending',
      due_date: new Date(Date.now() + newTask.due_hours * 60 * 60 * 1000).toISOString(),
      estimated_duration: 60,
      cost_estimate: 0,
      auto_generated: false,
      created_at: new Date().toISOString()
    };
    
    setTasks([task, ...tasks]);
    setCreateDialogOpen(false);
    setNewTask({
      title: '',
      description: '',
      category: 'monitoring',
      priority: 'medium',
      field_id: 'field_001',
      due_hours: 24
    });
    
    addNotification({
      type: 'success',
      title: '✅ Task Created',
      message: `New task "${task.title}" created successfully`,
      priority: 'Medium'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading tasks...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          📋 Task Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your agricultural tasks, alerts, and to-do items
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <StatsCard color="primary">
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {taskSummary.total_tasks}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Tasks
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} md={3}>
          <StatsCard color="error">
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {taskSummary.urgent_tasks}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Urgent Tasks
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} md={3}>
          <StatsCard color="warning">
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {taskSummary.upcoming_3_days}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Due Soon
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} md={3}>
          <StatsCard color="success">
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {formatCurrency(taskSummary.total_estimated_cost)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Cost
                  </Typography>
                </Box>
                <MoneyIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="weather_alert">🌤️ Weather Alerts</MenuItem>
                  <MenuItem value="irrigation">💧 Irrigation</MenuItem>
                  <MenuItem value="fertilization">🌿 Fertilization</MenuItem>
                  <MenuItem value="monitoring">👁️ Monitoring</MenuItem>
                  <MenuItem value="pest_control">🐛 Pest Control</MenuItem>
                  <MenuItem value="harvesting">🚜 Harvesting</MenuItem>
                  <MenuItem value="equipment">⚙️ Equipment</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="urgent">🚨 Urgent</MenuItem>
                  <MenuItem value="high">🔶 High</MenuItem>
                  <MenuItem value="medium">🔷 Medium</MenuItem>
                  <MenuItem value="low">🟢 Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showCompleted}
                    onChange={(e) => setShowCompleted(e.target.checked)}
                  />
                }
                label="Show Completed"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                fullWidth
              >
                Create Task
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Task List */}
      <Box>
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} priority={task.priority} status={task.status}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Typography variant="h2" component="span">
                      {getCategoryIcon(task.category)}
                    </Typography>
                    <Box>
                      <Typography variant="h6" component="h3" fontWeight="bold">
                        {task.title}
                      </Typography>
                      {task.auto_generated && (
                        <Chip
                          label="🤖 AI Generated"
                          size="small"
                          color="secondary"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Typography variant="body1" color="text.secondary" mb={2}>
                    {task.description}
                  </Typography>
                  
                  {/* Task Details */}
                  <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                    <Chip
                      icon={<CalendarIcon />}
                      label={formatDateTime(task.due_date)}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<ScheduleIcon />}
                      label={`${task.estimated_duration} min`}
                      size="small"
                      variant="outlined"
                    />
                    {task.cost_estimate > 0 && (
                      <Chip
                        icon={<MoneyIcon />}
                        label={formatCurrency(task.cost_estimate)}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {task.zone_id && (
                      <Chip
                        icon={<LocationIcon />}
                        label={`Zone ${task.zone_id} (${task.area_hectares}ha)`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {/* Equipment and Materials */}
                  {task.equipment_needed && (
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <EquipmentIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Equipment: {task.equipment_needed.join(', ')}
                      </Typography>
                    </Box>
                  )}
                  
                  {task.materials_needed && (
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <MaterialIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Materials: {task.materials_needed.join(', ')}
                      </Typography>
                    </Box>
                  )}

                  {/* Risk Factors */}
                  {task.risk_factors && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Risk Factors:</strong> {task.risk_factors.join(', ')}
                      </Typography>
                    </Alert>
                  )}
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box display="flex" flexDirection="column" alignItems="flex-end" gap={2}>
                    {/* Status and Priority Chips */}
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip
                        label={task.priority.toUpperCase()}
                        color={getPriorityColor(task.priority)}
                        size="small"
                      />
                      <Chip
                        label={task.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(task.status)}
                        variant="outlined"
                        size="small"
                      />
                    </Box>

                    {/* Action Buttons */}
                    <Box display="flex" gap={1}>
                      {task.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<StartIcon />}
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                          >
                            Start
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CompleteIcon />}
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                          >
                            Complete
                          </Button>
                        </>
                      )}
                      
                      {task.status === 'in_progress' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CompleteIcon />}
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                      
                      {task.status === 'completed' && task.completion_notes && (
                        <Box textAlign="right">
                          <Typography variant="caption" color="text.secondary">
                            Completed: {new Date(task.completed_at).toLocaleString('en-IN')}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {task.completion_notes}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </TaskCard>
        ))}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent>
              <Box textAlign="center" py={6}>
                <CompleteIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No tasks found
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {showCompleted ? 'Try adjusting your filters.' : 'All tasks completed or try showing completed tasks.'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Task Title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                value={newTask.category}
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                label="Category"
              >
                <MenuItem value="irrigation">💧 Irrigation</MenuItem>
                <MenuItem value="fertilization">🌿 Fertilization</MenuItem>
                <MenuItem value="monitoring">👁️ Monitoring</MenuItem>
                <MenuItem value="pest_control">🐛 Pest Control</MenuItem>
                <MenuItem value="harvesting">🚜 Harvesting</MenuItem>
                <MenuItem value="equipment">⚙️ Equipment</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Priority</InputLabel>
              <Select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                label="Priority"
              >
                <MenuItem value="low">🟢 Low</MenuItem>
                <MenuItem value="medium">🔷 Medium</MenuItem>
                <MenuItem value="high">🔶 High</MenuItem>
                <MenuItem value="urgent">🚨 Urgent</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Due in (hours)"
              type="number"
              value={newTask.due_hours}
              onChange={(e) => setNewTask({ ...newTask, due_hours: parseInt(e.target.value) })}
              margin="normal"
              inputProps={{ min: 1, max: 720 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTask}
            variant="contained"
            disabled={!newTask.title || !newTask.description}
          >
            Create Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Quick Task Creation */}
      <Fab
        color="primary"
        aria-label="add task"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
        onClick={() => setCreateDialogOpen(true)}
      >
        <Badge badgeContent={taskSummary.urgent_tasks} color="error">
          <AddIcon />
        </Badge>
      </Fab>
    </Box>
  );
}

export default TaskManagement;
