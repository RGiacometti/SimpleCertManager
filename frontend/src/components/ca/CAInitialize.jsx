import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Grid,
  Alert,
  MenuItem,
} from '@mui/material';
import { Security } from '@mui/icons-material';
import api from '../../services/api';

const steps = ['CA Information', 'Security Settings', 'Confirmation'];

const CAInitialize = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    ca_name: '',
    organization: '',
    organizational_unit: '',
    country: '',
    state: '',
    locality: '',
    email: '',
    validity_years: 10,
    key_size: 4096,
    passphrase: '',
    passphrase_confirm: '',
  });

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError(null);
  };

  const handleNext = () => {
    if (activeStep === 1) {
      // Validate passphrase
      if (formData.passphrase !== formData.passphrase_confirm) {
        setError('Passphrases do not match');
        return;
      }
      if (formData.passphrase.length < 12) {
        setError('Passphrase must be at least 12 characters');
        return;
      }
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.post('/ca/initialize', formData);
      // Clear passphrase from memory
      setFormData({ ...formData, passphrase: '', passphrase_confirm: '' });
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize CA');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="CA Name"
                value={formData.ca_name}
                onChange={handleChange('ca_name')}
                helperText="e.g., My Company Root CA"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Organization"
                value={formData.organization}
                onChange={handleChange('organization')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Organizational Unit"
                value={formData.organizational_unit}
                onChange={handleChange('organizational_unit')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                required
                fullWidth
                label="Country Code"
                value={formData.country}
                onChange={handleChange('country')}
                inputProps={{ maxLength: 2 }}
                helperText="2-letter code (e.g., US)"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State/Province"
                value={formData.state}
                onChange={handleChange('state')}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City/Locality"
                value={formData.locality}
                onChange={handleChange('locality')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                type="email"
                label="Email"
                value={formData.email}
                onChange={handleChange('email')}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="Key Size"
                value={formData.key_size}
                onChange={handleChange('key_size')}
                helperText="Larger keys are more secure but slower"
              >
                <MenuItem value={2048}>2048 bits</MenuItem>
                <MenuItem value={4096}>4096 bits (Recommended)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Validity (Years)"
                value={formData.validity_years}
                onChange={handleChange('validity_years')}
                inputProps={{ min: 1, max: 20 }}
                helperText="How long the CA certificate will be valid"
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>Important:</strong> The passphrase protects your CA private key. 
                It will be required for all certificate operations. Store it securely!
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                type="password"
                label="CA Passphrase"
                value={formData.passphrase}
                onChange={handleChange('passphrase')}
                helperText="Minimum 12 characters. Use a strong passphrase!"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                type="password"
                label="Confirm Passphrase"
                value={formData.passphrase_confirm}
                onChange={handleChange('passphrase_confirm')}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Please review your CA configuration before proceeding.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  CA Name
                </Typography>
                <Typography variant="body1">{formData.ca_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Organization
                </Typography>
                <Typography variant="body1">{formData.organization}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{formData.email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Key Size
                </Typography>
                <Typography variant="body1">{formData.key_size} bits</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Validity
                </Typography>
                <Typography variant="body1">{formData.validity_years} years</Typography>
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Security color="primary" fontSize="large" />
          <Box>
            <Typography variant="h5" component="h2">
              Initialize Certificate Authority
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Set up your CA to start issuing certificates
            </Typography>
          </Box>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>{renderStepContent(activeStep)}</Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button disabled={activeStep === 0 || loading} onClick={handleBack}>
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Initializing...' : 'Initialize CA'}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CAInitialize;
