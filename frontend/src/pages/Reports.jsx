import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
} from '@mui/material';
import { Assessment, Download } from '@mui/icons-material';
import Layout from '../components/layout/Layout';
import api from '../services/api';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('monthly');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports');
      const data = response.data?.data || response.data;
      setReports(Array.isArray(data) ? data : (data?.items || []));
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      await api.post('/reports/generate', {
        report_type: reportType,
        period_start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
        period_end: new Date().toISOString(),
      });
      fetchReports();
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Compliance Reports
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Generate and view compliance reports
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Generate New Report
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Report Type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="annual">Annual</MenuItem>
                <MenuItem value="on_demand">On Demand</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Assessment />}
                onClick={handleGenerateReport}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <Typography variant="h6" gutterBottom>
          Recent Reports
        </Typography>
        <Grid container spacing={3}>
          {reports.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No reports available. Generate your first report above.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            reports.map((report) => (
              <Grid item xs={12} md={6} key={report.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {report.report_type.replace('_', ' ').toUpperCase()} Report
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Generated: {new Date(report.generated_at).toLocaleDateString()}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Certificates
                        </Typography>
                        <Typography variant="h6">{report.total_certificates}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Active
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {report.active_certificates}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Expired
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {report.expired_certificates}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Expiring Soon
                        </Typography>
                        <Typography variant="h6" color="warning.main">
                          {report.expiring_soon}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Download />}
                      sx={{ mt: 2 }}
                      onClick={() => window.open(`/api/reports/${report.id}/download`, '_blank')}
                    >
                      Download Report
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Box>
    </Layout>
  );
};

export default Reports;
