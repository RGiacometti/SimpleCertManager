import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Snackbar, Alert } from '@mui/material';
import Layout from '../components/layout/Layout';
import CAStatus from '../components/ca/CAStatus';
import CAConfig from '../components/ca/CAConfig';
import CAInitialize from '../components/ca/CAInitialize';
import api from '../services/api';

const Settings = () => {
  const [caConfig, setCAConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCAConfig();
  }, []);

  const fetchCAConfig = async () => {
    setLoading(true);
    try {
      const response = await api.get('/ca/config');
      setCAConfig(response.data);
    } catch (error) {
      // CA might not be initialized yet
      console.log('CA not initialized');
    } finally {
      setLoading(false);
    }
  };

  const handleCAInitialized = () => {
    setSnackbar({ open: true, message: 'CA initialized successfully', severity: 'success' });
    fetchCAConfig();
  };

  const handleConfigUpdate = (updatedConfig) => {
    setCAConfig(updatedConfig);
    setSnackbar({ open: true, message: 'Configuration updated successfully', severity: 'success' });
  };

  return (
    <Layout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure your Certificate Authority and system settings
        </Typography>

        <Grid container spacing={3}>
          {!loading && !caConfig ? (
            <Grid item xs={12}>
              <CAInitialize onComplete={handleCAInitialized} />
            </Grid>
          ) : (
            <>
              <Grid item xs={12}>
                <CAStatus caConfig={caConfig} />
              </Grid>
              <Grid item xs={12}>
                <CAConfig caConfig={caConfig} onUpdate={handleConfigUpdate} />
              </Grid>
            </>
          )}
        </Grid>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default Settings;
