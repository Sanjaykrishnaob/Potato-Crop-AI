import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  Typography,
  Divider,
  Avatar,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Agriculture as AgricultureIcon,
  Recommend as RecommendIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Satellite as SatelliteIcon,
  WaterDrop as WaterIcon,
  Assignment as TaskIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const DrawerContainer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 280,
    background: 'linear-gradient(145deg, #1e3c72 0%, #2a5298 100%)',
    color: 'white',
    borderRight: 'none',
    overflow: 'hidden',
  },
}));

const CollapsedDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: 80,
    background: 'linear-gradient(145deg, #1e3c72 0%, #2a5298 100%)',
    color: 'white',
    borderRight: 'none',
    overflow: 'hidden',
  },
}));

const LogoSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 2),
  textAlign: 'center',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  marginBottom: theme.spacing(2),
  minHeight: '80px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
}));

const NavigationList = styled(List)(({ theme }) => ({
  padding: theme.spacing(0, 1),
}));

const StyledListItemButton = styled(ListItemButton)(({ theme, active }) => ({
  borderRadius: '12px',
  margin: theme.spacing(0.5, 0),
  padding: theme.spacing(1.5, 2),
  minHeight: '56px', // Ensure consistent height
  background: active ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
  backdropFilter: active ? 'blur(10px)' : 'none',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  transition: 'all 0.3s ease',
  display: 'flex',
  alignItems: 'center',
}));

const StatusSection = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
}));

const menuItems = [
  { 
    path: '/dashboard', 
    label: 'Dashboard', 
    icon: <DashboardIcon />,
    description: 'Overview & Status'
  },
  { 
    path: '/field-analysis', 
    label: 'Field Analysis', 
    icon: <AgricultureIcon />,
    description: 'Satellite Imagery & Zones'
  },
  { 
    path: '/tasks', 
    label: 'Task Management', 
    icon: <TaskIcon />,
    description: 'To-Do List & Alerts'
  },
  { 
    path: '/recommendations', 
    label: 'Recommendations', 
    icon: <RecommendIcon />,
    description: 'AI Suggestions'
  },
  { 
    path: '/analytics', 
    label: 'Analytics', 
    icon: <AnalyticsIcon />,
    description: 'Performance Metrics'
  },
  { 
    path: '/profile', 
    label: 'Profile', 
    icon: <PersonIcon />,
    description: 'Account & Farm Details'
  },
  { 
    path: '/settings', 
    label: 'Settings', 
    icon: <SettingsIcon />,
    description: 'Configuration'
  },
];

function Sidebar({ open, mobileOpen, onMobileToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      onMobileToggle();
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <LogoSection>
        {open && (
          <>
            <Box sx={{ fontSize: '2.5rem', mb: 1, lineHeight: 1 }}>
              🥔🛰️
            </Box>
            <Typography 
              variant="h6" 
              fontWeight="bold" 
              sx={{ 
                mb: 0.5, 
                fontSize: '1.1rem',
                lineHeight: 1.2
              }}
            >
              Potato Crop AI
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                opacity: 0.8,
                fontSize: '0.75rem',
                lineHeight: 1.1
              }}
            >
              Smart Agriculture Platform
            </Typography>
          </>
        )}
        {!open && (
          <Box sx={{ fontSize: '2rem' }}>
            🥔
          </Box>
        )}
      </LogoSection>

      <NavigationList>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <StyledListItemButton
              active={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon sx={{ 
                color: 'white', 
                minWidth: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {item.icon}
              </ListItemIcon>
              {open && (
                <ListItemText
                  primary={item.label}
                  secondary={item.description}
                  primaryTypographyProps={{
                    sx: { 
                      fontSize: '0.95rem', 
                      fontWeight: 500,
                      lineHeight: 1.2,
                      mb: 0.3
                    }
                  }}
                  secondaryTypographyProps={{
                    sx: { 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      fontSize: '0.75rem',
                      lineHeight: 1.1
                    }
                  }}
                />
              )}
            </StyledListItemButton>
          </ListItem>
        ))}
      </NavigationList>

      {open && (
        <StatusSection>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ width: 32, height: 32, mr: 1.5, bgcolor: 'success.main' }}>
              <SatelliteIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                System Status
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                All systems operational
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip 
              label="Satellite: Online" 
              size="small" 
              sx={{ 
                bgcolor: 'success.main', 
                color: 'white',
                fontSize: '0.7rem'
              }} 
            />
            <Chip 
              label="AI: Active" 
              size="small" 
              sx={{ 
                bgcolor: 'info.main', 
                color: 'white',
                fontSize: '0.7rem'
              }} 
            />
          </Box>
          
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            Last Update: {new Date().toLocaleTimeString()}
          </Typography>
        </StatusSection>
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            background: 'linear-gradient(145deg, #1e3c72 0%, #2a5298 100%)',
            color: 'white',
            borderRight: 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  const DrawerComponent = open ? DrawerContainer : CollapsedDrawer;

  return (
    <DrawerComponent
      variant="permanent"
      open={open}
      sx={{
        display: { xs: 'none', md: 'block' },
      }}
    >
      {drawerContent}
    </DrawerComponent>
  );
}

export default Sidebar;
