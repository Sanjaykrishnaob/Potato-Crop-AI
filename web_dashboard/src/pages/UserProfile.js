import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Alert,
  Tab,
  Tabs,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Agriculture as AgricultureIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Logout as LogoutIcon,
  Business as BusinessIcon,
  Landscape as LandscapeIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';

const ProfileContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: '1200px',
  margin: '0 auto',
}));

const ProfileCard = styled(Card)(({ theme }) => ({
  borderRadius: '20px',
  overflow: 'hidden',
  marginBottom: theme.spacing(3),
}));

const ProfileHeader = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
  color: 'white',
  padding: theme.spacing(4),
  position: 'relative',
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  border: '4px solid white',
  fontSize: '3rem',
  marginBottom: theme.spacing(2),
}));

const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

function UserProfile({ addNotification }) {
  const { currentUser, userProfile, updateUserProfile, logout } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    farmName: '',
    location: '',
    phoneNumber: '',
    farmSize: '',
    soilType: '',
    irrigationType: '',
    cropTypes: []
  });

  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      push: true,
      weather: true,
      tasks: true,
      recommendations: true
    },
    units: 'metric',
    language: 'en',
    currency: 'INR'
  });

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        name: userProfile.name || '',
        farmName: userProfile.farmName || '',
        location: userProfile.location || '',
        phoneNumber: userProfile.phoneNumber || '',
        farmSize: userProfile.farmSize || '',
        soilType: userProfile.farmDetails?.soilType || '',
        irrigationType: userProfile.farmDetails?.irrigationType || '',
        cropTypes: userProfile.cropTypes || ['potato']
      });
      
      setPreferences(userProfile.preferences || preferences);
    }
  }, [userProfile]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (category, field, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    
    try {
      const updates = {
        ...profileData,
        farmDetails: {
          ...userProfile?.farmDetails,
          soilType: profileData.soilType,
          irrigationType: profileData.irrigationType,
          totalArea: profileData.farmSize
        },
        preferences,
        profileCompleted: true
      };
      
      await updateUserProfile(updates);
      setEditMode(false);
      
      addNotification({
        type: 'success',
        title: '✅ Profile Updated',
        message: 'Your profile has been updated successfully',
        priority: 'Medium'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: '❌ Update Failed',
        message: 'Failed to update profile. Please try again.',
        priority: 'High'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      addNotification({
        type: 'info',
        title: '👋 Logged Out',
        message: 'You have been logged out successfully',
        priority: 'Low'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase() || '👨‍🌾';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <ProfileContainer>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          👤 User Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your farm profile, preferences, and account settings
        </Typography>
      </Box>

      {/* Profile Header Card */}
      <ProfileCard>
        <ProfileHeader>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <StyledAvatar>
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getInitials(profileData.name)
                )}
              </StyledAvatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {profileData.name || 'Farmer'}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                🏢 {profileData.farmName || 'Farm Name Not Set'}
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
                <Chip 
                  icon={<LocationIcon />} 
                  label={profileData.location || 'Location not set'} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  icon={<LandscapeIcon />} 
                  label={`${profileData.farmSize || '0'} hectares`} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
                <Chip 
                  icon={<AgricultureIcon />} 
                  label={profileData.cropTypes.join(', ') || 'No crops set'} 
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.8 }}>
                📧 {currentUser?.email}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8 }}>
                📱 {profileData.phoneNumber || 'Phone not set'}
              </Typography>
            </Grid>
            <Grid item>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={editMode ? <CancelIcon /> : <EditIcon />}
                  onClick={() => setEditMode(!editMode)}
                  sx={{ color: 'white', borderColor: 'white' }}
                >
                  {editMode ? 'Cancel' : 'Edit Profile'}
                </Button>
                {editMode && (
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                    disabled={loading}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Save'}
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </ProfileHeader>
      </ProfileCard>

      {/* Tabs */}
      <Card sx={{ borderRadius: '20px' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="scrollable">
            <Tab icon={<PersonIcon />} label="Personal Info" />
            <Tab icon={<AgricultureIcon />} label="Farm Details" />
            <Tab icon={<NotificationsIcon />} label="Notifications" />
            <Tab icon={<SettingsIcon />} label="Preferences" />
            <Tab icon={<SecurityIcon />} label="Security" />
          </Tabs>
        </Box>

        {/* Personal Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={profileData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <PersonIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                value={currentUser?.email || ''}
                disabled
                InputProps={{
                  startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={profileData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location (City, State)"
                value={profileData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <LocationIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Farm Details Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Farm Name"
                value={profileData.farmName}
                onChange={(e) => handleInputChange('farmName', e.target.value)}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <BusinessIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Farm Size (hectares)"
                type="number"
                value={profileData.farmSize}
                onChange={(e) => handleInputChange('farmSize', e.target.value)}
                disabled={!editMode}
                InputProps={{
                  startAdornment: <LandscapeIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Soil Type"
                value={profileData.soilType}
                onChange={(e) => handleInputChange('soilType', e.target.value)}
                disabled={!editMode}
                placeholder="e.g., Loamy, Clay, Sandy"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Irrigation Type"
                value={profileData.irrigationType}
                onChange={(e) => handleInputChange('irrigationType', e.target.value)}
                disabled={!editMode}
                placeholder="e.g., Drip, Sprinkler, Flood"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Crop Types"
                value={profileData.cropTypes.join(', ')}
                onChange={(e) => handleInputChange('cropTypes', e.target.value.split(',').map(s => s.trim()))}
                disabled={!editMode}
                placeholder="e.g., Potato, Wheat, Rice"
                helperText="Separate multiple crops with commas"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            📧 Notification Preferences
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Choose how you want to receive notifications about your farm activities
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <EmailIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Email Notifications" 
                secondary="Receive important updates via email"
              />
              <Switch
                checked={preferences.notifications?.email || false}
                onChange={(e) => handlePreferenceChange('notifications', 'email', e.target.checked)}
                disabled={!editMode}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <NotificationsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Push Notifications" 
                secondary="Get instant alerts on your device"
              />
              <Switch
                checked={preferences.notifications?.push || false}
                onChange={(e) => handlePreferenceChange('notifications', 'push', e.target.checked)}
                disabled={!editMode}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <span>🌤️</span>
              </ListItemIcon>
              <ListItemText 
                primary="Weather Alerts" 
                secondary="Notifications about weather conditions affecting your crops"
              />
              <Switch
                checked={preferences.notifications?.weather || false}
                onChange={(e) => handlePreferenceChange('notifications', 'weather', e.target.checked)}
                disabled={!editMode}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <span>📋</span>
              </ListItemIcon>
              <ListItemText 
                primary="Task Reminders" 
                secondary="Reminders for scheduled farm tasks and activities"
              />
              <Switch
                checked={preferences.notifications?.tasks || false}
                onChange={(e) => handlePreferenceChange('notifications', 'tasks', e.target.checked)}
                disabled={!editMode}
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <span>🤖</span>
              </ListItemIcon>
              <ListItemText 
                primary="AI Recommendations" 
                secondary="Get notified about new AI-generated insights and recommendations"
              />
              <Switch
                checked={preferences.notifications?.recommendations || false}
                onChange={(e) => handlePreferenceChange('notifications', 'recommendations', e.target.checked)}
                disabled={!editMode}
              />
            </ListItem>
          </List>
        </TabPanel>

        {/* Preferences Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Language"
                value={preferences.language || 'en'}
                onChange={(e) => handlePreferenceChange('', 'language', e.target.value)}
                disabled={!editMode}
                select
                SelectProps={{ native: true }}
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="te">తెలుగు (Telugu)</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Currency"
                value={preferences.currency || 'INR'}
                onChange={(e) => handlePreferenceChange('', 'currency', e.target.value)}
                disabled={!editMode}
                select
                SelectProps={{ native: true }}
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Units"
                value={preferences.units || 'metric'}
                onChange={(e) => handlePreferenceChange('', 'units', e.target.value)}
                disabled={!editMode}
                select
                SelectProps={{ native: true }}
              >
                <option value="metric">Metric (kg, hectares, °C)</option>
                <option value="imperial">Imperial (lbs, acres, °F)</option>
              </TextField>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            🔒 Account Security
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Your account is secured with Firebase authentication. For password changes or additional security settings, 
            please use the password reset option from the login page.
          </Alert>
          
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={() => setLogoutDialogOpen(true)}
              color="error"
            >
              Sign Out of All Devices
            </Button>
          </Box>
          
          <Box mt={4}>
            <Typography variant="subtitle1" gutterBottom>
              Account Information
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Account Created" 
                  secondary={userProfile?.registrationDate ? 
                    new Date(userProfile.registrationDate.seconds * 1000).toLocaleDateString('en-IN') : 
                    'Unknown'
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Last Login" 
                  secondary={userProfile?.lastLogin ? 
                    new Date(userProfile.lastLogin.seconds * 1000).toLocaleString('en-IN') : 
                    'Unknown'
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Profile Status" 
                  secondary={userProfile?.profileCompleted ? 'Complete' : 'Incomplete'}
                />
              </ListItem>
            </List>
          </Box>
        </TabPanel>
      </Card>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to sign out? You'll need to log in again to access your farm dashboard.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLogout} color="error" variant="contained">
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>
    </ProfileContainer>
  );
}

export default UserProfile;
