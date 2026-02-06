import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Alert,
  MenuItem,
} from '@mui/material';
import { Settings, Save } from '@mui/icons-material';
import api from '../../services/api';

const CAConfig = ({ caConfig, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    default_validity_days: 365,
    default_key_size: 2048,
    crl_distribution_point: '',
  });

  useEffect(() => {
    if (caConfig) {
      setFormData({
        default_validity_days: caConfig.default_validity_days || 365,
        default_key_size: caConfig.default_key_size || 2048,
        crl_distribution_point: caConfig.crl_distribution_point || '',
      });
    }
  }, [caConfig]);

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.put('/ca/config', formData);
      setSuccess(true);
      if (onUpdate) {
        onUpdate(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  if (!caConfig) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            CA must be initialized before configuration can be updated.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Settings color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6">CA Configuration</Typography>
            <Typography variant="body2" color="text.secondary">
              Update default settings for certificate issuance
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Configuration updated successfully
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Default Validity (Days)"
                value={formData.default_validity_days}
                onChange={handleChange('default_validity_days')}
                inputProps={{ min: 1, max: 825 }}
                helperText="Default validity period for new certificates"
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="Default Key Size"
                value={formData.default_key_size}
                onChange={handleChange('default_key_size')}
                helperText="Default key size for new certificates"
                disabled={loading}
              >
                <MenuItem value={2048}>2048 bits</MenuItem>
                <MenuItem value={4096}>4096 bits</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="CRL Distribution Point"
                value={formData.crl_distribution_point}
                onChange={handleChange('crl_distribution_point')}
                helperText="URL where the Certificate Revocation List can be accessed"
                placeholder="https://example.com/crl"
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Configuration'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default CAConfig;
