import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Slider,
  Chip,
  Alert,
  Tab,
  Tabs,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications,
  Security,
  Api,
  ExpandMore,
  Save,
  Refresh,
  AccountCircle,
  LocationOn,
  Cloud,
} from '@mui/icons-material';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function Settings() {
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      pushNotifications: true,
      criticalOnly: false,
      alertThreshold: 70,
    },
    monitoring: {
      autoRefresh: true,
      refreshInterval: 30,
      dataRetention: 365,
      satelliteProvider: 'sentinel',
      weatherProvider: 'openweather',
    },
    analysis: {
      mlModelVersion: 'v2.1',
      confidenceThreshold: 85,
      autoRecommendations: true,
      predictionHorizon: 14,
    },
    general: {
      language: 'en',
      timezone: 'UTC+05:30',
      units: 'metric',
      currency: 'INR',
    },
    farm: {
      farmName: 'Green Valley Potato Farm',
      location: 'Bangalore, Karnataka',
      totalArea: 36.0,
      owner: 'Farmer John',
      phone: '+91 9876543210',
      email: 'farmer@example.com',
    },
  });

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value,
      },
    }));
  };

  const handleSaveSettings = () => {
    // In a real application, this would save to backend
    console.log('Saving settings:', settings);
    // Show success message
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          ⚙️ Settings & Configuration
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />}>
            Reset to Defaults
          </Button>
          <Button variant="contained" startIcon={<Save />} onClick={handleSaveSettings}>
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* Settings Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="General" icon={<SettingsIcon />} />
            <Tab label="Farm Profile" icon={<AccountCircle />} />
            <Tab label="Notifications" icon={<Notifications />} />
            <Tab label="Monitoring" icon={<Cloud />} />
            <Tab label="Analysis" icon={<Api />} />
          </Tabs>
        </Box>

        {/* General Settings */}
        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              🌐 General Preferences
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={settings.general.language}
                    label="Language"
                    onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="hi">हिंदी (Hindi)</MenuItem>
                    <MenuItem value="kn">ಕನ್ನಡ (Kannada)</MenuItem>
                    <MenuItem value="ta">தமிழ் (Tamil)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={settings.general.timezone}
                    label="Timezone"
                    onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                  >
                    <MenuItem value="UTC+05:30">IST (UTC+05:30)</MenuItem>
                    <MenuItem value="UTC+00:00">UTC (UTC+00:00)</MenuItem>
                    <MenuItem value="UTC-05:00">EST (UTC-05:00)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Units</InputLabel>
                  <Select
                    value={settings.general.units}
                    label="Units"
                    onChange={(e) => handleSettingChange('general', 'units', e.target.value)}
                  >
                    <MenuItem value="metric">Metric (kg, ha, °C)</MenuItem>
                    <MenuItem value="imperial">Imperial (lbs, acres, °F)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={settings.general.currency}
                    label="Currency"
                    onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                  >
                    <MenuItem value="INR">Indian Rupee (₹)</MenuItem>
                    <MenuItem value="USD">US Dollar ($)</MenuItem>
                    <MenuItem value="EUR">Euro (€)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 2 }}>
              Changes to language and timezone will take effect after page refresh.
            </Alert>
          </CardContent>
        </TabPanel>

        {/* Farm Profile */}
        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              🏡 Farm Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Farm Name"
                  value={settings.farm.farmName}
                  onChange={(e) => handleSettingChange('farm', 'farmName', e.target.value)}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Location"
                  value={settings.farm.location}
                  onChange={(e) => handleSettingChange('farm', 'location', e.target.value)}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: <LocationOn sx={{ mr: 1, color: 'action.active' }} />,
                  }}
                />

                <TextField
                  fullWidth
                  label="Total Area (hectares)"
                  type="number"
                  value={settings.farm.totalArea}
                  onChange={(e) => handleSettingChange('farm', 'totalArea', parseFloat(e.target.value))}
                  sx={{ mb: 3 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Owner Name"
                  value={settings.farm.owner}
                  onChange={(e) => handleSettingChange('farm', 'owner', e.target.value)}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Phone Number"
                  value={settings.farm.phone}
                  onChange={(e) => handleSettingChange('farm', 'phone', e.target.value)}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={settings.farm.email}
                  onChange={(e) => handleSettingChange('farm', 'email', e.target.value)}
                  sx={{ mb: 3 }}
                />
              </Grid>
            </Grid>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>Advanced Farm Settings</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Soil Type"
                      defaultValue="Loamy"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Elevation (m)"
                      type="number"
                      defaultValue="800"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Water Source"
                      defaultValue="Borewell + Rainwater"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </TabPanel>

        {/* Notifications */}
        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              🔔 Notification Preferences
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText 
                  primary="Email Alerts" 
                  secondary="Receive important updates via email"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.emailAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'emailAlerts', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="SMS Alerts" 
                  secondary="Get critical alerts via SMS"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.smsAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'smsAlerts', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Push Notifications" 
                  secondary="Browser push notifications"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Critical Only" 
                  secondary="Only receive high-priority alerts"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={settings.notifications.criticalOnly}
                    onChange={(e) => handleSettingChange('notifications', 'criticalOnly', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Alert Threshold
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Minimum health score that triggers alerts (Current: {settings.notifications.alertThreshold}%)
            </Typography>
            <Slider
              value={settings.notifications.alertThreshold}
              onChange={(e, value) => handleSettingChange('notifications', 'alertThreshold', value)}
              min={0}
              max={100}
              marks={[
                { value: 0, label: '0%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' },
              ]}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </TabPanel>

        {/* Monitoring */}
        <TabPanel value={tabValue} index={3}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              📡 Data Monitoring
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Auto Refresh" 
                      secondary="Automatically update data"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.monitoring.autoRefresh}
                        onChange={(e) => handleSettingChange('monitoring', 'autoRefresh', e.target.checked)}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>

                <Box sx={{ px: 2, pb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Refresh Interval (minutes)
                  </Typography>
                  <Slider
                    value={settings.monitoring.refreshInterval}
                    onChange={(e, value) => handleSettingChange('monitoring', 'refreshInterval', value)}
                    min={5}
                    max={120}
                    marks={[
                      { value: 5, label: '5m' },
                      { value: 30, label: '30m' },
                      { value: 60, label: '1h' },
                      { value: 120, label: '2h' },
                    ]}
                    disabled={!settings.monitoring.autoRefresh}
                  />
                </Box>

                <Box sx={{ px: 2, pb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Data Retention (days)
                  </Typography>
                  <Slider
                    value={settings.monitoring.dataRetention}
                    onChange={(e, value) => handleSettingChange('monitoring', 'dataRetention', value)}
                    min={30}
                    max={730}
                    marks={[
                      { value: 30, label: '1m' },
                      { value: 90, label: '3m' },
                      { value: 365, label: '1y' },
                      { value: 730, label: '2y' },
                    ]}
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Satellite Data Provider</InputLabel>
                  <Select
                    value={settings.monitoring.satelliteProvider}
                    label="Satellite Data Provider"
                    onChange={(e) => handleSettingChange('monitoring', 'satelliteProvider', e.target.value)}
                  >
                    <MenuItem value="sentinel">Sentinel-2 (Free)</MenuItem>
                    <MenuItem value="landsat">Landsat 8/9 (Free)</MenuItem>
                    <MenuItem value="planet">Planet Labs (Premium)</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Weather Data Provider</InputLabel>
                  <Select
                    value={settings.monitoring.weatherProvider}
                    label="Weather Data Provider"
                    onChange={(e) => handleSettingChange('monitoring', 'weatherProvider', e.target.value)}
                  >
                    <MenuItem value="openweather">OpenWeatherMap</MenuItem>
                    <MenuItem value="weatherapi">WeatherAPI</MenuItem>
                    <MenuItem value="accuweather">AccuWeather</MenuItem>
                  </Select>
                </FormControl>

                <Alert severity="info">
                  Premium providers offer higher resolution data and more frequent updates.
                </Alert>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Analysis Settings */}
        <TabPanel value={tabValue} index={4}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              🤖 AI Analysis Configuration
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>ML Model Version</InputLabel>
                  <Select
                    value={settings.analysis.mlModelVersion}
                    label="ML Model Version"
                    onChange={(e) => handleSettingChange('analysis', 'mlModelVersion', e.target.value)}
                  >
                    <MenuItem value="v2.1">v2.1 (Latest - Recommended)</MenuItem>
                    <MenuItem value="v2.0">v2.0 (Stable)</MenuItem>
                    <MenuItem value="v1.9">v1.9 (Legacy)</MenuItem>
                  </Select>
                </FormControl>

                <Typography variant="subtitle2" gutterBottom>
                  Confidence Threshold ({settings.analysis.confidenceThreshold}%)
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Minimum confidence level for AI predictions
                </Typography>
                <Slider
                  value={settings.analysis.confidenceThreshold}
                  onChange={(e, value) => handleSettingChange('analysis', 'confidenceThreshold', value)}
                  min={50}
                  max={95}
                  marks={[
                    { value: 50, label: '50%' },
                    { value: 75, label: '75%' },
                    { value: 90, label: '90%' },
                  ]}
                  sx={{ mb: 3 }}
                />

                <Typography variant="subtitle2" gutterBottom>
                  Prediction Horizon ({settings.analysis.predictionHorizon} days)
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  How far ahead to make predictions
                </Typography>
                <Slider
                  value={settings.analysis.predictionHorizon}
                  onChange={(e, value) => handleSettingChange('analysis', 'predictionHorizon', value)}
                  min={7}
                  max={30}
                  marks={[
                    { value: 7, label: '1w' },
                    { value: 14, label: '2w' },
                    { value: 21, label: '3w' },
                    { value: 30, label: '1m' },
                  ]}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Auto Recommendations" 
                      secondary="Generate recommendations automatically"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.analysis.autoRecommendations}
                        onChange={(e) => handleSettingChange('analysis', 'autoRecommendations', e.target.checked)}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>

                <Card sx={{ mt: 2, bgcolor: 'info.light' }}>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Model Performance
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      <Chip label="Growth Stage: 94%" size="small" color="success" />
                      <Chip label="Nutrient: 87%" size="small" color="success" />
                      <Chip label="Yield: 91%" size="small" color="success" />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Current model accuracy scores across different prediction tasks.
                    </Typography>
                  </CardContent>
                </Card>

                <Alert severity="warning" sx={{ mt: 2 }}>
                  Higher confidence thresholds may result in fewer but more reliable predictions.
                </Alert>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>
      </Card>
    </Box>
  );
}

export default Settings;
