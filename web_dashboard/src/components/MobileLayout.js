import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Fab,
  Badge,
  SwipeableDrawer,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Agriculture as FieldIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon,
  CloudOff as OfflineIcon,
  MyLocation as LocationIcon,
  CameraAlt as CameraIcon,
  Assessment as ReportsIcon,
  Warning as AlertIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';

// Service Worker Registration
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// PWA Installation Prompt
const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowInstall(false);
    }
  };

  if (!showInstall) return null;

  return (
    <Chip
      label="Install App"
      onClick={handleInstallClick}
      color="primary"
      sx={{ position: 'fixed', top: 80, right: 16, zIndex: 1300 }}
    />
  );
};

// Mobile Navigation Component
const MobileNavigation = ({ 
  activeTab, 
  onTabChange, 
  notifications = 0,
  connectionStatus = 'online'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navigationItems = [
    { label: 'Dashboard', value: 'dashboard', icon: <DashboardIcon /> },
    { label: 'Fields', value: 'fields', icon: <FieldIcon /> },
    { 
      label: 'Alerts', 
      value: 'notifications', 
      icon: (
        <Badge badgeContent={notifications} color="error">
          <NotificationIcon />
        </Badge>
      )
    },
    { label: 'Reports', value: 'reports', icon: <ReportsIcon /> },
    { label: 'Settings', value: 'settings', icon: <SettingsIcon /> }
  ];

  if (!isMobile) return null;

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1300,
        borderTop: `1px solid ${theme.palette.divider}`
      }} 
      elevation={8}
    >
      <BottomNavigation
        value={activeTab}
        onChange={(event, newValue) => onTabChange(newValue)}
        showLabels
        sx={{ height: 70 }}
      >
        {navigationItems.map((item) => (
          <BottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            icon={item.icon}
            sx={{
              minWidth: 'auto',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem'
              }
            }}
          />
        ))}
      </BottomNavigation>
      
      {/* Connection Status Indicator */}
      {connectionStatus === 'offline' && (
        <Box
          sx={{
            position: 'absolute',
            top: -24,
            left: 8,
            right: 8,
            height: 24,
            bgcolor: 'warning.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px 4px 0 0'
          }}
        >
          <OfflineIcon sx={{ fontSize: 16, mr: 1 }} />
          <Typography variant="caption" color="white">
            Offline Mode
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

// Mobile App Header
const MobileAppHeader = ({ 
  title, 
  onMenuClick, 
  showBackButton = false,
  onBackClick,
  actions = []
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) return null;

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        bgcolor: 'primary.main'
      }}
    >
      <Toolbar sx={{ minHeight: '56px !important' }}>
        {!showBackButton ? (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuClick}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          <IconButton
            edge="start"
            color="inherit"
            onClick={onBackClick}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        
        <Typography variant="h6" sx={{ flexGrow: 1, ml: 1 }}>
          {title}
        </Typography>
        
        {actions.map((action, index) => (
          <IconButton
            key={index}
            color="inherit"
            onClick={action.onClick}
          >
            {action.icon}
          </IconButton>
        ))}
      </Toolbar>
    </AppBar>
  );
};

