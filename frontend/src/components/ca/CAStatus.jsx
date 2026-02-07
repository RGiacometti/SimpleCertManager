import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  Button,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { CheckCircle, Error, Security, Download, AccountTree } from '@mui/icons-material';
import DateDisplay from '../common/DateDisplay';
import api from '../../services/api';

const CAStatus = ({ caConfig }) => {
  const [icaStats, setIcaStats] = useState({ total: 0, active: 0, revoked: 0, expired: 0 });

  useEffect(() => {
    const fetchICAStats = async () => {
      try {
        const response = await api.get('/intermediate-cas');
        const data = response.data?.data || response.data;
        const cas = Array.isArray(data) ? data : (data?.items || []);
        const now = new Date();
        setIcaStats({
          total: cas.length,
          active: cas.filter((c) => c.status === 'active' && new Date(c.not_after) > now).length,
          revoked: cas.filter((c) => c.status === 'revoked').length,
          expired: cas.filter((c) => c.status !== 'revoked' && new Date(c.not_after) < now).length,
        });
      } catch (err) {
        // Silently fail - ICA stats are supplementary
        console.error('Failed to fetch ICA stats:', err);
      }
    };

    if (caConfig) {
      fetchICAStats();
    }
  }, [caConfig]);

  if (!caConfig) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Error color="error" />
            <Typography variant="h6">CA Not Initialized</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const isExpired = new Date(caConfig.ca_not_after) < new Date();
  const daysUntilExpiry = Math.floor(
    (new Date(caConfig.ca_not_after) - new Date()) / (1000 * 60 * 60 * 24)
  );

  const handleDownloadCACert = async () => {
    try {
      const response = await api.get('/ca/certificate', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/x-pem-file' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${caConfig.ca_name || 'ca'}-cert.pem`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download CA certificate:', error);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Security color="primary" fontSize="large" />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">Certificate Authority Status</Typography>
            <Typography variant="body2" color="text.secondary">
              {caConfig.ca_name}
            </Typography>
          </Box>
          <Chip
            icon={isExpired ? <Error /> : <CheckCircle />}
            label={isExpired ? 'Expired' : 'Active'}
            color={isExpired ? 'error' : 'success'}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Valid From
            </Typography>
            <DateDisplay date={caConfig.ca_not_before} format="PPP" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Valid Until
            </Typography>
            <DateDisplay date={caConfig.ca_not_after} format="PPP" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Days Until Expiry
            </Typography>
            <Typography
              variant="body1"
              color={daysUntilExpiry < 90 ? 'error' : 'text.primary'}
            >
              {daysUntilExpiry > 0 ? daysUntilExpiry : 0} days
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Certificates Issued
            </Typography>
            <Typography variant="body1">{caConfig.ca_serial_number || 0}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Default Validity
            </Typography>
            <Typography variant="body1">
              {caConfig.default_validity_days} days
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Default Key Size
            </Typography>
            <Typography variant="body1">{caConfig.default_key_size} bits</Typography>
          </Grid>
        </Grid>

        {/* Intermediate CA Summary */}
        {icaStats.total > 0 && (
          <>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AccountTree color="info" />
              <Typography variant="h6">Intermediate CAs</Typography>
            </Box>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="body1">{icaStats.total}</Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Active
                </Typography>
                <Typography variant="body1" color="success.main">
                  {icaStats.active}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Revoked
                </Typography>
                <Typography variant="body1" color="error.main">
                  {icaStats.revoked}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Expired
                </Typography>
                <Typography variant="body1" color="warning.main">
                  {icaStats.expired}
                </Typography>
              </Grid>
            </Grid>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handleDownloadCACert}
          fullWidth
        >
          Download CA Certificate
        </Button>
      </CardContent>
    </Card>
  );
};

export default CAStatus;
