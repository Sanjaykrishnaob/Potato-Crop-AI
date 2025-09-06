import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Button,
  Chip,
  Avatar,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Slide,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  SwipeableViews,
} from '@mui/material';
import {
  MyLocation as LocationIcon,
  CameraAlt as CameraIcon,
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
  CloudSync as SyncIcon,
  Agriculture as FieldIcon,
  Warning as WarningIcon,
  CheckCircle as HealthyIcon,
  Error as CriticalIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Navigation as NavigateIcon,
  PhotoCamera as PhotoIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

// Mobile-optimized Field Card with touch gestures
const MobileFieldCard = ({ 
  field, 
  onTap, 
  onLongPress,
  onNavigate,
  onCapture,
  isOffline = false 
}) => {
  const [touchStart, setTouchStart] = useState(null);
  const theme = useTheme();

  const getHealthColor = (health) => {
    if (health >= 90) return 'success';
    if (health >= 70) return 'warning';
    return 'error';
  };

  const getHealthIcon = (health) => {
    if (health >= 90) return <HealthyIcon />;
    if (health >= 70) return <WarningIcon />;
    return <CriticalIcon />;
  };

  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    });
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    
    const touchDuration = Date.now() - touchStart.time;
    const deltaX = Math.abs(e.changedTouches[0].clientX - touchStart.x);
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStart.y);
    
    // Check if it's a tap (not a swipe)
    if (deltaX < 10 && deltaY < 10) {
      if (touchDuration > 500) {
        onLongPress?.(field);
      } else {
        onTap?.(field);
      }
    }
    
    setTouchStart(null);
  };

  return (
    <Card
      sx={{
        mb: 2,
        border: field.alerts > 0 ? `2px solid ${theme.palette.error.main}` : '1px solid',
        borderColor: field.alerts > 0 ? 'error.main' : 'divider',
        borderRadius: 3,
        boxShadow: field.alerts > 0 ? 4 : 2,
        position: 'relative',
        overflow: 'visible',
        '&:active': {
          transform: 'scale(0.98)',
          transition: 'transform 0.1s'
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <CardContent sx={{ p: 2 }}>
        {/* Header with field info */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            sx={{
              bgcolor: `${getHealthColor(field.health)}.main`,
              width: 48,
              height: 48,
              mr: 2
            }}
          >
            {getHealthIcon(field.health)}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight="bold" noWrap>
              {field.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {field.area} acres • {field.crop}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isOffline ? (
              <OfflineIcon color="disabled" fontSize="small" />
            ) : (
              <OnlineIcon color="success" fontSize="small" />
            )}
            
            {field.alerts > 0 && (
              <Chip
                label={field.alerts}
                color="error"
                size="small"
                sx={{ minWidth: 24, height: 24 }}
              />
            )}
          </Box>
        </Box>
        
        {/* Key metrics */}
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold" color={`${getHealthColor(field.health)}.main`}>
                {field.health}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Health
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight="bold">
                {field.ndvi}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                NDVI
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={4}>
            <Box sx={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mr: 0.5 }}>
                {field.yieldTrend > 0 ? '+' : ''}{field.yieldTrend}%
              </Typography>
              {field.yieldTrend > 0 ? (
                <TrendingUpIcon color="success" fontSize="small" />
              ) : (
                <TrendingDownIcon color="error" fontSize="small" />
              )}
              <Typography variant="caption" color="text.secondary" sx={{ position: 'absolute', bottom: 0 }}>
                Yield
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {/* Growth stage and status */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip
            label={field.growthStage}
            variant="outlined"
            size="small"
            sx={{ flex: 1 }}
          />
          <Chip
            label={field.status}
            color={field.status === 'Critical' ? 'error' : field.status === 'Good' ? 'success' : 'warning'}
            size="small"
            sx={{ flex: 1 }}
          />
        </Box>
        
        {/* Quick actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate?.(field);
              }}
            >
              <NavigateIcon />
            </IconButton>
            
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                onCapture?.(field);
              }}
            >
              <PhotoIcon />
            </IconButton>
            
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                // Share functionality
                if (navigator.share) {
                  navigator.share({
                    title: `${field.name} Status`,
                    text: `Health: ${field.health}%, Status: ${field.status}`,
                  });
                }
              }}
            >
              <ShareIcon />
            </IconButton>
          </Box>
          
          <Typography variant="caption" color="text.secondary">
            Updated {new Date(field.lastUpdate).toLocaleTimeString()}
          </Typography>
        </Box>
        
        {/* Offline indicator */}
        {isOffline && (
          <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
            <Typography variant="caption">
              Offline data - will sync when connected
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

// Quick Action Speed Dial for Mobile
const MobileQuickActions = ({ onAction, isVisible = true }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const actions = [
    { icon: <AddIcon />, name: 'Add Field', key: 'add' },
    { icon: <CameraIcon />, name: 'Take Photo', key: 'camera' },
    { icon: <LocationIcon />, name: 'GPS Location', key: 'location' },
    { icon: <SyncIcon />, name: 'Sync Data', key: 'sync' },
  ];

  if (!isVisible) return null;

  return (
    <Box sx={{ position: 'fixed', bottom: 90, right: 16, zIndex: 1200 }}>
      {/* Action buttons */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Box sx={{ mb: 1 }}>
          {actions.map((action, index) => (
            <Box key={action.key} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="body2"
                sx={{
                  bgcolor: 'background.paper',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  mr: 1,
                  boxShadow: 2,
                  whiteSpace: 'nowrap'
                }}
              >
                {action.name}
              </Typography>
              <Fab
                size="small"
                color="primary"
                onClick={() => {
                  onAction(action.key);
                  setOpen(false);
                }}
                sx={{ boxShadow: 3 }}
              >
                {action.icon}
              </Fab>
            </Box>
          ))}
        </Box>
      </Slide>
      
      {/* Main FAB */}
      <Fab
        color="primary"
        onClick={() => setOpen(!open)}
        sx={{
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease-in-out',
          boxShadow: 4
        }}
      >
        {open ? <CloseIcon /> : <AddIcon />}
      </Fab>
    </Box>
  );
};

// Main Mobile Field Manager
const MobileFieldManager = ({ 
  fields = [], 
  onFieldUpdate, 
  onFieldAdd,
  isOffline = false 
}) => {
  const [selectedField, setSelectedField] = useState(null);
  const [viewMode, setViewMode] = useState(0); // 0: List, 1: Map
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Simulate sync progress
  useEffect(() => {
    if (!isOffline && syncProgress > 0 && syncProgress < 100) {
      const timer = setTimeout(() => setSyncProgress(syncProgress + 10), 200);
      return () => clearTimeout(timer);
    }
  }, [syncProgress, isOffline]);

  const handleFieldTap = (field) => {
    setSelectedField(field);
    setDialogOpen(true);
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'add':
        onFieldAdd?.();
        break;
      case 'camera':
        setCameraDialogOpen(true);
        break;
      case 'location':
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Current location:', position.coords);
              // Handle location data
            },
            (error) => console.error('Location error:', error)
          );
        }
        break;
      case 'sync':
        if (!isOffline) {
          setSyncProgress(10);
        }
        break;
    }
  };

  const handleNavigateToField = (field) => {
    if (field.coordinates) {
      const { lat, lng } = field.coordinates;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  const handleCapturePhoto = (field) => {
    // Camera functionality
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          setCameraDialogOpen(true);
          // Handle camera stream
        })
        .catch(err => console.error('Camera access denied:', err));
    }
  };

  if (!isMobile) {
    return null; // Return desktop version
  }

  return (
    <Box sx={{ pb: 10 }}>
      {/* Sync indicator */}
      {syncProgress > 0 && syncProgress < 100 && (
        <Box sx={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 1200 }}>
          <LinearProgress 
            variant="determinate" 
            value={syncProgress} 
            sx={{ height: 4 }}
          />
        </Box>
      )}
      
      {/* Offline indicator */}
      {isOffline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You're offline. Changes will sync when connection is restored.
        </Alert>
      )}
      
      {/* View mode tabs */}
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={viewMode}
          onChange={(e, newValue) => setViewMode(newValue)}
          variant="fullWidth"
          indicatorColor="primary"
        >
          <Tab label="List View" />
          <Tab label="Map View" />
        </Tabs>
      </Box>
      
      {/* Field list */}
      <SwipeableViews
        index={viewMode}
        onChangeIndex={setViewMode}
        disabled={true}
      >
        {/* List View */}
        <Box sx={{ px: 1 }}>
          {fields.map((field) => (
            <MobileFieldCard
              key={field.id}
              field={field}
              onTap={handleFieldTap}
              onNavigate={handleNavigateToField}
              onCapture={handleCapturePhoto}
              isOffline={isOffline}
            />
          ))}
          
          {fields.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <FieldIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No fields added yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tap the + button to add your first field
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Map View */}
        <Box sx={{ px: 1, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Map view would be implemented here with field locations
          </Typography>
        </Box>
      </SwipeableViews>
      
      {/* Quick Actions FAB */}
      <MobileQuickActions onAction={handleQuickAction} />
      
      {/* Field Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullScreen
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' }}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDialogOpen(false)}
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
              {selectedField?.name}
            </Typography>
            <Button color="inherit" onClick={() => setDialogOpen(false)}>
              Done
            </Button>
          </Toolbar>
        </AppBar>
        
        <Box sx={{ p: 2 }}>
          {selectedField && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Field Details
              </Typography>
              <Typography variant="body1" paragraph>
                Health: {selectedField.health}% • NDVI: {selectedField.ndvi}
              </Typography>
              <Typography variant="body1" paragraph>
                Growth Stage: {selectedField.growthStage}
              </Typography>
              <Typography variant="body1" paragraph>
                Status: {selectedField.status}
              </Typography>
              {/* Add more field details as needed */}
            </Box>
          )}
        </Box>
      </Dialog>
      
      {/* Camera Dialog */}
      <Dialog
        open={cameraDialogOpen}
        onClose={() => setCameraDialogOpen(false)}
        fullScreen
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setCameraDialogOpen(false)}
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
              Camera
            </Typography>
            <Button color="inherit">
              Capture
            </Button>
          </Toolbar>
        </AppBar>
        
        <Box sx={{ p: 2, textAlign: 'center', pt: 10 }}>
          <CameraIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Camera interface would be implemented here
          </Typography>
        </Box>
      </Dialog>
    </Box>
  );
};

export default MobileFieldManager;
export { MobileFieldCard, MobileQuickActions };
