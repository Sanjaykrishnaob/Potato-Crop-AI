import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  InsertChart as ExcelIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment as ReportIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  CloudDownload as CloudIcon,
} from '@mui/icons-material';

// Export and Reporting Service
class ExportService {
  static async exportToPDF(data, reportType, options = {}) {
    // Simulate PDF generation
    return new Promise((resolve) => {
      setTimeout(() => {
        const blob = new Blob(['PDF content would be here'], { type: 'application/pdf' });
        resolve(blob);
      }, 2000);
    });
  }

  static async exportToCSV(data, filename) {
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  static async exportToExcel(data, filename) {
    // Simulate Excel export
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace('.csv', '.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  static convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  }

  static async scheduleReport(reportConfig) {
    // Simulate scheduling
    console.log('Scheduling report:', reportConfig);
    return { success: true, scheduleId: `schedule-${Date.now()}` };
  }

  static async emailReport(reportConfig, recipients) {
    // Simulate email sending
    console.log('Emailing report to:', recipients);
    return { success: true, emailId: `email-${Date.now()}` };
  }
}

// Main Export & Reporting Component
const DataExportReporting = ({ 
  fieldData, 
  analyticsData,
  onExportComplete,
  availableFields = []
}) => {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    reportType: 'field-summary',
    format: 'pdf',
    fields: [],
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    },
    includeCharts: true,
    includeRecommendations: true,
    includeAlerts: true
  });
  const [scheduleConfig, setScheduleConfig] = useState({
    frequency: 'weekly',
    recipients: [],
    reportType: 'comprehensive',
    nextRun: new Date()
  });

  const reportTypes = [
    { value: 'field-summary', label: 'Field Summary Report', description: 'Overview of all field metrics and health status' },
    { value: 'growth-analysis', label: 'Growth Stage Analysis', description: 'Detailed analysis of crop growth stages' },
    { value: 'nutrient-report', label: 'Nutrient Analysis Report', description: 'Soil nutrient levels and deficiency analysis' },
    { value: 'yield-forecast', label: 'Yield Prediction Report', description: 'Comprehensive yield forecasting and trends' },
    { value: 'comprehensive', label: 'Comprehensive Report', description: 'Complete analysis including all metrics' },
    { value: 'custom', label: 'Custom Report', description: 'Build your own custom report' }
  ];

