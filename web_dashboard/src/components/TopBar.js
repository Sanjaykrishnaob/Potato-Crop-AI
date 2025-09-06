import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  useMediaQuery,
  useTheme,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Refresh as RefreshIcon,
  CloudDownload as CloudIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import WeatherWidget from './WeatherWidget';
import { useLocation } from '../contexts/LocationContext';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
  color: theme.palette.text.primary,
  zIndex: theme.zIndex.drawer + 1,
}));

const StatusIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    display: 'none',
  },
}));

const WeatherContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  borderRadius: '20px',
  background: 'rgba(46, 139, 87, 0.1)',
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

function TopBar({ onSidebarToggle, onMobileToggle }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { currentUser, userProfile, logout } = useAuth();
  const { currentLocation } = useLocation();

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleProfileMenuClose();
  };

  const handleSettingsClick = () => {
    navigate('/settings');
    handleProfileMenuClose();
  };

  const handleLogout = async () => {
    try {
      console.log('🔐 Attempting logout...'); // Debug log
      await logout();
      console.log('✅ Logout successful, redirecting to login...'); // Debug log
      handleProfileMenuClose();
      // Force navigation to login page
      navigate('/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const handleRefresh = () => {
    // Simulate data refresh
    window.location.reload();
  };

  // Sample notifications
  const notifications = [
    {
      id: 1,
      title: 'New Satellite Data Available',
      message: 'Sentinel-2 imagery updated for Field #001',
      time: '5 minutes ago',
      type: 'info'
    },
    {
      id: 2,
      title: 'Nitrogen Deficiency Detected',
      message: 'Zone 3 requires immediate fertilization',
      time: '15 minutes ago',
      type: 'warning'
    },
    {
      id: 3,
      title: 'Growth Stage Updated',
      message: 'Field #002 entered Tuber Bulking stage',
      time: '1 hour ago',
      type: 'success'
    }
  ];

  return (
    <StyledAppBar position="fixed">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={isMobile ? onMobileToggle : onSidebarToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            display: { xs: 'none', sm: 'block' }
          }}
        >
          Potato Crop Management Dashboard
        </Typography>

        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 600,
            display: { xs: 'block', sm: 'none' }
          }}
        >
          🥔 Crop AI
        </Typography>

        <StatusIndicator>
          <WeatherWidget compact={false} showLocation={!isMobile} />

          <Chip
            icon={<CloudIcon />}
            label="Satellite: Online"
            size="small"
            color="success"
            variant="outlined"
          />

          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            size="small"
            sx={{ 
              textTransform: 'none',
              display: { xs: 'none', md: 'flex' }
            }}
          >
            Refresh Data
          </Button>
        </StatusIndicator>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            color="inherit"
            onClick={handleNotificationOpen}
          >
            <Badge badgeContent={notifications.length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton
            edge="end"
            color="inherit"
            onClick={handleProfileMenuOpen}
          >
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'primary.main' 
              }}
            >
              {currentUser?.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                userProfile?.name?.charAt(0)?.toUpperCase() || 'F'
              )}
            </Avatar>
          </IconButton>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleProfileMenuClose}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" fontWeight="medium">
                {userProfile?.name || currentUser?.displayName || 'Farmer'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {currentUser?.email || 'No email'}
              </Typography>
              {userProfile?.farmName && (
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  🏢 {userProfile.farmName}
                </Typography>
              )}
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleProfileClick}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleSettingsClick}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: { width: 320, maxHeight: 400 }
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
            <Typography variant="h6" fontWeight="bold">
              Notifications
            </Typography>
          </Box>
          {notifications.map((notification) => (
            <MenuItem 
              key={notification.id} 
              onClick={handleNotificationClose}
              sx={{ 
                display: 'block', 
                py: 1.5,
                borderBottom: '1px solid #f5f5f5'
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight="medium" gutterBottom>
                  {notification.title}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }} gutterBottom>
                  {notification.message}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  {notification.time}
                </Typography>
              </Box>
            </MenuItem>
          ))}
          <MenuItem sx={{ justifyContent: 'center' }}>
            <Typography variant="body2" color="primary">
              View All Notifications
            </Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </StyledAppBar>
  );
}

export default TopBar;
