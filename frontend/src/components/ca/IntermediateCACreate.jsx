import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Alert,
  InputAdornment,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Close, Visibility, VisibilityOff } from '@mui/icons-material';

const IntermediateCACreate = ({ open, onClose, onSubmit, loading: externalLoading }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showRootPassphrase, setShowRootPassphrase] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    common_name: '',
    organization: '',
    organizational_unit: '',
    country: '',
    state: '',
    locality: '',
    key_size: 4096,
    validity_years: 5,
    passphrase: '',
    root_passphrase: '',
  });

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        name: '',
        common_name: '',
        organization: '',
        organizational_unit: '',
        country: '',
        state: '',
        locality: '',
        key_size: 4096,
        validity_years: 5,
        passphrase: '',
        root_passphrase: '',
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create intermediate CA');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setFormData((prev) => ({ ...prev, passphrase: '', root_passphrase: '' }));
    setShowPassphrase(false);
    setShowRootPassphrase(false);
    onClose();
  };

  const isLoading = loading || externalLoading;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Create Intermediate CA</Typography>
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom>
                Intermediate CA Information
              </Typography>
            </Grid>

            <Grid size={12}>
              <TextField
                required
                fullWidth
                label="Display Name"
                value={formData.name}
                onChange={handleChange('name')}
                helperText="A friendly name for this intermediate CA"
                disabled={isLoading}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                required
                fullWidth
                label="Common Name (CN)"
                value={formData.common_name}
                onChange={handleChange('common_name')}
                helperText="e.g., My Organization Intermediate CA"
                disabled={isLoading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                required
                fullWidth
                label="Organization"
                value={formData.organization}
                onChange={handleChange('organization')}
                disabled={isLoading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Organizational Unit"
                value={formData.organizational_unit}
                onChange={handleChange('organizational_unit')}
                disabled={isLoading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                required
                fullWidth
                label="Country Code"
                value={formData.country}
                onChange={handleChange('country')}
                inputProps={{ maxLength: 2 }}
                helperText="2-letter code"
                disabled={isLoading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="State/Province"
                value={formData.state}
                onChange={handleChange('state')}
                disabled={isLoading}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="City/Locality"
                value={formData.locality}
                onChange={handleChange('locality')}
                disabled={isLoading}
              />
            </Grid>

            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Certificate Settings
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                required
                fullWidth
                select
                label="Key Size"
                value={formData.key_size}
                onChange={handleChange('key_size')}
                disabled={isLoading}
              >
                <MenuItem value={2048}>2048 bits</MenuItem>
                <MenuItem value={4096}>4096 bits</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                required
                fullWidth
                type="number"
                label="Validity (Years)"
                value={formData.validity_years}
                onChange={handleChange('validity_years')}
                inputProps={{ min: 1, max: 10 }}
                helperText="1-10 years"
                disabled={isLoading}
              />
            </Grid>

            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Security
              </Typography>
            </Grid>

            <Grid size={12}>
              <TextField
                required
                fullWidth
                type={showPassphrase ? 'text' : 'password'}
                label="ICA Passphrase"
                value={formData.passphrase}
                onChange={handleChange('passphrase')}
                helperText="Passphrase to protect the intermediate CA private key"
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassphrase(!showPassphrase)}
                        edge="end"
                        disabled={isLoading}
                      >
                        {showPassphrase ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                required
                fullWidth
                type={showRootPassphrase ? 'text' : 'password'}
                label="Root CA Passphrase"
                value={formData.root_passphrase}
                onChange={handleChange('root_passphrase')}
                helperText="Root CA passphrase required to sign the intermediate CA certificate"
                disabled={isLoading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowRootPassphrase(!showRootPassphrase)}
                        edge="end"
                        disabled={isLoading}
                      >
                        {showRootPassphrase ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !formData.common_name || !formData.passphrase || !formData.root_passphrase}
          >
            {isLoading ? 'Creating...' : 'Create Intermediate CA'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default IntermediateCACreate;