// Touch-Optimized Field Card
const TouchFieldCard = ({ 
  field, 
  onTap, 
  onLongPress,
  showActions = true 
}) => {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now()
    });
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStart.time;
    
    if (touchDuration > 500) {
      // Long press
      onLongPress && onLongPress(field);
    } else {
      // Short tap
      onTap && onTap(field);
    }
    
    setTouchStart(null);
  };

  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      sx={{
        p: 2,
        mb: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 2,
        border: field.status === 'critical' ? '2px solid' : '1px solid',
        borderColor: field.status === 'critical' ? 'error.main' : 'divider',
        cursor: 'pointer',
        '&:active': {
          transform: 'scale(0.98)',
          bgcolor: 'action.selected'
        },
        transition: 'all 0.1s ease-in-out'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Avatar
          sx={{
            bgcolor: field.health > 90 ? 'success.main' : 
                     field.health > 70 ? 'warning.main' : 'error.main',
            width: 40,
            height: 40,
            mr: 2
          }}
        >
          <FieldIcon />
        </Avatar>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {field.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {field.area} acres • {field.crop}
          </Typography>
        </Box>
        
        {field.alerts > 0 && (
          <Badge badgeContent={field.alerts} color="error">
            <AlertIcon color="warning" />
          </Badge>
        )}
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Chip
          label={`Health: ${field.health}%`}
          color={field.health > 90 ? 'success' : field.health > 70 ? 'warning' : 'error'}
          size="small"
        />
        <Chip
          label={`NDVI: ${field.ndvi}`}
          variant="outlined"
          size="small"
        />
        <Chip
          label={field.status}
          color={field.status === 'critical' ? 'error' : 'default'}
          size="small"
        />
      </Box>
      
      {showActions && (
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <IconButton size="small" color="primary">
            <LocationIcon />
          </IconButton>
          <IconButton size="small" color="primary">
            <CameraIcon />
          </IconButton>
          <IconButton size="small" color="primary">
            <ReportsIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

// Floating Action Button for Quick Actions
const QuickActionsFAB = ({ onActionSelect }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const actions = [
    { label: 'Take Photo', icon: <CameraIcon />, action: 'camera' },
    { label: 'GPS Location', icon: <LocationIcon />, action: 'location' },
    { label: 'Emergency Alert', icon: <AlertIcon />, action: 'alert' }
  ];

  if (!isMobile) return null;

  return (
    <Box sx={{ position: 'fixed', bottom: 90, right: 16, zIndex: 1200 }}>
      {open && (
        <Box sx={{ mb: 1 }}>
          {actions.map((action, index) => (
            <Box key={index} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="caption"
                sx={{
                  bgcolor: 'background.paper',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  mr: 1,
                  boxShadow: 1
                }}
              >
                {action.label}
              </Typography>
              <Fab
                size="small"
                color="primary"
                onClick={() => {
                  onActionSelect(action.action);
                  setOpen(false);
                }}
              >
                {action.icon}
              </Fab>
            </Box>
          ))}
        </Box>
      )}
      
      <Fab
        color="primary"
        onClick={() => setOpen(!open)}
        sx={{
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        {open ? <CloseIcon /> : <AddIcon />}
      </Fab>
    </Box>
  );
};

// Main Mobile Layout Component
const MobileLayout = ({ 
  children, 
  activeTab, 
  onTabChange,
  title = "Potato Crop AI",
  notifications = 0,
  connectionStatus = 'online'
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    registerServiceWorker();
  }, []);

  const handleQuickAction = (action) => {
    switch (action) {
      case 'camera':
        // Implement camera functionality
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
              console.log('Camera access granted');
              // Handle camera stream
            })
            .catch(err => console.log('Camera access denied', err));
        }
        break;
      case 'location':
        // Get GPS location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            position => {
              console.log('Location:', position.coords);
            },
            error => console.log('Location error:', error)
          );
        }
        break;
      case 'alert':
        // Send emergency alert
        console.log('Emergency alert triggered');
        break;
    }
  };

  if (!isMobile) {
    return children;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <PWAInstallPrompt />
      
      <MobileAppHeader
        title={title}
        onMenuClick={() => setDrawerOpen(true)}
        actions={[
          {
            icon: <Badge badgeContent={notifications} color="error">
              <NotificationIcon />
            </Badge>,
            onClick: () => onTabChange('notifications')
          }
        ]}
      />
      
      {/* Side Drawer for Navigation */}
      <SwipeableDrawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpen={() => setDrawerOpen(true)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            pt: 7
          }
        }}
      >
        <List>
          {[
            { text: 'Dashboard', icon: <DashboardIcon />, value: 'dashboard' },
            { text: 'My Fields', icon: <FieldIcon />, value: 'fields' },
            { text: 'Notifications', icon: <NotificationIcon />, value: 'notifications' },
            { text: 'Reports', icon: <ReportsIcon />, value: 'reports' },
            { text: 'Settings', icon: <SettingsIcon />, value: 'settings' }
          ].map((item) => (
            <ListItem 
              button 
              key={item.text}
              selected={activeTab === item.value}
              onClick={() => {
                onTabChange(item.value);
                setDrawerOpen(false);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </SwipeableDrawer>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 7,
          pb: 10,
          px: 2,
          bgcolor: 'background.default'
        }}
      >
        {children}
      </Box>
      
      {/* Bottom Navigation */}
      <MobileNavigation
        activeTab={activeTab}
        onTabChange={onTabChange}
        notifications={notifications}
        connectionStatus={connectionStatus}
      />
      
      {/* Quick Actions FAB */}
      <QuickActionsFAB onActionSelect={handleQuickAction} />
    </Box>
  );
};

export default MobileLayout;
export { TouchFieldCard, MobileNavigation, PWAInstallPrompt };