  const exportFormats = [
    { value: 'pdf', label: 'PDF', icon: <PdfIcon />, description: 'Professional report format' },
    { value: 'csv', label: 'CSV', icon: <CsvIcon />, description: 'Data for spreadsheet analysis' },
    { value: 'excel', label: 'Excel', icon: <ExcelIcon />, description: 'Advanced spreadsheet format' }
  ];

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' }
  ];

  const handleExport = async () => {
    setLoading(true);
    try {
      const reportData = generateReportData();
      
      switch (exportConfig.format) {
        case 'pdf':
          await ExportService.exportToPDF(reportData, exportConfig.reportType, exportConfig);
          break;
        case 'csv':
          await ExportService.exportToCSV(reportData, `${exportConfig.reportType}-${new Date().toISOString().split('T')[0]}.csv`);
          break;
        case 'excel':
          await ExportService.exportToExcel(reportData, `${exportConfig.reportType}-${new Date().toISOString().split('T')[0]}.csv`);
          break;
      }
      
      setExportDialogOpen(false);
      if (onExportComplete) {
        onExportComplete({ success: true, type: exportConfig.format });
      }
    } catch (error) {
      console.error('Export error:', error);
      if (onExportComplete) {
        onExportComplete({ success: false, error: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleReport = async () => {
    setLoading(true);
    try {
      const result = await ExportService.scheduleReport(scheduleConfig);
      setScheduleDialogOpen(false);
      if (onExportComplete) {
        onExportComplete({ success: true, type: 'schedule', scheduleId: result.scheduleId });
      }
    } catch (error) {
      console.error('Schedule error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReportData = () => {
    // Generate sample report data based on config
    const baseData = [
      {
        field: 'Field Alpha',
        area: 12.5,
        health: 94,
        ndvi: 0.71,
        yield_prediction: 28.5,
        growth_stage: 'Flowering',
        last_updated: new Date().toISOString().split('T')[0]
      },
      {
        field: 'Field Beta',
        area: 8.3,
        health: 97,
        ndvi: 0.76,
        yield_prediction: 32.1,
        growth_stage: 'Tuber Development',
        last_updated: new Date().toISOString().split('T')[0]
      },
      {
        field: 'Field Gamma',
        area: 15.2,
        health: 89,
        ndvi: 0.66,
        yield_prediction: 25.8,
        growth_stage: 'Vegetative Growth',
        last_updated: new Date().toISOString().split('T')[0]
      }
    ];

    return exportConfig.fields.length > 0 
      ? baseData.filter(item => exportConfig.fields.includes(item.field))
      : baseData;
  };

  const quickExportOptions = [
    {
      title: 'Field Health Summary',
      description: 'Quick overview of all field health metrics',
      format: 'pdf',
      icon: <ReportIcon />,
      action: () => {
        setExportConfig({
          ...exportConfig,
          reportType: 'field-summary',
          format: 'pdf'
        });
        handleExport();
      }
    },
    {
      title: 'Data Export (CSV)',
      description: 'Raw data for analysis in spreadsheets',
      format: 'csv',
      icon: <CsvIcon />,
      action: () => {
        setExportConfig({
          ...exportConfig,
          reportType: 'field-summary',
          format: 'csv'
        });
        handleExport();
      }
    },
    {
      title: 'Share Report',
      description: 'Generate shareable link or send via email',
      format: 'share',
      icon: <ShareIcon />,
      action: () => {
        // Implement share functionality
        navigator.share?.({
          title: 'Potato Crop Health Report',
          text: 'Check out this crop analysis report',
          url: window.location.href
        });
      }
    }
  ];

  return (
    <Box>
      {/* Quick Export Options */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            📊 Quick Export Options
          </Typography>
        </Grid>
        
        {quickExportOptions.map((option, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 }
              }}
              onClick={option.action}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {option.icon}
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {option.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Advanced Export Options */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" fontWeight="bold">
            ⚙️ Advanced Export & Reporting
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                fullWidth
                sx={{ mb: 2 }}
                onClick={() => setExportDialogOpen(true)}
              >
                Custom Export
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<ScheduleIcon />}
                fullWidth
                sx={{ mb: 2 }}
                onClick={() => setScheduleDialogOpen(true)}
              >
                Schedule Reports
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<EmailIcon />}
                fullWidth
                onClick={() => {
                  // Implement email functionality
                  ExportService.emailReport(exportConfig, ['farmer@example.com']);
                }}
              >
                Email Report
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Available Report Types
              </Typography>
              
              <List dense>
                {reportTypes.slice(0, 4).map((type) => (
                  <ListItem key={type.value}>
                    <ListItemIcon>
                      <ReportIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={type.label}
                      secondary={type.description}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Custom Export Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          📊 Custom Export Configuration
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={exportConfig.reportType}
                  label="Report Type"
                  onChange={(e) => setExportConfig({
                    ...exportConfig,
                    reportType: e.target.value
                  })}
                >
                  {reportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Export Format</InputLabel>
                <Select
                  value={exportConfig.format}
                  label="Export Format"
                  onChange={(e) => setExportConfig({
                    ...exportConfig,
                    format: e.target.value
                  })}
                >
                  {exportFormats.map((format) => (
                    <MenuItem key={format.value} value={format.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {format.icon}
                        {format.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Fields to Include</InputLabel>
                <Select
                  multiple
                  value={exportConfig.fields}
                  label="Fields to Include"
                  onChange={(e) => setExportConfig({
                    ...exportConfig,
                    fields: e.target.value
                  })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {['Field Alpha', 'Field Beta', 'Field Gamma'].map((field) => (
                    <MenuItem key={field} value={field}>
                      {field}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={exportConfig.dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setExportConfig({
                  ...exportConfig,
                  dateRange: { ...exportConfig.dateRange, start: new Date(e.target.value) }
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={exportConfig.dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setExportConfig({
                  ...exportConfig,
                  dateRange: { ...exportConfig.dateRange, end: new Date(e.target.value) }
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          
          {exportConfig.format === 'pdf' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              PDF reports include charts, graphs, and formatted layouts for professional presentation.
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <DownloadIcon />}
          >
            {loading ? 'Generating...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Reports Dialog */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          ⏰ Schedule Automated Reports
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={scheduleConfig.frequency}
                  label="Frequency"
                  onChange={(e) => setScheduleConfig({
                    ...scheduleConfig,
                    frequency: e.target.value
                  })}
                >
                  {frequencyOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Recipients"
                placeholder="farmer@example.com, agronomist@example.com"
                value={scheduleConfig.recipients.join(', ')}
                onChange={(e) => setScheduleConfig({
                  ...scheduleConfig,
                  recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                })}
                helperText="Separate multiple emails with commas"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Next Report Date"
                type="date"
                value={scheduleConfig.nextRun.toISOString().split('T')[0]}
                onChange={(e) => setScheduleConfig({
                  ...scheduleConfig,
                  nextRun: new Date(e.target.value)
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleScheduleReport}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <ScheduleIcon />}
          >
            {loading ? 'Scheduling...' : 'Schedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataExportReporting;
