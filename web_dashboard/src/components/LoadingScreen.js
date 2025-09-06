import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  textAlign: 'center',
  animation: `${fadeIn} 0.8s ease-out`,
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  fontSize: '4rem',
  marginBottom: theme.spacing(2),
  animation: `${fadeIn} 1s ease-out 0.3s both`,
}));

const TitleContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  animation: `${fadeIn} 1s ease-out 0.6s both`,
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  animation: `${fadeIn} 1s ease-out 0.9s both`,
}));

function LoadingScreen() {
  return (
    <LoadingContainer>
      <LogoContainer>
        🥔🛰️🤖
      </LogoContainer>
      
      <TitleContainer>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Potato Crop AI
        </Typography>
        <Typography variant="h6" component="h2" sx={{ opacity: 0.9 }}>
          AI-Powered Growth Stage & Nutrient Management
        </Typography>
      </TitleContainer>
      
      <ProgressContainer>
        <CircularProgress 
          size={60} 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: 2
          }} 
        />
        <Typography variant="body1" sx={{ opacity: 0.8 }}>
          Initializing satellite data processing...
        </Typography>
      </ProgressContainer>
    </LoadingContainer>
  );
}

export default LoadingScreen;
