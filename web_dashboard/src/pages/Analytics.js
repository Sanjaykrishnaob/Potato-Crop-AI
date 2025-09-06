import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  ShowChart,
  PieChart,
  Timeline,
  Download,
  Refresh,
} from '@mui/icons-material';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function Analytics() {
  const [selectedField, setSelectedField] = useState('all');
  const [timeRange, setTimeRange] = useState('season');
  const [tabValue, setTabValue] = useState(0);

  // Sample data
  const ndviTimeSeriesData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
    datasets: [
      {
        label: 'Field Alpha',
        data: [0.45, 0.52, 0.58, 0.65, 0.72, 0.68, 0.74, 0.71],
        borderColor: '#2E8B57',
        backgroundColor: 'rgba(46, 139, 87, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Field Beta',
        data: [0.48, 0.55, 0.62, 0.69, 0.75, 0.77, 0.79, 0.76],
        borderColor: '#FF8C00',
        backgroundColor: 'rgba(255, 140, 0, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Field Gamma',
        data: [0.42, 0.48, 0.54, 0.61, 0.67, 0.64, 0.69, 0.66],
        borderColor: '#4169E1',
        backgroundColor: 'rgba(65, 105, 225, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const yieldPredictionData = {
    labels: ['Field Alpha', 'Field Beta', 'Field Gamma'],
    datasets: [
      {
        label: 'Predicted Yield (tons/ha)',
        data: [28.5, 32.1, 25.8],
        backgroundColor: 'rgba(46, 139, 87, 0.8)',
      },
      {
        label: 'Historical Average (tons/ha)',
        data: [25.2, 28.6, 23.4],
        backgroundColor: 'rgba(255, 140, 0, 0.8)',
      },
    ],
  };

  const nutrientRadarData = {
    labels: ['Nitrogen', 'Phosphorus', 'Potassium', 'Magnesium', 'Calcium', 'Sulfur'],
    datasets: [
      {
        label: 'Current Levels',
        data: [65, 78, 85, 72, 68, 75],
        borderColor: '#2E8B57',
        backgroundColor: 'rgba(46, 139, 87, 0.2)',
      },
      {
        label: 'Optimal Range',
        data: [80, 85, 90, 85, 80, 85],
        borderColor: '#FF8C00',
        backgroundColor: 'rgba(255, 140, 0, 0.2)',
      },
    ],
  };

  const costAnalysisData = {
    labels: ['Fertilizers', 'Irrigation', 'Pest Control', 'Labor', 'Machinery'],
    datasets: [
      {
        data: [35, 25, 15, 15, 10],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
      },
    ],
  };

  const performanceMetrics = [
    { field: 'Field Alpha', area: 12.5, avgNdvi: 0.71, predictedYield: 28.5, efficiency: 94 },
    { field: 'Field Beta', area: 8.3, avgNdvi: 0.76, predictedYield: 32.1, efficiency: 97 },
    { field: 'Field Gamma', area: 15.2, avgNdvi: 0.66, predictedYield: 25.8, efficiency: 89 },
  ];

  const interventionHistory = [
    { date: '2024-01-15', field: 'Field Alpha', action: 'Nitrogen Fertilization', cost: 450, impact: '+12%' },
    { date: '2024-01-20', field: 'Field Beta', action: 'Irrigation', cost: 120, impact: '+8%' },
    { date: '2024-01-22', field: 'Field Gamma', action: 'Pest Control', cost: 280, impact: '+15%' },
    { date: '2024-01-25', field: 'Field Alpha', action: 'Phosphorus Fertilization', cost: 380, impact: '+10%' },
  ];

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          📊 Performance Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Field</InputLabel>
            <Select
              value={selectedField}
              label="Field"
              onChange={(e) => setSelectedField(e.target.value)}
            >
              <MenuItem value="all">All Fields</MenuItem>
              <MenuItem value="field1">Field Alpha</MenuItem>
              <MenuItem value="field2">Field Beta</MenuItem>
              <MenuItem value="field3">Field Gamma</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="season">This Season</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Refresh />}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Download />}>
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Summary Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                36.0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Area (ha)
              </Typography>
              <Chip label="+2.5 ha from last season" size="small" color="success" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                28.8
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Predicted Yield (t/ha)
              </Typography>
              <Chip label="+14% vs historical" size="small" color="success" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                $8,420
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Investment
              </Typography>
              <Chip label="ROI: 168%" size="small" color="warning" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                93%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Efficiency Score
              </Typography>
              <Chip label="+7% improvement" size="small" color="info" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analytics Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Vegetation Trends" icon={<TrendingUp />} />
            <Tab label="Yield Analysis" icon={<ShowChart />} />
            <Tab label="Nutrient Balance" icon={<PieChart />} />
            <Tab label="Performance" icon={<Timeline />} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              📈 NDVI Trends Over Time
            </Typography>
            <Box sx={{ height: 400 }}>
              <Line data={ndviTimeSeriesData} options={chartOptions} />
            </Box>
            
            <Grid container spacing={3} sx={{ mt: 3 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Key Insights
                </Typography>
                <ul>
                  <li>Field Beta shows the highest and most consistent NDVI values</li>
                  <li>All fields show healthy vegetation growth patterns</li>
                  <li>Recent dip in Week 6 likely due to weather conditions</li>
                  <li>Recovery trend visible in latest measurements</li>
                </ul>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Recommendations
                </Typography>
                <ul>
                  <li>Monitor Field Gamma for potential stress indicators</li>
                  <li>Maintain current management practices for Field Beta</li>
                  <li>Consider additional nutrition for Field Alpha</li>
                  <li>Weather-based irrigation scheduling recommended</li>
                </ul>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              🌾 Yield Prediction Analysis
            </Typography>
            <Box sx={{ height: 400 }}>
              <Bar data={yieldPredictionData} options={chartOptions} />
            </Box>
            
            <Grid container spacing={3} sx={{ mt: 3 }}>
              <Grid item xs={12} md={8}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Field</TableCell>
                        <TableCell align="right">Area (ha)</TableCell>
                        <TableCell align="right">Predicted Yield (t/ha)</TableCell>
                        <TableCell align="right">Total Yield (tons)</TableCell>
                        <TableCell align="right">Improvement</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {performanceMetrics.map((row) => (
                        <TableRow key={row.field}>
                          <TableCell component="th" scope="row">
                            {row.field}
                          </TableCell>
                          <TableCell align="right">{row.area}</TableCell>
                          <TableCell align="right">{row.predictedYield}</TableCell>
                          <TableCell align="right">{(row.area * row.predictedYield).toFixed(1)}</TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`+${((row.predictedYield / (row.predictedYield * 0.88) - 1) * 100).toFixed(0)}%`} 
                              color="success" 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold">
                      Season Forecast
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ my: 2 }}>
                      1,037 tons
                    </Typography>
                    <Typography variant="body2">
                      Total predicted harvest across all fields, representing a 14% increase over historical averages.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  🧪 Nutrient Balance Radar
                </Typography>
                <Box sx={{ height: 400 }}>
                  <Radar data={nutrientRadarData} options={chartOptions} />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  💰 Cost Distribution
                </Typography>
                <Box sx={{ height: 400 }}>
                  <Doughnut data={costAnalysisData} options={chartOptions} />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              📈 Field Performance Overview
            </Typography>
            
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Field</TableCell>
                    <TableCell align="right">Area (ha)</TableCell>
                    <TableCell align="right">Avg NDVI</TableCell>
                    <TableCell align="right">Predicted Yield</TableCell>
                    <TableCell align="right">Efficiency Score</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {performanceMetrics.map((row) => (
                    <TableRow key={row.field}>
                      <TableCell component="th" scope="row">
                        <strong>{row.field}</strong>
                      </TableCell>
                      <TableCell align="right">{row.area}</TableCell>
                      <TableCell align="right">{row.avgNdvi}</TableCell>
                      <TableCell align="right">{row.predictedYield} t/ha</TableCell>
                      <TableCell align="right">{row.efficiency}%</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={row.efficiency > 95 ? 'Excellent' : row.efficiency > 90 ? 'Good' : 'Fair'} 
                          color={row.efficiency > 95 ? 'success' : row.efficiency > 90 ? 'primary' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" fontWeight="bold" gutterBottom>
              🎯 Recent Interventions & Impact
            </Typography>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Field</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell align="right">Cost ($)</TableCell>
                    <TableCell align="right">Impact</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {interventionHistory.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.field}</TableCell>
                      <TableCell>{row.action}</TableCell>
                      <TableCell align="right">${row.cost}</TableCell>
                      <TableCell align="right">
                        <Chip label={row.impact} color="success" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>
      </Card>
    </Box>
  );
}

export default Analytics;
