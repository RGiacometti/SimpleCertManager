import React from 'react';
import { Container, Typography, Box, Paper, Grid } from '@mui/material';

const Dashboard = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" color="text.secondary">
              Total Certificates
            </Typography>
            <Typography variant="h3">
              0
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" color="text.secondary">
              Active Certificates
            </Typography>
            <Typography variant="h3">
              0
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" color="text.secondary">
              Expiring Soon
            </Typography>
            <Typography variant="h3">
              0
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" color="text.secondary">
              Pending Requests
            </Typography>
            <Typography variant="h3">
              0
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Welcome to SimpleCertManager
          </Typography>
          <Typography variant="body1" color="text.secondary">
            This is your Certificate Authority management dashboard. 
            Use the navigation menu to manage certificates, requests, and view reports.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;
