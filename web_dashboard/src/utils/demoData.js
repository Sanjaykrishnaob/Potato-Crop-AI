// Demo data for the hackathon presentation
export const demoData = {
  fields: [
    {
      id: 'field-alpha',
      name: 'Field Alpha',
      area: 12.5,
      location: [12.9716, 77.5946], // Bangalore coordinates
      health: 94,
      growthStage: 'Flowering',
      avgNdvi: 0.71,
      predictedYield: 28.5,
      lastUpdated: new Date().toISOString(),
      zones: [
        { id: 'z1', health: 98, ndvi: 0.75, recommendation: 'Maintain current practices' },
        { id: 'z2', health: 92, ndvi: 0.69, recommendation: 'Minor nitrogen supplementation' },
        { id: 'z3', health: 91, ndvi: 0.68, recommendation: 'Monitor for stress' }
      ]
    },
    {
      id: 'field-beta',
      name: 'Field Beta', 
      area: 8.3,
      location: [12.9816, 77.6046],
      health: 97,
      growthStage: 'Tuber Development',
      avgNdvi: 0.76,
      predictedYield: 32.1,
      lastUpdated: new Date().toISOString(),
      zones: [
        { id: 'z1', health: 99, ndvi: 0.78, recommendation: 'Excellent condition' },
        { id: 'z2', health: 96, ndvi: 0.75, recommendation: 'Continue monitoring' },
        { id: 'z3', health: 95, ndvi: 0.74, recommendation: 'Optimal growth' }
      ]
    },
    {
      id: 'field-gamma',
      name: 'Field Gamma',
      area: 15.2,
      location: [12.9616, 77.5846],
      health: 89,
      growthStage: 'Vegetative Growth',
      avgNdvi: 0.66,
      predictedYield: 25.8,
      lastUpdated: new Date().toISOString(),
      zones: [
        { id: 'z1', health: 92, ndvi: 0.70, recommendation: 'Increase irrigation' },
        { id: 'z2', health: 88, ndvi: 0.64, recommendation: 'Phosphorus deficiency detected' },
        { id: 'z3', health: 87, ndvi: 0.63, recommendation: 'Apply fertilizer mix' }
      ]
    }
  ],
  
  alerts: [
    {
      id: 1,
      type: 'warning',
      field: 'Field Gamma',
      message: 'Phosphorus deficiency detected in Zone 2',
      priority: 'High',
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      type: 'info',
      field: 'Field Alpha',
      message: 'Optimal growth conditions maintained',
      priority: 'Low',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ],

  weather: {
    temperature: 28,
    humidity: 65,
    rainfall: 2.3,
    windSpeed: 12,
    forecast: [
      { day: 'Today', temp: 28, condition: 'Partly Cloudy', rain: 0 },
      { day: 'Tomorrow', temp: 30, condition: 'Sunny', rain: 0 },
      { day: 'Friday', temp: 26, condition: 'Light Rain', rain: 5 }
    ]
  },

  recommendations: [
    {
      id: 1,
      zone: 'Field Gamma - Zone 2',
      action: 'Apply Phosphorus Fertilizer',
      priority: 'High',
      cost: '₹9,960',
      expectedImpact: '+15% yield',
      deadline: '2 days',
      description: 'Apply DAP fertilizer at 50kg/ha to address phosphorus deficiency'
    },
    {
      id: 2,
      zone: 'Field Alpha - Zone 2', 
      action: 'Nitrogen Supplementation',
      priority: 'Medium',
      cost: '₹6,640',
      expectedImpact: '+8% yield',
      deadline: '5 days',
      description: 'Apply urea at 25kg/ha for optimal growth'
    }
  ]
};

export const getSampleSatelliteData = () => ({
  ndvi: Array.from({length: 8}, (_, i) => 0.45 + Math.random() * 0.3),
  timestamp: new Date().toISOString(),
  cloudCover: 15,
  resolution: '10m'
});

export const getGrowthStageHistory = () => [
  { date: '2024-01-01', stage: 'Planting', confidence: 100 },
  { date: '2024-01-15', stage: 'Emergence', confidence: 95 },
  { date: '2024-02-01', stage: 'Vegetative Growth', confidence: 92 },
  { date: '2024-02-15', stage: 'Tuber Initiation', confidence: 89 },
  { date: '2024-03-01', stage: 'Tuber Development', confidence: 94 },
];

export default demoData;
