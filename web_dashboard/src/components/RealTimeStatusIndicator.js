import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Typography,
  IconButton,
  Badge,
  Fade,
} from '@mui/material';
import {
  Wifi as ConnectedIcon,
  WifiOff as DisconnectedIcon,
  Sync as SyncIcon,
  AccessTime as TimeIcon,
  Cloud as CloudIcon,
  CloudOff as CloudOffIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StatusContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
}));

const PulsingIcon = styled('div')(({ theme, connected }) => ({
  animation: connected ? 'pulse 2s infinite' : 'none',
  '@keyframes pulse': {
    '0%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.5,
    },
    '100%': {
      opacity: 1,
    },
  },
}));

const RealTimeStatusIndicator = ({ 
  connectionStatus, 
  lastUpdate, 
  topic,
  showDetails = true,
  compact = false
}) => {
  const { isConnected, connectionType, subscriberCount } = connectionStatus || {};

  const getStatusColor = () => {
    if (isConnected) {
      return connectionType === 'websocket' ? 'success' : 'warning';
    }
    return 'error';
  };

  const getStatusText = () => {
    if (isConnected) {
      return connectionType === 'websocket' ? 'Live' : 'Polling';
    }
    return 'Offline';
  };

  const getStatusIcon = () => {
    if (isConnected) {
      return connectionType === 'websocket' ? <ConnectedIcon /> : <CloudIcon />;
    }
    return <CloudOffIcon />;
  };

  const formatLastUpdate = (date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (compact) {
    return (
      <Tooltip 
        title={`${getStatusText()} • Updated ${formatLastUpdate(lastUpdate)} • ${subscriberCount || 0} subscribers`}
        arrow
      >
        <IconButton size="small">
          <Badge 
            color={getStatusColor()} 
            variant="dot" 
            invisible={!isConnected}
          >
            <PulsingIcon connected={isConnected}>
              {getStatusIcon()}
            </PulsingIcon>
          </Badge>
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <StatusContainer>
      <PulsingIcon connected={isConnected}>
        {getStatusIcon()}
      </PulsingIcon>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip
            label={getStatusText()}
            size="small"
            color={getStatusColor()}
            variant={isConnected ? 'filled' : 'outlined'}
            sx={{ 
              height: 20, 
              fontSize: '0.7rem',
              fontWeight: 600
            }}
          />
          
          {topic && (
            <Typography variant="caption" color="text.secondary">
              {topic}
            </Typography>
          )}
        </Box>
        
        {showDetails && (
          <Fade in={true}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimeIcon sx={{ fontSize: 12 }} color="action" />
                <Typography variant="caption" color="text.secondary">
                  {formatLastUpdate(lastUpdate)}
                </Typography>
              </Box>
              
              {subscriberCount > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <SyncIcon sx={{ fontSize: 12 }} color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {subscriberCount}
                  </Typography>
                </Box>
              )}
            </Box>
          </Fade>
        )}
      </Box>
    </StatusContainer>
  );
};

// Live data indicator for individual components
export const LiveDataIndicator = ({ 
  isLive, 
  lastUpdate, 
  size = 'small' 
}) => {
  const getIndicatorColor = () => {
    if (!lastUpdate) return 'grey';
    
    const now = new Date();
    const diff = (now - lastUpdate) / 1000;
    
    if (diff < 30) return 'success'; // Less than 30 seconds
    if (diff < 300) return 'warning'; // Less than 5 minutes
    return 'error'; // More than 5 minutes
  };

  return (
    <Tooltip 
      title={`Last updated: ${formatLastUpdate(lastUpdate)}`}
      arrow
    >
      <Box
        sx={{
          width: size === 'small' ? 8 : 12,
          height: size === 'small' ? 8 : 12,
          borderRadius: '50%',
          backgroundColor: (theme) => theme.palette[getIndicatorColor()].main,
          animation: isLive ? 'blink 2s infinite' : 'none',
          '@keyframes blink': {
            '0%, 50%': { opacity: 1 },
            '51%, 100%': { opacity: 0.3 },
          },
        }}
      />
    </Tooltip>
  );
};

// Real-time metrics display
export const RealTimeMetrics = ({ 
  connectionStatus, 
  dataUpdateFrequency,
  activeTopics = [] 
}) => {
  const { isConnected, connectionType } = connectionStatus || {};

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Status:
        </Typography>
        <Chip
          label={isConnected ? 'Connected' : 'Offline'}
          size="small"
          color={isConnected ? 'success' : 'error'}
          icon={isConnected ? <ConnectedIcon /> : <DisconnectedIcon />}
        />
      </Box>

      {isConnected && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Mode:
          </Typography>
          <Chip
            label={connectionType === 'websocket' ? 'WebSocket' : 'Polling'}
            size="small"
            color={connectionType === 'websocket' ? 'primary' : 'warning'}
            variant="outlined"
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Topics:
        </Typography>
        <Chip
          label={activeTopics.length}
          size="small"
          color="info"
          variant="outlined"
        />
      </Box>

      {dataUpdateFrequency && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Updates:
          </Typography>
          <Typography variant="caption" color="primary.main" fontWeight={600}>
            {dataUpdateFrequency}/min
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const formatLastUpdate = (date) => {
  if (!date) return 'Never';
  
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return date.toLocaleDateString();
};

export default RealTimeStatusIndicator;
