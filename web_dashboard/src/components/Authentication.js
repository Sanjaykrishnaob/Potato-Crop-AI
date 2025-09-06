import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Agriculture as FarmerIcon,
  Science as AgronomistIcon,
  AdminPanelSettings as AdminIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Google as GoogleIcon,
  Facebook as FacebookIcon,
} from '@mui/icons-material';

// Authentication Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock Authentication Service
class AuthService {
  static async login(email, password) {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Demo credentials
        const demoUsers = {
          'farmer@demo.com': { role: 'farmer', name: 'John Farmer', password: 'demo123' },
          'agronomist@demo.com': { role: 'agronomist', name: 'Dr. Sarah Green', password: 'demo123' },
          'admin@demo.com': { role: 'admin', name: 'System Admin', password: 'demo123' }
        };

        const user = demoUsers[email];
        if (user && user.password === password) {
          const token = `demo-token-${Date.now()}`;
          const userData = {
            id: Date.now(),
            email,
            name: user.name,
            role: user.role,
            token,
            permissions: this.getRolePermissions(user.role)
          };
          
          localStorage.setItem('auth_token', token);
          localStorage.setItem('user_data', JSON.stringify(userData));
          
          resolve(userData);
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1500);
    });
  }

  static async register(userData) {
    // Simulate registration
    return new Promise((resolve) => {
      setTimeout(() => {
        const token = `demo-token-${Date.now()}`;
        const newUser = {
          ...userData,
          id: Date.now(),
          token,
          permissions: this.getRolePermissions(userData.role)
        };
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_data', JSON.stringify(newUser));
        
        resolve(newUser);
      }, 2000);
    });
  }

  static async logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    return Promise.resolve();
  }

  static async getCurrentUser() {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      return JSON.parse(userData);
    }
    return null;
  }

  static getRolePermissions(role) {
    const permissions = {
      farmer: ['view_own_fields', 'edit_own_fields', 'view_reports', 'receive_alerts'],
      agronomist: ['view_all_fields', 'edit_all_fields', 'create_recommendations', 'view_analytics', 'manage_alerts'],
      admin: ['full_access', 'manage_users', 'system_settings', 'view_all_data', 'export_data']
    };
    return permissions[role] || [];
  }
}

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await AuthService.login(email, password);
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const newUser = await AuthService.register(userData);
      setUser(newUser);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission) => {
    return user?.permissions?.includes(permission) || user?.permissions?.includes('full_access');
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    hasPermission,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Form Component
const LoginForm = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onLogin(formData.email, formData.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role) => {
    const demoCredentials = {
      farmer: { email: 'farmer@demo.com', password: 'demo123' },
      agronomist: { email: 'agronomist@demo.com', password: 'demo123' },
      admin: { email: 'admin@demo.com', password: 'demo123' }
    };

    const creds = demoCredentials[role];
    setFormData({ ...formData, email: creds.email, password: creds.password });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>
        Welcome Back
      </Typography>
      <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
        Sign in to your Potato Crop AI account
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Demo Login Options */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          🚀 Quick Demo Access:
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={4}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<FarmerIcon />}
              onClick={() => handleDemoLogin('farmer')}
            >
              Farmer
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<AgronomistIcon />}
              onClick={() => handleDemoLogin('agronomist')}
            >
              Expert
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<AdminIcon />}
              onClick={() => handleDemoLogin('admin')}
            >
              Admin
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ mb: 3 }}>OR</Divider>

      <TextField
        fullWidth
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        sx={{ mb: 2 }}
        required
        InputProps={{
          startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
        }}
      />

      <TextField
        fullWidth
        label="Password"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        sx={{ mb: 2 }}
        required
        InputProps={{
          startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          endAdornment: (
            <Button
              onClick={() => setShowPassword(!showPassword)}
              sx={{ minWidth: 'auto', p: 1 }}
            >
              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </Button>
          )
        }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={formData.rememberMe}
            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
          />
        }
        label="Remember me"
        sx={{ mb: 3 }}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={loading || !formData.email || !formData.password}
        sx={{ mb: 2, py: 1.5 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Sign In'}
      </Button>

      <Typography variant="body2" textAlign="center">
        Don't have an account?{' '}
        <Button variant="text" onClick={onSwitchToRegister}>
          Create Account
        </Button>
      </Typography>
    </Box>
  );
};

// Registration Form Component
const RegisterForm = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'farmer',
    organization: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await onRegister(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'farmer', label: 'Farmer', icon: <FarmerIcon />, description: 'Manage your fields and crops' },
    { value: 'agronomist', label: 'Agronomist', icon: <AgronomistIcon />, description: 'Provide expert recommendations' },
    { value: 'admin', label: 'Administrator', icon: <AdminIcon />, description: 'System administration' }
  ];

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom>
        Create Account
      </Typography>
      <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
        Join the Potato Crop AI community
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              label="Role"
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {option.icon}
                    <Box>
                      <Typography variant="body1">{option.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Organization (Optional)"
            value={formData.organization}
            onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            error={formData.confirmPassword && formData.password !== formData.confirmPassword}
            helperText={
              formData.confirmPassword && formData.password !== formData.confirmPassword
                ? 'Passwords do not match'
                : ''
            }
          />
        </Grid>
      </Grid>

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={loading}
        sx={{ mt: 3, mb: 2, py: 1.5 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Create Account'}
      </Button>

      <Typography variant="body2" textAlign="center">
        Already have an account?{' '}
        <Button variant="text" onClick={onSwitchToLogin}>
          Sign In
        </Button>
      </Typography>
    </Box>
  );
};

// Main Authentication Component
const Authentication = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState(0); // 0: Login, 1: Register
  const { login, register } = useAuth();

  const handleLogin = async (email, password) => {
    const user = await login(email, password);
    onAuthSuccess?.(user);
  };

  const handleRegister = async (userData) => {
    const user = await register(userData);
    onAuthSuccess?.(user);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%', p: 2 }}>
        <CardContent>
          <Tabs
            value={mode}
            onChange={(e, newValue) => setMode(newValue)}
            variant="fullWidth"
            sx={{ mb: 3 }}
          >
            <Tab label="Sign In" />
            <Tab label="Create Account" />
          </Tabs>

          {mode === 0 ? (
            <LoginForm
              onLogin={handleLogin}
              onSwitchToRegister={() => setMode(1)}
            />
          ) : (
            <RegisterForm
              onRegister={handleRegister}
              onSwitchToLogin={() => setMode(0)}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

// User Profile Component
export const UserProfile = ({ user, onLogout }) => {
  const getRoleIcon = (role) => {
    switch (role) {
      case 'farmer': return <FarmerIcon />;
      case 'agronomist': return <AgronomistIcon />;
      case 'admin': return <AdminIcon />;
      default: return <PersonIcon />;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'farmer': return 'success';
      case 'agronomist': return 'primary';
      case 'admin': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar sx={{ bgcolor: `${getRoleColor(user.role)}.main` }}>
        {getRoleIcon(user.role)}
      </Avatar>
      
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {user.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={user.role}
            size="small"
            color={getRoleColor(user.role)}
          />
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
      </Box>
      
      <Button
        variant="outlined"
        size="small"
        onClick={onLogout}
      >
        Sign Out
      </Button>
    </Box>
  );
};

export default Authentication;
