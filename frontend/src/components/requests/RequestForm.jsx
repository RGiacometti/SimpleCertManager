import React, { useState, useEffect } from 'react';
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
  Chip,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Close, Add, Delete } from '@mui/icons-material';
import api from '../../services/api';

const RequestForm = ({ open, onClose, onSuccess, caConfig }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    common_name: '',
    organization: '',
    organizational_unit: '',
    country: '',
    state: '',
    locality: '',
    email: '',
    san_dns: [],
    san_ip: [],
    key_size: 2048,
    validity_days: 365,
    notes: '',
  });
  const [newSanDns, setNewSanDns] = useState('');
  const [newSanIp, setNewSanIp] = useState('');

  // Update form defaults when caConfig changes
  useEffect(() => {
    if (caConfig) {
      setFormData(prev => ({
        ...prev,
        key_size: caConfig.default_key_size || 2048,
        validity_days: caConfig.default_validity_days || 365,
      }));
    }
  }, [caConfig]);

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setError(null);
  };

  const handleAddSanDns = () => {
    if (newSanDns.trim()) {
      setFormData({
        ...formData,
        san_dns: [...formData.san_dns, newSanDns.trim()],
      });
      setNewSanDns('');
    }
  };

  const handleRemoveSanDns = (index) => {
    setFormData({
      ...formData,
      san_dns: formData.san_dns.filter((_, i) => i !== index),
    });
  };

  const handleAddSanIp = () => {
    if (newSanIp.trim()) {
      setFormData({
        ...formData,
        san_ip: [...formData.san_ip, newSanIp.trim()],
      });
      setNewSanIp('');
    }
  };

  const handleRemoveSanIp = (index) => {
    setFormData({
      ...formData,
      san_ip: formData.san_ip.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Add any pending DNS/IP values before submitting
      const finalFormData = { ...formData };
      
      if (newSanDns.trim()) {
        finalFormData.san_dns = [...formData.san_dns, newSanDns.trim()];
      }
      
      if (newSanIp.trim()) {
        finalFormData.san_ip = [...formData.san_ip, newSanIp.trim()];
      }
      
      await api.post('/requests', finalFormData);
      onSuccess?.('Certificate request created successfully');
      onClose();
      // Reset form
      setFormData({
        common_name: '',
        organization: '',
        organizational_unit: '',
        country: '',
        state: '',
        locality: '',
        email: '',
        san_dns: [],
        san_ip: [],
        key_size: caConfig?.default_key_size || 2048,
        validity_days: caConfig?.default_validity_days || 365,
        notes: '',
      });
      setNewSanDns('');
      setNewSanIp('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">New Certificate Request</Typography>
            <IconButton onClick={onClose} size="small">
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
                Subject Information
              </Typography>
            </Grid>
            <Grid size={12}>
              <TextField
                required
                fullWidth
                label="Common Name (CN)"
                value={formData.common_name}
                onChange={handleChange('common_name')}
                helperText="e.g., example.com or *.example.com"
                disabled={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                required
                fullWidth
                label="Organization"
                value={formData.organization}
                onChange={handleChange('organization')}
                disabled={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Organizational Unit"
                value={formData.organizational_unit}
                onChange={handleChange('organizational_unit')}
                disabled={loading}
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
                disabled={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="State/Province"
                value={formData.state}
                onChange={handleChange('state')}
                disabled={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="City/Locality"
                value={formData.locality}
                onChange={handleChange('locality')}
                disabled={loading}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                required
                fullWidth
                type="email"
                label="Email"
                value={formData.email}
                onChange={handleChange('email')}
                disabled={loading}
              />
            </Grid>

            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Subject Alternative Names (SAN)
              </Typography>
            </Grid>
            <Grid size={12}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="DNS Name"
                  value={newSanDns}
                  onChange={(e) => setNewSanDns(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSanDns())}
                  placeholder="e.g., www.example.com"
                  disabled={loading}
                />
                <Button onClick={handleAddSanDns} disabled={loading}>
                  <Add />
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.san_dns.map((dns, index) => (
                  <Chip
                    key={index}
                    label={dns}
                    onDelete={() => handleRemoveSanDns(index)}
                    size="small"
                  />
                ))}
              </Box>
            </Grid>
            <Grid size={12}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="IP Address"
                  value={newSanIp}
                  onChange={(e) => setNewSanIp(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSanIp())}
                  placeholder="e.g., 192.168.1.1"
                  disabled={loading}
                />
                <Button onClick={handleAddSanIp} disabled={loading}>
                  <Add />
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.san_ip.map((ip, index) => (
                  <Chip
                    key={index}
                    label={ip}
                    onDelete={() => handleRemoveSanIp(index)}
                    size="small"
                  />
                ))}
              </Box>
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
                disabled={loading}
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
                label="Validity (Days)"
                value={formData.validity_days}
                onChange={handleChange('validity_days')}
                inputProps={{ min: 1, max: 825 }}
                disabled={loading}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={handleChange('notes')}
                placeholder="Additional notes or comments..."
                disabled={loading}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Creating...' : 'Create Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default RequestForm;
