import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Chip,
  CircularProgress,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  Agriculture as AgricultureIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';

const LoginContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  width: '100vw',
  height: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 9999,
  overflow: 'auto',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1),
    alignItems: 'flex-start',
    paddingTop: theme.spacing(4),
  },
  [theme.breakpoints.down(480)]: {
    padding: theme.spacing(0.5),
    paddingTop: theme.spacing(2),
  },
  '&::before': {
    content: '""',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    backgroundImage: `
      linear-gradient(135deg, rgba(26, 54, 93, 0.7) 0%, rgba(45, 80, 22, 0.7) 50%, rgba(46, 125, 50, 0.7) 100%),
      url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')
    `,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed',
    zIndex: -1,
  },
}));

const LoginCard = styled(Card)(({ theme }) => ({
  maxWidth: 550,
  width: '100%',
  borderRadius: '24px',
  boxShadow: '0 32px 64px rgba(0,0,0,0.2), 0 16px 32px rgba(0,0,0,0.1)',
  overflow: 'visible',
  position: 'relative',
  zIndex: 10,
  backdropFilter: 'blur(20px)',
  background: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  transition: 'all 0.3s ease',
  margin: 'auto',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 40px 80px rgba(0,0,0,0.25), 0 20px 40px rgba(0,0,0,0.15)',
  },
  [theme.breakpoints.down('sm')]: {
    maxWidth: '95%',
    margin: 'auto',
    borderRadius: '16px',
    boxShadow: '0 16px 32px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.1)',
    '&:hover': {
      transform: 'translateY(-4px)',
    },
  },
  [theme.breakpoints.down(480)]: {
    maxWidth: '98%',
    borderRadius: '12px',
    '&:hover': {
      transform: 'translateY(-2px)',
    },
  },
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1a365d 0%, #2d5016 50%, #2e7d32 100%)',
  color: 'white',
  padding: theme.spacing(4, 3, 3),
  textAlign: 'center',
  borderRadius: '24px 24px 0 0',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.03) 2px,
        rgba(255, 255, 255, 0.03) 4px
      )
    `,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
    borderRadius: '50%',
  },
}));

const GoogleButton = styled(Button)(({ theme }) => ({
  borderColor: '#4285f4',
  color: '#4285f4',
  background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.05) 0%, rgba(66, 133, 244, 0.1) 100%)',
  backdropFilter: 'blur(10px)',
  border: '2px solid rgba(66, 133, 244, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #4285f4 0%, #357ae8 100%)',
    color: 'white',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(66, 133, 244, 0.3)',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    position: 'relative',
    zIndex: 1,
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.98)',
      transform: 'translateY(-1px)',
    },
    '&.Mui-focused': {
      background: 'rgba(255, 255, 255, 1)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(46, 125, 50, 0.15)',
      backdropFilter: 'none',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
    position: 'relative',
    zIndex: 2,
    '&.Mui-focused': {
      color: '#2e7d32',
    },
  },
  '& .MuiOutlinedInput-input': {
    position: 'relative',
    zIndex: 3,
    backgroundColor: 'transparent !important',
    color: 'inherit',
    '&::placeholder': {
      opacity: 0.7,
      color: 'inherit',
    },
    '&:focus': {
      backgroundColor: 'transparent !important',
      outline: 'none',
    },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.23)',
    transition: 'border-color 0.3s ease',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(46, 125, 50, 0.5)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#2e7d32',
    borderWidth: 2,
  },
}));

const AnimatedButton = styled(Button)(({ theme }) => ({
  borderRadius: '16px',
  height: '56px',
  background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 50%, #66bb6a 100%)',
  boxShadow: '0 8px 25px rgba(46, 125, 50, 0.3)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    transition: 'left 0.5s ease',
  },
  '&:hover': {
    background: 'linear-gradient(135deg, #1b5e20 0%, #388e3c 50%, #4caf50 100%)',
    transform: 'translateY(-3px)',
    boxShadow: '0 12px 35px rgba(46, 125, 50, 0.4)',
    '&::before': {
      left: '100%',
    },
  },
  '&:active': {
    transform: 'translateY(-1px)',
  },
}));

function Login() {
  const { signin, signInWithGoogle, resetPassword, signup, error, setError, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  // Get the intended destination from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';
  
  // Add CSS to body for full screen
  useEffect(() => {
    // Store original styles
    const originalBodyStyle = {
      margin: document.body.style.margin,
      padding: document.body.style.padding,
      overflow: document.body.style.overflow,
      width: document.body.style.width,
      height: document.body.style.height
    };
    
    const originalHtmlStyle = {
      margin: document.documentElement.style.margin,
      padding: document.documentElement.style.padding,
      width: document.documentElement.style.width,
      height: document.documentElement.style.height
    };

    // Apply full screen styles to body and html
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';
    document.body.style.height = '100vh';
    
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100vh';
    
    return () => {
      // Restore original styles when component unmounts
      document.body.style.margin = originalBodyStyle.margin;
      document.body.style.padding = originalBodyStyle.padding;
      document.body.style.overflow = originalBodyStyle.overflow;
      document.body.style.width = originalBodyStyle.width;
      document.body.style.height = originalBodyStyle.height;
      
      document.documentElement.style.margin = originalHtmlStyle.margin;
      document.documentElement.style.padding = originalHtmlStyle.padding;
      document.documentElement.style.width = originalHtmlStyle.width;
      document.documentElement.style.height = originalHtmlStyle.height;
    };
  }, []);
  
  // Redirect if user is already authenticated
  useEffect(() => {
    if (currentUser) {
      console.log('🔄 User authenticated, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    farmName: '',
    location: '',
    phoneNumber: '',
    farmSize: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent React re-render issues during rapid typing
    setFormData(prev => {
      if (prev[name] === value) return prev;
      return {
        ...prev,
        [name]: value
      };
    });
    
    // Clear error when user starts typing with debounce
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Specific handler for location field to prevent glitching
  const handleLocationChange = (e) => {
    const value = e.target.value;
    
    // Use requestAnimationFrame to prevent UI blocking
    requestAnimationFrame(() => {
      setFormData(prev => ({
        ...prev,
        location: value
      }));
    });
    
    // Clear location error
    if (formErrors.location) {
      setFormErrors(prev => ({
        ...prev,
        location: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    // Registration specific validations
    if (!isLogin) {
      if (!formData.name) {
        errors.name = 'Name is required';
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
      
      if (!formData.farmName) {
        errors.farmName = 'Farm name is required';
      }
      
      if (!formData.location) {
        errors.location = 'Location is required';
      }
      
      if (!formData.phoneNumber) {
        errors.phoneNumber = 'Phone number is required';
      } else if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
        errors.phoneNumber = 'Please enter a valid 10-digit phone number';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        console.log('🔐 Attempting login...'); // Debug log
        await signin(formData.email, formData.password);
        console.log('✅ Login successful, redirecting...'); // Debug log
        // Navigation will be handled by useEffect when currentUser changes
      } else {
        console.log('📝 Attempting signup...'); // Debug log
        const additionalInfo = {
          name: formData.name,
          farmName: formData.farmName,
          location: formData.location,
          phoneNumber: formData.phoneNumber,
          farmSize: formData.farmSize,
          cropTypes: ['potato']
        };
        await signup(formData.email, formData.password, additionalInfo);
        console.log('✅ Signup successful, redirecting...'); // Debug log
        // Navigation will be handled by useEffect when currentUser changes
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await signInWithGoogle();
      console.log('✅ Google sign-in successful, redirecting...'); // Debug log
      // Navigation will be handled by useEffect when currentUser changes
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      setFormErrors({ email: 'Please enter your email address' });
      return;
    }
    
    try {
      await resetPassword(formData.email);
      setResetEmailSent(true);
    } catch (error) {
      console.error('Password reset error:', error);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setFormErrors({});
    setResetEmailSent(false);
  };

  return (
    <LoginContainer>
      <LoginCard>
        <HeaderSection>
          <Box sx={{ 
            fontSize: { xs: '3rem', sm: '4rem' }, 
            mb: { xs: 1.5, sm: 2 },
            animation: 'bounce 2s ease-in-out infinite',
            '@keyframes bounce': {
              '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
              '40%': { transform: 'translateY(-10px)' },
              '60%': { transform: 'translateY(-5px)' },
            }
          }}>
            🥔🛰️🤖
          </Box>
          <Typography variant="h3" fontWeight="bold" sx={{ 
            background: 'linear-gradient(45deg, #ffffff 30%, #e8f5e8 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            mb: { xs: 1, sm: 1.5 },
            lineHeight: { xs: 1.2, sm: 1.3 }
          }}>
            Potato Crop AI
          </Typography>
          <Typography variant="h6" sx={{ 
            opacity: 0.95,
            fontWeight: 400,
            fontSize: { xs: '0.8rem', sm: '1rem', md: '1.1rem' },
            lineHeight: { xs: 1.3, sm: 1.4 },
            mb: { xs: 2, sm: 2.5 }
          }}>
            Smart Agriculture Platform for Indian Farmers
          </Typography>
          <Box sx={{ 
            mt: { xs: 1.5, sm: 2.5, md: 3 }, 
            display: 'flex', 
            justifyContent: 'center', 
            gap: { xs: 0.5, sm: 1 },
            flexWrap: 'wrap',
            px: { xs: 1, sm: 0 }
          }}>
            <Chip 
              label="🛰️ Satellite AI" 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.25)', 
                color: 'white',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                fontWeight: 500,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: 24, sm: 32 },
                mb: { xs: 0.5, sm: 0 },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.35)',
                  transform: 'translateY(-2px)',
                }
              }} 
            />
            <Chip 
              label="🤖 ML Insights" 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.25)', 
                color: 'white',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                fontWeight: 500,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: 24, sm: 32 },
                mb: { xs: 0.5, sm: 0 },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.35)',
                  transform: 'translateY(-2px)',
                }
              }} 
            />
            <Chip 
              label="📱 Smart Tasks" 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.25)', 
                color: 'white',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                fontWeight: 500,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: 24, sm: 32 },
                mb: { xs: 0.5, sm: 0 },
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.35)',
                  transform: 'translateY(-2px)',
                }
              }} 
            />
          </Box>
        </HeaderSection>

        <CardContent sx={{ 
          p: { xs: 2, sm: 3, md: 4 }, 
          pt: { xs: 3, sm: 4 },
          background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)' 
        }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
            <Typography variant="h4" fontWeight="bold" sx={{
              background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.3rem', sm: '1.75rem', md: '2rem' },
              mb: { xs: 1, sm: 1.5 },
              lineHeight: { xs: 1.2, sm: 1.3 }
            }}>
              {isLogin ? '🌱 Welcome Back!' : '🚀 Join Our Community'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ 
              fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
              lineHeight: { xs: 1.4, sm: 1.5, md: 1.6 },
              maxWidth: '400px',
              mx: 'auto',
              px: { xs: 1, sm: 0 }
            }}>
              {isLogin 
                ? 'Access your personalized farm dashboard with AI-powered insights and real-time monitoring'
                : 'Start your journey with cutting-edge agricultural technology designed for Indian farmers'
              }
            </Typography>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3, 
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%)',
                border: '1px solid rgba(244, 67, 54, 0.2)',
                backdropFilter: 'blur(10px)',
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem',
                }
              }}
            >
              <Typography variant="body2" fontWeight={500}>
                {error}
              </Typography>
            </Alert>
          )}

          {resetEmailSent && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 3, 
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
                border: '1px solid rgba(76, 175, 80, 0.2)',
                backdropFilter: 'blur(10px)',
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem',
                }
              }}
            >
              <Typography variant="body2" fontWeight={500}>
                Password reset email sent! Check your inbox.
              </Typography>
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }} sx={{ mb: { xs: 1.5, sm: 2 } }}>
              {!isLogin && (
                <>
                  <Grid item xs={12}>
                    <StyledTextField
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                      name="name"
                      label="Full Name"
                      value={formData.name}
                      onChange={handleInputChange}
                      error={!!formErrors.name}
                      helperText={formErrors.name}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" fontSize={isMobile ? "small" : "medium"} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                      name="farmName"
                      label="Farm Name"
                      value={formData.farmName}
                      onChange={handleInputChange}
                      error={!!formErrors.farmName}
                      helperText={formErrors.farmName}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon color="action" fontSize={isMobile ? "small" : "medium"} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                      name="farmSize"
                      label="Farm Size (hectares)"
                      value={formData.farmSize}
                      onChange={handleInputChange}
                      type="number"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AgricultureIcon color="action" fontSize={isMobile ? "small" : "medium"} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                      name="location"
                      label="Location (City, State)"
                      value={formData.location || ''}
                      onChange={handleLocationChange}
                      error={!!formErrors.location}
                      helperText={formErrors.location}
                      autoComplete="address-level2"
                      spellCheck={false}
                      placeholder="Enter your city and state"
                      inputProps={{
                        style: { textAlign: 'left' },
                        'aria-label': 'Farm location'
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationIcon color="action" fontSize={isMobile ? "small" : "medium"} />
                          </InputAdornment>
                        ),
                        sx: {
                          '& input': {
                            WebkitTextFillColor: 'inherit !important',
                            backgroundColor: 'transparent !important',
                            '&:-webkit-autofill': {
                              WebkitBoxShadow: '0 0 0 1000px rgba(255, 255, 255, 0.9) inset',
                              WebkitTextFillColor: 'inherit',
                            },
                            '&:focus': {
                              backgroundColor: 'transparent !important',
                            },
                          },
                        },
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                      name="phoneNumber"
                      label="Phone Number"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      error={!!formErrors.phoneNumber}
                      helperText={formErrors.phoneNumber}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon color="action" fontSize={isMobile ? "small" : "medium"} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" fontSize={isMobile ? "small" : "medium"} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" fontSize={isMobile ? "small" : "medium"} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size={isMobile ? "small" : "medium"}
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {!isLogin && (
                <Grid item xs={12}>
                  <StyledTextField
                    fullWidth
                    size={isMobile ? "small" : "medium"}
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    error={!!formErrors.confirmPassword}
                    helperText={formErrors.confirmPassword}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" fontSize={isMobile ? "small" : "medium"} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              )}
            </Grid>

            <Box sx={{ mt: { xs: 3, sm: 4 }, mb: { xs: 2, sm: 3 } }}>
              <AnimatedButton
                type="submit"
                fullWidth
                variant="contained"
                size={isMobile ? "medium" : "large"}
                disabled={loading}
                sx={{
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  fontWeight: 600,
                  textTransform: 'none',
                  minHeight: { xs: 48, sm: 56 },
                  borderRadius: { xs: '12px', sm: '16px' },
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress size={24} color="inherit" />
                    <Typography variant="body1">
                      {isLogin ? 'Signing In...' : 'Creating Account...'}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }}>
                      {isLogin ? '🚀' : '🌟'}
                    </Box>
                    <Typography variant="body1" fontWeight={600}>
                      {isLogin ? 'Access Dashboard' : 'Start Smart Farming'}
                    </Typography>
                  </Box>
                )}
              </AnimatedButton>
            </Box>

            {isLogin && (
              <Box textAlign="center" mb={3}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={handlePasswordReset}
                  sx={{ 
                    textDecoration: 'none',
                    color: '#2e7d32',
                    fontWeight: 500,
                    position: 'relative',
                    '&:hover': {
                      color: '#1b5e20',
                      '&::after': {
                        width: '100%',
                      }
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -2,
                      left: 0,
                      width: 0,
                      height: 2,
                      background: 'linear-gradient(45deg, #2e7d32, #4caf50)',
                      transition: 'width 0.3s ease',
                    }
                  }}
                >
                  🔑 Forgot your password?
                </Link>
              </Box>
            )}

            <Divider sx={{ my: 3, position: 'relative' }}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{
                  bgcolor: 'background.paper',
                  px: 2,
                  fontWeight: 500,
                  background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
                }}
              >
                OR CONTINUE WITH
              </Typography>
            </Divider>

            <GoogleButton
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleGoogleSignIn}
              disabled={loading}
              startIcon={<GoogleIcon />}
              sx={{
                height: '56px',
                mb: 4,
                fontSize: '1rem',
                fontWeight: 500,
                textTransform: 'none',
              }}
            >
              {loading ? (
                <CircularProgress size={20} />
              ) : (
                `Continue with Google`
              )}
            </GoogleButton>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {isLogin ? "New to our platform? " : "Already have an account? "}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={toggleMode}
                  sx={{ 
                    fontWeight: 600, 
                    textDecoration: 'none',
                    color: '#2e7d32',
                    position: 'relative',
                    '&:hover': {
                      color: '#1b5e20',
                      '&::after': {
                        width: '100%',
                      }
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -2,
                      left: 0,
                      width: 0,
                      height: 2,
                      background: 'linear-gradient(45deg, #2e7d32, #4caf50)',
                      transition: 'width 0.3s ease',
                    }
                  }}
                >
                  {isLogin ? '🌱 Create Account' : '🔑 Sign In'}
                </Link>
              </Typography>
            </Box>
          </Box>

          <Box mt={{ xs: 3, sm: 4 }} textAlign="center">
            <Typography variant="caption" color="text.secondary" sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              flexWrap: 'wrap',
              lineHeight: 1.5,
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              mb: { xs: 1, sm: 1.5 }
            }}>
              <Box component="span" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>🔒</Box>
              <Box component="span">
                Enterprise-grade security with end-to-end encryption
              </Box>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              flexWrap: 'wrap',
              fontSize: { xs: '0.7rem', sm: '0.75rem' }
            }}>
              <Box component="span" sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>🏆</Box>
              <Box component="span">
                Trusted by thousands of Indian farmers
              </Box>
            </Typography>
          </Box>
        </CardContent>
      </LoginCard>
    </LoginContainer>
  );
}

export default Login;
