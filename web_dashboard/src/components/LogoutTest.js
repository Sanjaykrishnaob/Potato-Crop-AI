import React from 'react';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function LogoutTest() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      console.log('🔐 Testing logout...');
      await logout();
      console.log('✅ Logout successful, should redirect to login');
      navigate('/login');
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            🔐 Logout Test Page
          </Typography>
          
          {currentUser ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              ✅ You are currently logged in as: {currentUser.email}
            </Alert>
          ) : (
            <Alert severity="warning" sx={{ mb: 3 }}>
              ⚠️ You are not logged in
            </Alert>
          )}
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            This page tests the logout functionality. Click the button below to logout.
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleLogout}
            disabled={!currentUser}
            sx={{ mr: 2 }}
          >
            Test Logout
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

export default LogoutTest;
