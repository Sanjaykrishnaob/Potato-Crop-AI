import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  Grid,
  Tooltip,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
} from '@mui/material';
import {
  TuneOutlined as SettingsIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  Layers as LayersIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled components for the heatmap
const HeatmapContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '400px',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
}));

const HeatmapCell = styled('div')(({ theme, value, colorScheme }) => ({
  position: 'absolute',
  border: '1px solid rgba(255,255,255,0.1)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    border: '2px solid white',
    zIndex: 10,
    transform: 'scale(1.05)',
  },
}));

const Legend = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
}));

// Crop Health Heatmap Component
export const CropHealthHeatmap = ({ 
  fieldData, 
  selectedMetric = 'health',
  zones = [],
  onZoneClick,
  interactive = true 
}) => {
  const [hoveredZone, setHoveredZone] = useState(null);
  const [colorScheme, setColorScheme] = useState('health');
  const [opacity, setOpacity] = useState(0.8);
  const [showGrid, setShowGrid] = useState(true);
  const [settingsAnchor, setSettingsAnchor] = useState(null);

  // Color schemes for different metrics
  const colorSchemes = {
    health: {
      name: 'Health',
      colors: ['#ff4444', '#ff8800', '#ffdd00', '#88dd00', '#00aa00'],
      min: 0,
      max: 100,
      unit: '%'
    },
    ndvi: {
      name: 'NDVI',
      colors: ['#8B4513', '#DAA520', '#9ACD32', '#32CD32', '#006400'],
      min: 0,
      max: 1,
      unit: ''
    },
    moisture: {
      name: 'Soil Moisture',
      colors: ['#D2B48C', '#F4A460', '#87CEEB', '#4682B4', '#191970'],
      min: 0,
      max: 100,
      unit: '%'
    },
    temperature: {
      name: 'Temperature',
      colors: ['#000080', '#4169E1', '#32CD32', '#FFD700', '#FF4500'],
      min: 10,
      max: 40,
      unit: '°C'
    }
  };

  const getColorForValue = (value, metric) => {
    const scheme = colorSchemes[metric] || colorSchemes.health;
    const normalizedValue = (value - scheme.min) / (scheme.max - scheme.min);
    const clampedValue = Math.max(0, Math.min(1, normalizedValue));
    const colorIndex = Math.floor(clampedValue * (scheme.colors.length - 1));
    return scheme.colors[colorIndex];
  };

  const generateHeatmapData = () => {
    if (!fieldData || !zones.length) {
      // Generate demo grid data
      const gridSize = 20;
      const data = [];
      
      for (let x = 0; x < gridSize; x++) {
        for (let y = 0; y < gridSize; y++) {
          const baseValue = 70 + Math.sin(x * 0.3) * 15 + Math.cos(y * 0.2) * 10;
          const noise = (Math.random() - 0.5) * 20;
          data.push({
            x: x * (100 / gridSize),
            y: y * (100 / gridSize),
            width: 100 / gridSize,
            height: 100 / gridSize,
            value: Math.max(0, Math.min(100, baseValue + noise)),
            id: `cell-${x}-${y}`,
            zone: `Zone ${Math.floor(x / 4) + 1}-${Math.floor(y / 4) + 1}`
          });
        }
      }
      return data;
    }
    
    return zones.map((zone, index) => ({
      ...zone,
      x: (index % 5) * 20,
      y: Math.floor(index / 5) * 20,
      width: 20,
      height: 20,
      value: zone[selectedMetric] || zone.health || 75
    }));
  };

  const heatmapData = useMemo(() => generateHeatmapData(), [fieldData, zones, selectedMetric]);

  const handleCellClick = (cell) => {
    if (interactive && onZoneClick) {
      onZoneClick(cell);
    }
  };

  const handleExport = () => {
    // Export functionality
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    // Draw heatmap to canvas
    heatmapData.forEach(cell => {
      ctx.fillStyle = getColorForValue(cell.value, selectedMetric);
      ctx.fillRect(
        (cell.x / 100) * canvas.width,
        (cell.y / 100) * canvas.height,
        (cell.width / 100) * canvas.width,
        (cell.height / 100) * canvas.height
      );
    });
    
    // Download image
    const link = document.createElement('a');
    link.download = `${selectedMetric}-heatmap-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            🌡️ {colorSchemes[selectedMetric]?.name || 'Health'} Heatmap
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" onClick={handleExport}>
              <ExportIcon />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={(e) => setSettingsAnchor(e.currentTarget)}
            >
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>

        <HeatmapContainer>
          {heatmapData.map((cell) => (
            <HeatmapCell
              key={cell.id}
              value={cell.value}
              colorScheme={selectedMetric}
              onMouseEnter={() => setHoveredZone(cell)}
              onMouseLeave={() => setHoveredZone(null)}
              onClick={() => handleCellClick(cell)}
              style={{
                left: `${cell.x}%`,
                top: `${cell.y}%`,
                width: `${cell.width}%`,
                height: `${cell.height}%`,
                backgroundColor: getColorForValue(cell.value, selectedMetric),
                opacity: opacity,
                borderWidth: showGrid ? '1px' : '0px',
              }}
            />
          ))}
          
          {hoveredZone && (
            <Tooltip
              title={
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {hoveredZone.zone || hoveredZone.id}
                  </Typography>
                  <Typography variant="body2">
                    {colorSchemes[selectedMetric]?.name}: {hoveredZone.value.toFixed(1)}{colorSchemes[selectedMetric]?.unit}
                  </Typography>
                </Box>
              }
              open={true}
              placement="top"
              arrow
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: `${hoveredZone.x + hoveredZone.width/2}%`,
                  top: `${hoveredZone.y + hoveredZone.height/2}%`,
                  pointerEvents: 'none',
                }}
              />
            </Tooltip>
          )}
        </HeatmapContainer>

        {/* Legend */}
        <Legend sx={{ mt: 2 }}>
          <Typography variant="caption" fontWeight="bold">
            {colorSchemes[selectedMetric]?.name}:
          </Typography>
          {colorSchemes[selectedMetric]?.colors.map((color, index) => (
            <Box
              key={index}
              sx={{
                width: 20,
                height: 12,
                backgroundColor: color,
                borderRadius: 1,
              }}
            />
          ))}
          <Typography variant="caption">
            {colorSchemes[selectedMetric]?.min}{colorSchemes[selectedMetric]?.unit} - {colorSchemes[selectedMetric]?.max}{colorSchemes[selectedMetric]?.unit}
          </Typography>
        </Legend>

        {/* Settings Menu */}
        <Menu
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={() => setSettingsAnchor(null)}
        >
          <MenuItem onClick={() => { setColorScheme('health'); setSettingsAnchor(null); }}>
            Health View
          </MenuItem>
          <MenuItem onClick={() => { setColorScheme('ndvi'); setSettingsAnchor(null); }}>
            NDVI View
          </MenuItem>
          <MenuItem onClick={() => { setColorScheme('moisture'); setSettingsAnchor(null); }}>
            Moisture View
          </MenuItem>
          <MenuItem onClick={() => { setColorScheme('temperature'); setSettingsAnchor(null); }}>
            Temperature View
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

// Growth Stage Timeline Component
export const GrowthStageTimeline = ({ 
  stageHistory = [],
  currentStage = 'Vegetative Growth',
  predictedStages = []
}) => {
  const stages = [
    { name: 'Planting', duration: 0, color: '#8B4513', icon: '🌱' },
    { name: 'Emergence', duration: 14, color: '#9ACD32', icon: '🌿' },
    { name: 'Vegetative Growth', duration: 45, color: '#32CD32', icon: '🍃' },
    { name: 'Tuber Initiation', duration: 21, color: '#FFD700', icon: '🌾' },
    { name: 'Tuber Development', duration: 35, color: '#FF8C00', icon: '🥔' },
    { name: 'Maturity', duration: 14, color: '#8B4513', icon: '🌾' },
  ];

  const TimelineContainer = styled(Box)(({ theme }) => ({
    position: 'relative',
    padding: theme.spacing(2),
    '&::before': {
      content: '""',
      position: 'absolute',
      left: '50%',
      top: 0,
      bottom: 0,
      width: '2px',
      backgroundColor: theme.palette.divider,
      transform: 'translateX(-50%)',
    },
  }));

  const StageNode = styled(Box)(({ theme, active, completed }) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
    '&:nth-of-type(even)': {
      flexDirection: 'row-reverse',
      '& .stage-content': {
        textAlign: 'right',
      },
    },
  }));

  const StageIcon = styled(Box)(({ theme, active, completed, color }) => ({
    width: 60,
    height: 60,
    borderRadius: '50%',
    backgroundColor: completed ? color : active ? color : theme.palette.grey[300],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    border: `3px solid ${active ? theme.palette.primary.main : 'transparent'}`,
    boxShadow: active ? theme.shadows[4] : theme.shadows[1],
    zIndex: 2,
    position: 'relative',
    animation: active ? 'pulse 2s infinite' : 'none',
    '@keyframes pulse': {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.1)' },
      '100%': { transform: 'scale(1)' },
    },
  }));

  const StageContent = styled(Box)(({ theme }) => ({
    flex: 1,
    padding: theme.spacing(1, 2),
    margin: theme.spacing(0, 2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[1],
  }));

  const getCurrentStageIndex = () => {
    return stages.findIndex(stage => stage.name === currentStage);
  };

  const currentStageIndex = getCurrentStageIndex();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          📈 Growth Stage Timeline
        </Typography>
        
        <TimelineContainer>
          {stages.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isActive = index === currentStageIndex;
            const isPredicted = index > currentStageIndex;

            return (
              <StageNode 
                key={stage.name}
                active={isActive}
                completed={isCompleted}
              >
                <StageIcon
                  active={isActive}
                  completed={isCompleted}
                  color={stage.color}
                >
                  {stage.icon}
                </StageIcon>
                
                <StageContent className="stage-content">
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="bold"
                    color={isActive ? 'primary.main' : 'text.primary'}
                  >
                    {stage.name}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Duration: {stage.duration} days
                  </Typography>
                  
                  {isActive && (
                    <Chip
                      label="Current Stage"
                      size="small"
                      color="primary"
                      sx={{ mt: 1 }}
                    />
                  )}
                  
                  {isCompleted && (
                    <Chip
                      label="Completed"
                      size="small"
                      color="success"
                      sx={{ mt: 1 }}
                    />
                  )}
                  
                  {isPredicted && (
                    <Chip
                      label="Upcoming"
                      size="small"
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  )}
                </StageContent>
              </StageNode>
            );
          })}
        </TimelineContainer>
      </CardContent>
    </Card>
  );
};

// Yield Prediction Graph Component
export const YieldPredictionGraph = ({ 
  historicalData = [],
  predictionData = [],
  fieldName = 'Field Alpha'
}) => {
  const [timeRange, setTimeRange] = useState('season');
  const [showConfidence, setShowConfidence] = useState(true);

  // Generate demo data if not provided
  const generateDemoData = () => {
    const historical = [];
    const prediction = [];
    const currentDate = new Date();
    
    // Historical data (last 12 weeks)
    for (let i = 12; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - (i * 7));
      
      historical.push({
        date: date.toISOString().split('T')[0],
        yield: 20 + Math.random() * 15 + (12 - i) * 0.5,
        confidence: 95 + Math.random() * 5
      });
    }
    
    // Prediction data (next 8 weeks)
    for (let i = 1; i <= 8; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + (i * 7));
      
      prediction.push({
        date: date.toISOString().split('T')[0],
        yield: 25 + Math.random() * 10 + i * 0.3,
        confidence: Math.max(60, 95 - i * 4),
        upper: 30 + Math.random() * 8 + i * 0.4,
        lower: 20 + Math.random() * 6 + i * 0.2
      });
    }
    
    return { historical, prediction };
  };

  const { historical, prediction } = historicalData.length > 0 || predictionData.length > 0 
    ? { historical: historicalData, prediction: predictionData }
    : generateDemoData();

  const GraphContainer = styled(Box)(({ theme }) => ({
    width: '100%',
    height: '300px',
    position: 'relative',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  }));

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            📊 Yield Prediction - {fieldName}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showConfidence}
                  onChange={(e) => setShowConfidence(e.target.checked)}
                  size="small"
                />
              }
              label="Confidence Band"
            />
          </Box>
        </Box>

        <GraphContainer>
          <svg width="100%" height="100%" viewBox="0 0 800 250">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="25" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 25" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Historical data line */}
            <polyline
              fill="none"
              stroke="#2E8B57"
              strokeWidth="3"
              points={historical.map((point, index) => 
                `${(index / (historical.length - 1)) * 400},${250 - (point.yield / 40) * 200}`
              ).join(' ')}
            />
            
            {/* Prediction line */}
            <polyline
              fill="none"
              stroke="#FF8C00"
              strokeWidth="3"
              strokeDasharray="5,5"
              points={prediction.map((point, index) => 
                `${400 + (index / (prediction.length - 1)) * 400},${250 - (point.yield / 40) * 200}`
              ).join(' ')}
            />
            
            {/* Confidence band */}
            {showConfidence && prediction.length > 0 && (
              <polygon
                fill="rgba(255, 140, 0, 0.2)"
                points={[
                  ...prediction.map((point, index) => 
                    `${400 + (index / (prediction.length - 1)) * 400},${250 - (point.upper / 40) * 200}`
                  ),
                  ...prediction.slice().reverse().map((point, index) => 
                    `${400 + ((prediction.length - 1 - index) / (prediction.length - 1)) * 400},${250 - (point.lower / 40) * 200}`
                  )
                ].join(' ')}
              />
            )}
            
            {/* Current date line */}
            <line 
              x1="400" 
              y1="0" 
              x2="400" 
              y2="250" 
              stroke="#666" 
              strokeWidth="2" 
              strokeDasharray="3,3"
            />
            
            {/* Labels */}
            <text x="200" y="270" textAnchor="middle" fontSize="12" fill="#666">Historical</text>
            <text x="600" y="270" textAnchor="middle" fontSize="12" fill="#666">Predicted</text>
            <text x="400" y="285" textAnchor="middle" fontSize="10" fill="#999">Today</text>
          </svg>
        </GraphContainer>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Historical Average
            </Typography>
            <Typography variant="h6" color="success.main" fontWeight="bold">
              {historical.length > 0 ? (historical.reduce((sum, p) => sum + p.yield, 0) / historical.length).toFixed(1) : '26.5'} t/ha
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              Predicted Final Yield
            </Typography>
            <Typography variant="h6" color="warning.main" fontWeight="bold">
              {prediction.length > 0 ? prediction[prediction.length - 1].yield.toFixed(1) : '32.1'} t/ha
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default {
  CropHealthHeatmap,
  GrowthStageTimeline,
  YieldPredictionGraph
};
