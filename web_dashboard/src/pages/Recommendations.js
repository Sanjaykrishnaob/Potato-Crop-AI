import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  LinearProgress,
} from '@mui/material';
import {
  Recommend as RecommendIcon,
  WaterDrop as WaterIcon,
  Agriculture as AgricultureIcon,
  BugReport as PestIcon,
  Schedule as ScheduleIcon,
  AttachMoney as CostIcon,
  TrendingUp as BenefitIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const RecommendationCard = styled(Card)(({ theme, priority }) => {
  const colors = {
    high: theme.palette.error.main,
    medium: theme.palette.warning.main,
    low: theme.palette.info.main,
  };
  
  return {
    borderLeft: `4px solid ${colors[priority] || colors.medium}`,
    marginBottom: theme.spacing(2),
    transition: 'transform 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
    },
  };
});

const ActionCard = styled(Card)(({ theme }) => ({
  background: theme.palette.grey[50],
  border: `1px solid ${theme.palette.grey[200]}`,
}));

const MetricBox = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  background: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
}));

function Recommendations() {
  const [selectedField, setSelectedField] = useState('field1');
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  useEffect(() => {
    // Simulate API call to get recommendations
    const fetchRecommendations = async () => {
      setLoading(true);
      setTimeout(() => {
        setRecommendations({
          field_id: selectedField,
          analysis_date: new Date().toISOString(),
          total_cost: 236342.50,
          expected_roi: 156,
          summary: {
            total_area_ha: 12.5,
            total_zones: 4,
            high_priority_actions: 3,
            average_yield_impact: 0.18,
            zones_needing_attention: 2,
          },
          zones: [
            {
              zone_id: 1,
              area_ha: 3.2,
              growth_stage: 'Tuber_Bulking',
              health_status: 'good',
              nutrient_status: {
                nitrogen: 'deficiency',
                phosphorus: 'sufficient',
                potassium: 'marginal'
              },
              stress_indicators: {
                water_stress: 0.3,
                temperature_stress: 0.1,
                nutrient_stress: 0.6
              },
              estimated_yield_impact: 0.15,
              total_cost: 65204.80,
              actions: [
                {
                  action_type: 'fertilization',
                  priority: 'high',
                  description: 'Apply nitrogen fertilizer to address deficiency (current: 35.0 ppm, target: 45 ppm)',
                  timing: 'immediate',
                  application_rate: 25.0,
                  application_unit: 'kg/ha',
                  estimated_cost: 19920.00,
                  expected_benefit: 'Increase nitrogen levels to support Tuber_Bulking requirements'
                },
                {
                  action_type: 'irrigation',
                  priority: 'medium',
                  description: 'Apply 15.2mm irrigation based on growth stage requirements and stress indicators',
                  timing: 'within_week',
                  application_rate: 15.2,
                  application_unit: 'mm',
                  estimated_cost: 4037.12,
                  expected_benefit: 'Reduce water stress, maintain optimal soil moisture for Tuber_Bulking stage'
                }
              ]
            },
            {
              zone_id: 2,
              area_ha: 3.1,
              growth_stage: 'Tuber_Bulking',
              health_status: 'excellent',
              nutrient_status: {
                nitrogen: 'sufficient',
                phosphorus: 'sufficient',
                potassium: 'sufficient'
              },
              stress_indicators: {
                water_stress: 0.1,
                temperature_stress: 0.0,
                nutrient_stress: 0.2
              },
              estimated_yield_impact: 0.05,
              total_cost: 12865.00,
              actions: [
                {
                  action_type: 'pest_management',
                  priority: 'medium',
                  description: 'Monitor for Colorado potato beetle and apply treatment if threshold exceeded',
                  timing: 'within_week',
                  estimated_cost: 6432.50,
                  expected_benefit: 'Early detection and control of Colorado potato beetle'
                }
              ]
            },
            {
              zone_id: 3,
              area_ha: 3.0,
              growth_stage: 'Vegetative_Growth',
              health_status: 'fair',
              nutrient_status: {
                nitrogen: 'severe_deficiency',
                phosphorus: 'deficiency',
                potassium: 'sufficient'
              },
              stress_indicators: {
                water_stress: 0.7,
                temperature_stress: 0.2,
                nutrient_stress: 0.8
              },
              estimated_yield_impact: 0.25,
              total_cost: 94827.50,
              actions: [
                {
                  action_type: 'fertilization',
                  priority: 'high',
                  description: 'Apply nitrogen fertilizer to address severe_deficiency (current: 25.0 ppm, target: 45 ppm)',
                  timing: 'immediate',
                  application_rate: 50.0,
                  application_unit: 'kg/ha',
                  estimated_cost: 29880.00,
                  expected_benefit: 'Increase nitrogen levels to support Vegetative_Growth requirements'
                },
                {
                  action_type: 'fertilization',
                  priority: 'high',
                  description: 'Apply phosphorus fertilizer to address deficiency (current: 15.0 ppm, target: 25 ppm)',
                  timing: 'immediate',
                  application_rate: 40.0,
                  application_unit: 'kg/ha',
                  estimated_cost: 39840.00,
                  expected_benefit: 'Increase phosphorus levels to support Vegetative_Growth requirements'
                },
                {
                  action_type: 'irrigation',
                  priority: 'high',
                  description: 'Apply 22.8mm irrigation based on growth stage requirements and stress indicators',
                  timing: 'immediate',
                  application_rate: 22.8,
                  application_unit: 'mm',
                  estimated_cost: 5677.20,
                  expected_benefit: 'Reduce water stress, maintain optimal soil moisture for Vegetative_Growth stage'
                }
              ]
            }
          ]
        });
        setLoading(false);
      }, 1500);
    };

    fetchRecommendations();
  }, [selectedField]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'irrigation': return <WaterIcon />;
      case 'fertilization': return <AgricultureIcon />;
      case 'pest_management': return <PestIcon />;
      default: return <RecommendIcon />;
    }
  };

  const getHealthColor = (health) => {
    switch (health) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  const handleActionDetails = (action) => {
    setSelectedAction(action);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          🎯 AI Recommendations
        </Typography>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                Analyzing field data and generating recommendations...
              </Typography>
              <LinearProgress sx={{ width: '100%', mt: 2 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          🎯 AI Recommendations
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Field</InputLabel>
            <Select
              value={selectedField}
              label="Field"
              onChange={(e) => setSelectedField(e.target.value)}
            >
              <MenuItem value="field1">Field Alpha</MenuItem>
              <MenuItem value="field2">Field Beta</MenuItem>
              <MenuItem value="field3">Field Gamma</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricBox>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              {recommendations.summary.high_priority_actions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              High Priority Actions
            </Typography>
          </MetricBox>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricBox>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              ₹{recommendations.total_cost.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Investment
            </Typography>
          </MetricBox>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricBox>
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {recommendations.expected_roi}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Expected ROI
            </Typography>
          </MetricBox>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricBox>
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {(recommendations.summary.average_yield_impact * 100).toFixed(0)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Yield Impact
            </Typography>
          </MetricBox>
        </Grid>
      </Grid>

      {/* Priority Alerts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Immediate Attention Required</AlertTitle>
            Zone 3 shows severe nitrogen deficiency and high water stress. Immediate intervention recommended.
          </Alert>
        </Grid>
      </Grid>

      {/* Zone Recommendations */}
      <Grid container spacing={3}>
        {recommendations.zones.map((zone) => (
          <Grid item xs={12} key={zone.zone_id}>
            <Accordion defaultExpanded={zone.actions.some(a => a.priority === 'high')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography variant="h6" fontWeight="bold">
                    Zone {zone.zone_id}
                  </Typography>
                  <Chip 
                    label={zone.health_status} 
                    color={getHealthColor(zone.health_status)}
                    size="small"
                  />
                  <Chip 
                    label={zone.growth_stage.replace('_', ' ')} 
                    variant="outlined"
                    size="small"
                  />
                  <Box sx={{ flexGrow: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {zone.area_ha} ha • ₹{zone.total_cost.toFixed(2)} • {zone.actions.length} actions
                  </Typography>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Grid container spacing={3}>
                  {/* Zone Status */}
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          Zone Status
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Nutrient Status
                          </Typography>
                          {Object.entries(zone.nutrient_status).map(([nutrient, status]) => (
                            <Box key={nutrient} sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                {nutrient}:
                              </Typography>
                              <Chip 
                                label={status.replace('_', ' ')} 
                                size="small" 
                                color={status.includes('deficiency') ? 'error' : status === 'sufficient' ? 'success' : 'warning'}
                                variant="outlined"
                              />
                            </Box>
                          ))}
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Stress Indicators
                          </Typography>
                          {Object.entries(zone.stress_indicators).map(([stress, value]) => (
                            <Box key={stress} sx={{ mb: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                                  {stress.replace('_', ' ')}
                                </Typography>
                                <Typography variant="caption">
                                  {Math.round(value * 100)}%
                                </Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={value * 100} 
                                color={value > 0.7 ? 'error' : value > 0.4 ? 'warning' : 'success'}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Recommended Actions */}
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Recommended Actions
                    </Typography>
                    
                    {zone.actions.map((action, index) => (
                      <RecommendationCard key={index} priority={action.priority}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Box sx={{ 
                              p: 1, 
                              borderRadius: '50%', 
                              bgcolor: `${getPriorityColor(action.priority)}.light`,
                              color: `${getPriorityColor(action.priority)}.dark`
                            }}>
                              {getActionIcon(action.action_type)}
                            </Box>
                            
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Chip 
                                  label={action.priority} 
                                  color={getPriorityColor(action.priority)}
                                  size="small"
                                />
                                <Chip 
                                  label={action.action_type.replace('_', ' ')} 
                                  variant="outlined"
                                  size="small"
                                />
                                <Chip 
                                  label={action.timing.replace('_', ' ')} 
                                  variant="outlined"
                                  size="small"
                                />
                              </Box>
                              
                              <Typography variant="body1" fontWeight="medium" gutterBottom>
                                {action.description}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
                                {action.application_rate && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary">
                                      Application Rate
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                      {action.application_rate} {action.application_unit}
                                    </Typography>
                                  </Box>
                                )}
                                
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Estimated Cost
                                  </Typography>
                                  <Typography variant="body2" fontWeight="medium" color="error.main">
                                    ₹{action.estimated_cost.toFixed(2)}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                                {action.expected_benefit}
                              </Typography>
                            </Box>
                            
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleActionDetails(action)}
                            >
                              Details
                            </Button>
                          </Box>
                        </CardContent>
                      </RecommendationCard>
                    ))}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>

      {/* Action Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Action Details
        </DialogTitle>
        <DialogContent>
          {selectedAction && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedAction.description}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Action Type
                  </Typography>
                  <Typography variant="body1">
                    {selectedAction.action_type.replace('_', ' ')}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Priority
                  </Typography>
                  <Chip 
                    label={selectedAction.priority} 
                    color={getPriorityColor(selectedAction.priority)}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Timing
                  </Typography>
                  <Typography variant="body1">
                    {selectedAction.timing.replace('_', ' ')}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Cost
                  </Typography>
                  <Typography variant="body1" color="error.main" fontWeight="bold">
                    ${selectedAction.estimated_cost.toFixed(2)}
                  </Typography>
                </Grid>
                
                {selectedAction.application_rate && (
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Application Rate
                    </Typography>
                    <Typography variant="body1">
                      {selectedAction.application_rate} {selectedAction.application_unit}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Expected Benefit
                  </Typography>
                  <Typography variant="body1">
                    {selectedAction.expected_benefit}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button variant="contained">Schedule Action</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Recommendations;
