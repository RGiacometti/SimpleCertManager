import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import {
  Description,
  Warning,
  CheckCircle,
  Assignment,
} from '@mui/icons-material';
import Layout from '../components/layout/Layout';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCertificates: 0,
    activeCertificates: 0,
    expiringSoon: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [certsResponse, requestsResponse, expiringResponse] = await Promise.all([
        api.get('/certificates'),
        api.get('/requests'),
        api.get('/certificates/expiring'),
      ]);

      // Extract data from paginated responses
      const certsData = certsResponse.data?.data || certsResponse.data;
      const requestsData = requestsResponse.data?.data || requestsResponse.data;
      const expiringData = expiringResponse.data?.data || expiringResponse.data;

      const certificates = Array.isArray(certsData) ? certsData : (certsData?.items || []);
      const requests = Array.isArray(requestsData) ? requestsData : (requestsData?.items || []);
      const expiring = Array.isArray(expiringData) ? expiringData : (expiringData?.items || []);

      setStats({
        totalCertificates: certificates.length,
        activeCertificates: certificates.filter((c) => c.status === 'active').length,
        expiringSoon: expiring.length,
        pendingRequests: requests.filter((r) => r.status === 'pending').length,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary' }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Overview of your certificate management system
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Certificates"
              value={stats.totalCertificates}
              icon={<Description color="primary" />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Certificates"
              value={stats.activeCertificates}
              icon={<CheckCircle color="success" />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Expiring Soon"
              value={stats.expiringSoon}
              icon={<Warning color="warning" />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Requests"
              value={stats.pendingRequests}
              icon={<Assignment color="info" />}
              color="info"
            />
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use the navigation menu to manage certificates, review requests, generate reports, or configure your CA.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
};

export default Dashboard;
