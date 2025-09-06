import React from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Typography,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

const NotificationSystem = ({ 
  notifications, 
  onRemove, 
  onClearAll,
  position = { vertical: 'top', horizontal: 'right' }
}) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <SuccessIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'info':
      default:
        return <InfoIcon />;
    }
  };

  const getSeverity = (type) => {
    return ['success', 'warning', 'error', 'info'].includes(type) ? type : 'info';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'error';
      case 'Medium':
        return 'warning';
      case 'Low':
        return 'info';
      default:
        return 'default';
    }
  };

  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: position.vertical === 'top' ? 80 : 'auto',
        bottom: position.vertical === 'bottom' ? 16 : 'auto',
        right: position.horizontal === 'right' ? 16 : 'auto',
        left: position.horizontal === 'left' ? 16 : 'auto',
        zIndex: 9999,
        maxWidth: 400,
        width: '100%',
      }}
    >
      <Stack spacing={1}>
        {notifications.map((notification) => (
          <Alert
            key={notification.id}
            severity={getSeverity(notification.type)}
            icon={getIcon(notification.type)}
            variant="filled"
            sx={{
              borderRadius: 2,
              boxShadow: 3,
              animation: 'slideInRight 0.3s ease-out',
              '@keyframes slideInRight': {
                from: {
                  transform: 'translateX(100%)',
                  opacity: 0,
                },
                to: {
                  transform: 'translateX(0)',
                  opacity: 1,
                },
              },
            }}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {notification.priority && (
                  <Chip
                    label={notification.priority}
                    size="small"
                    color={getPriorityColor(notification.priority)}
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                )}
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={() => onRemove(notification.id)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            }
          >
            <AlertTitle sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
              {notification.title || 'Notification'}
            </AlertTitle>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              {notification.message}
            </Typography>
            {notification.field && (
              <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                📍 {notification.field}
              </Typography>
            )}
            {notification.timestamp && (
              <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>
                {new Date(notification.timestamp).toLocaleTimeString()}
              </Typography>
            )}
          </Alert>
        ))}
        
        {notifications.length > 3 && (
          <Alert
            severity="info"
            variant="outlined"
            sx={{
              borderRadius: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }}
            action={
              <IconButton size="small" onClick={onClearAll}>
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            <Typography variant="body2">
              +{notifications.length - 3} more notifications
            </Typography>
          </Alert>
        )}
      </Stack>
    </Box>
  );
};

// Toast notification component for simple messages
export const ToastNotification = ({ 
  open, 
  message, 
  type = 'info', 
  onClose, 
  autoHideDuration = 6000 
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Alert
        onClose={onClose}
        severity={type}
        variant="filled"
        sx={{ borderRadius: 2 }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

// Agricultural-specific notification types
export const createCropAlert = (field, type, message, priority = 'Medium') => ({
  type: 'warning',
  title: `🌱 Crop Alert - ${field}`,
  message,
  field,
  priority,
  category: 'crop',
  timestamp: new Date().toISOString(),
});

export const createWeatherAlert = (field, message, priority = 'Low') => ({
  type: 'info',
  title: `🌤️ Weather Update - ${field}`,
  message,
  field,
  priority,
  category: 'weather',
  timestamp: new Date().toISOString(),
});

export const createSystemAlert = (message, type = 'info') => ({
  type,
  title: '⚙️ System Notification',
  message,
  category: 'system',
  timestamp: new Date().toISOString(),
});

export const createRecommendationAlert = (field, action, impact) => ({
  type: 'success',
  title: `🎯 New Recommendation - ${field}`,
  message: `${action} - Expected impact: ${impact}`,
  field,
  priority: 'Medium',
  category: 'recommendation',
  timestamp: new Date().toISOString(),
});

export default NotificationSystem;
