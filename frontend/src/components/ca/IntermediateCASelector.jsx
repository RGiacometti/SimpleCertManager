import React, { useState, useEffect } from 'react';
import {
  TextField,
  MenuItem,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Chip,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import api from '../../services/api';

const IntermediateCASelector = ({
  value,
  onChange,
  showPassphrase = false,
  passphrase,
  onPassphraseChange,
  disabled = false,
  label = 'Signing CA',
  helperText = 'Select which CA should sign this certificate',
  size = 'medium',
}) => {
  const [activeCAs, setActiveCAs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const fetchActiveCAs = async () => {
      try {
        const response = await api.get('/intermediate-cas', { params: { status: 'active' } });
        const data = response.data?.data || response.data;
        const cas = Array.isArray(data) ? data : (data?.items || []);
        // Only show active, non-expired CAs
        const active = cas.filter((ca) => {
          if (ca.status !== 'active') return false;
          if (new Date(ca.not_after) < new Date()) return false;
          return true;
        });
        setActiveCAs(active);
      } catch (err) {
        console.error('Failed to fetch intermediate CAs:', err);
        setActiveCAs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveCAs();
  }, []);

  const selectedIsICA = value && value !== 'root';

  return (
    <Box>
      <TextField
        fullWidth
        select
        label={label}
        value={value || 'root'}
        onChange={(e) => onChange(e.target.value)}
        helperText={helperText}
        disabled={disabled || loading}
        size={size}
      >
        <MenuItem value="root">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">Root CA (direct)</Typography>
            <Chip label="Default" size="small" variant="outlined" />
          </Box>
        </MenuItem>
        {activeCAs.map((ca) => (
          <MenuItem key={ca.id} value={ca.id}>
            <Box>
              <Typography variant="body2">
                {ca.name || ca.common_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {ca.common_name}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        {!loading && activeCAs.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No active intermediate CAs available
            </Typography>
          </MenuItem>
        )}
      </TextField>

      {showPassphrase && selectedIsICA && (
        <TextField
          fullWidth
          type={showPass ? 'text' : 'password'}
          label="ICA Passphrase"
          value={passphrase || ''}
          onChange={(e) => onPassphraseChange?.(e.target.value)}
          disabled={disabled}
          size={size}
          sx={{ mt: 2 }}
          helperText="Passphrase for the selected intermediate CA"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPass(!showPass)}
                  edge="end"
                  disabled={disabled}
                  size="small"
                >
                  {showPass ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      )}
    </Box>
  );
};

export default IntermediateCASelector;
