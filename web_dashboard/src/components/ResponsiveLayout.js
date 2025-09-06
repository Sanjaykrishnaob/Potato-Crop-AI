import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  useTheme,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Fab,
  Badge,
  Container,
  CssBaseline,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Agriculture as FieldIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationIcon,
  Close as CloseIcon,
  MyLocation as LocationIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import useResponsive from '../hooks/useResponsive';
import Sidebar from './Sidebar';

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'sidebarWidth' && prop !== 'isMobile',
})(({ theme, sidebarWidth, isMobile }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...((!isMobile && sidebarWidth > 0) && {
    marginLeft: sidebarWidth,
    width: `calc(100% - ${sidebarWidth}px)`,
  }),
}));

const MainContent = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'sidebarWidth' && prop !== 'headerHeight' && prop !== 'isMobile',
})(({ theme, sidebarWidth, headerHeight, isMobile }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginTop: headerHeight,
  ...((!isMobile && sidebarWidth > 0) && {
    marginLeft: sidebarWidth,
    width: `calc(100% - ${sidebarWidth}px)`,
  }),
  ...(isMobile && {
    marginBottom: 56, // Space for bottom navigation
    padding: theme.spacing(1),
  }),
}));

const MobileBottomNav = styled(BottomNavigation)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.appBar,
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const ResponsiveLayout = ({ children, currentRoute = 'dashboard', onRouteChange }) => {
  const theme = useTheme();
  const { 
    deviceType, 
    isMobile, 
    isTablet, 
    layoutConfig, 
    componentSizes 
  } = useResponsive();
  
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [bottomNavValue, setBottomNavValue] = useState(currentRoute);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'fields', label: 'Fields', icon: FieldIcon },
    { id: 'reports', label: 'Reports', icon: ReportsIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleMobileDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const handleBottomNavChange = (event, newValue) => {
    setBottomNavValue(newValue);
    if (onRouteChange) {
      onRouteChange(newValue);
    }
  };

  const handleRouteChange = (route) => {
    setBottomNavValue(route);
    if (onRouteChange) {
      onRouteChange(route);
    }
    // Close mobile drawer if open
    if (mobileDrawerOpen) {
      setMobileDrawerOpen(false);
    }
  };

  // Mobile Header
  const MobileHeader = () => (
    <StyledAppBar 
      position="fixed" 
      sidebarWidth={0} 
      isMobile={true}
      sx={{ 
        height: layoutConfig.headerHeight,
        background: 'linear-gradient(135deg, #1a365d 0%, #2d5016 50%, #2e7d32 100%)',
      }}
    >
      <Toolbar sx={{ minHeight: layoutConfig.headerHeight, px: 1 }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={handleMobileDrawerToggle}
          sx={{ mr: 1 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography 
            variant={deviceType === 'small-mobile' ? 'body1' : 'h6'} 
            component="h1"
            sx={{ fontWeight: 'bold' }}
          >
            🥔 Potato AI
          </Typography>
        </Box>

        <IconButton color="inherit" size="small">
          <Badge badgeContent={3} color="error">
            <NotificationIcon />
          </Badge>
        </IconButton>
      </Toolbar>
    </StyledAppBar>
  );

  // Desktop Header
  const DesktopHeader = () => (
    <StyledAppBar 
      position="fixed" 
      sidebarWidth={layoutConfig.sidebarWidth} 
      isMobile={false}
      sx={{ 
        height: layoutConfig.headerHeight,
        background: 'linear-gradient(135deg, #1a365d 0%, #2d5016 50%, #2e7d32 100%)',
      }}
    >
      <Toolbar sx={{ minHeight: layoutConfig.headerHeight }}>
        <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          🥔 Potato Crop AI Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton color="inherit">
            <Badge badgeContent={3} color="error">
              <NotificationIcon />
            </Badge>
          </IconButton>
          
          <IconButton color="inherit">
            <LocationIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </StyledAppBar>
  );

  // Mobile Drawer
  const MobileDrawer = () => (
    <Drawer
      variant="temporary"
      anchor="left"
      open={mobileDrawerOpen}
      onClose={handleMobileDrawerToggle}
      ModalProps={{ keepMounted: true }}
      sx={{
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: 280,
          background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        <Box sx={{ 
          p: 2, 
          background: 'linear-gradient(135deg, #1a365d 0%, #2d5016 50%, #2e7d32 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            🥔 Potato AI
          </Typography>
          <IconButton 
            color="inherit" 
            onClick={handleMobileDrawerToggle}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Sidebar 
          currentRoute={currentRoute} 
          onRouteChange={handleRouteChange}
          isMobile={true}
        />
      </Box>
    </Drawer>
  );

  // Bottom Navigation for Mobile
  const BottomNav = () => (
    <MobileBottomNav
      value={bottomNavValue}
      onChange={handleBottomNavChange}
      showLabels
    >
      {navigationItems.map((item) => (
        <BottomNavigationAction
          key={item.id}
          label={item.label}
          value={item.id}
          icon={<item.icon />}
        />
      ))}
    </MobileBottomNav>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Header */}
      {isMobile ? <MobileHeader /> : <DesktopHeader />}
      
      {/* Sidebar for Desktop/Tablet */}
      {!isMobile && layoutConfig.showSidebar && (
        <Drawer
          variant="permanent"
          sx={{
            width: layoutConfig.sidebarWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: layoutConfig.sidebarWidth,
              boxSizing: 'border-box',
              background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRight: '1px solid rgba(0,0,0,0.12)',
            },
          }}
        >
          <Toolbar sx={{ minHeight: layoutConfig.headerHeight }} />
          <Sidebar 
            currentRoute={currentRoute} 
            onRouteChange={onRouteChange}
            isMobile={false}
          />
        </Drawer>
      )}

      {/* Mobile Drawer */}
      {isMobile && <MobileDrawer />}

      {/* Main Content */}
      <MainContent
        component="main"
        sidebarWidth={layoutConfig.showSidebar ? layoutConfig.sidebarWidth : 0}
        headerHeight={layoutConfig.headerHeight}
        isMobile={isMobile}
        sx={{
          padding: layoutConfig.contentPadding / 8, // Convert to theme spacing
          backgroundColor: '#f5f5f5',
          minHeight: `calc(100vh - ${layoutConfig.headerHeight}px)`,
        }}
      >
        <Container 
          maxWidth={false}
          sx={{
            px: { xs: 1, sm: 2, md: 3 },
            py: { xs: 1, sm: 2 },
          }}
        >
          {children}
        </Container>
      </MainContent>

      {/* Bottom Navigation for Mobile */}
      {isMobile && layoutConfig.bottomNavigation && <BottomNav />}

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <Fab
          size="small"
          sx={{
            position: 'fixed',
            bottom: isMobile ? 72 : 16,
            right: 16,
            zIndex: theme.zIndex.tooltip,
            opacity: 0.7,
          }}
          onClick={() => console.log({ deviceType, layoutConfig, componentSizes })}
        >
          📱
        </Fab>
      )}
    </Box>
  );
};

export default ResponsiveLayout;
