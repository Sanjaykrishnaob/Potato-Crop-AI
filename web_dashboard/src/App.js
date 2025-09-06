import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CssBaseline } from '@mui/material';

// Components
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LoadingScreen from './components/LoadingScreen';
import NotificationSystem from './components/NotificationSystem';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Context Providers
import { LocationProvider } from './contexts/LocationContext';
import { AuthProvider } from './contexts/AuthContext';

// Hooks
import { useNotifications } from './hooks/useApi';

// Pages
import Dashboard from './pages/Dashboard';
import FieldAnalysis from './pages/FieldAnalysis';
import Recommendations from './pages/Recommendations';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import TaskManagement from './pages/TaskManagement';
import UserProfile from './pages/UserProfile';
import FirebaseTest from './components/FirebaseTest';
import AuthDebug from './components/AuthDebug';
import LogoutTest from './components/LogoutTest';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32',
      light: '#60ad5e',
      dark: '#005005',
    },
    secondary: {
      main: '#1a365d',
      light: '#4a5568',
      dark: '#1a202c',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  // Notification system
  const { notifications, addNotification, removeNotification, clearAll } = useNotifications();

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setLoading(false);
      // Add welcome notification
      addNotification({
        type: 'success',
        title: '🌱 Welcome to Potato Crop AI',
        message: 'System initialized successfully. All monitoring systems active.',
        priority: 'Low'
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [addNotification]);

  useEffect(() => {
    // Close mobile sidebar on route change
    setMobileOpen(false);
  }, [location]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <LocationProvider>
          <Box sx={{ display: 'flex' }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/firebase-test" element={<FirebaseTest />} />
              <Route path="/auth-debug" element={<AuthDebug />} />
              <Route path="/logout-test" element={<LogoutTest />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Sidebar 
                      open={sidebarOpen}
                      mobileOpen={mobileOpen}
                      onMobileToggle={handleMobileToggle}
                    />
                    
                    <Box 
                      component="main" 
                      sx={{ 
                        flexGrow: 1, 
                        ml: sidebarOpen ? { xs: 0, sm: '280px' } : 0,
                        transition: 'margin 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms',
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <TopBar 
                        onSidebarToggle={handleSidebarToggle}
                        onMobileToggle={handleMobileToggle}
                        notifications={notifications}
                        onClearNotifications={clearAll}
                      />
                      
                      {/* Toolbar spacer for fixed AppBar */}
                      <Box sx={{ 
                        height: { xs: '56px', sm: '64px' },
                        flexShrink: 0 
                      }} />
                      
                      <Box sx={{ 
                        flex: 1,
                        p: { xs: 1.5, sm: 2.5, md: 3.5 },
                        pt: { xs: 2, sm: 3, md: 4 }, // Reset to normal padding since we have the spacer
                        maxWidth: '100%',
                        mx: 'auto',
                        width: '100%',
                        overflow: 'hidden',
                        minHeight: 'calc(100vh - 64px)' // Account for TopBar height
                      }}>
                        <Routes>
                          <Route path="/" element={<Dashboard addNotification={addNotification} />} />
                          <Route path="/dashboard" element={<Dashboard addNotification={addNotification} />} />
                          <Route path="/field-analysis" element={<FieldAnalysis addNotification={addNotification} />} />
                          <Route path="/recommendations" element={<Recommendations addNotification={addNotification} />} />
                          <Route path="/tasks" element={<TaskManagement addNotification={addNotification} />} />
                          <Route path="/analytics" element={<Analytics addNotification={addNotification} />} />
                          <Route path="/profile" element={<UserProfile addNotification={addNotification} />} />
                          <Route path="/settings" element={<Settings addNotification={addNotification} />} />
                        </Routes>
                      </Box>
                      
                      {/* Notification System */}
                      <NotificationSystem
                        notifications={notifications}
                        onRemove={removeNotification}
                        onClearAll={clearAll}
                      />
                    </Box>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Box>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
