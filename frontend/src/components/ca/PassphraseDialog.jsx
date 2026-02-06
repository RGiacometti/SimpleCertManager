import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock } from '@mui/icons-material';

/**
 * CRITICAL SECURITY COMPONENT
 * This dialog collects the CA passphrase for signing operations.
 * 
 * SECURITY REQUIREMENTS:
 * - Passphrase is NEVER stored in state after submission
 * - Passphrase is cleared from memory immediately after use
 * - No logging of passphrase
 * - Component unmounts clear all sensitive data
 */
const PassphraseDialog = ({
  open,
  onClose,
  onSubmit,
  title = 'CA Passphrase Required',
  message = 'Enter the CA private key passphrase to proceed with this operation.',
  loading = false,
  error = null,
}) => {
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);

  // Clear passphrase when dialog closes
  useEffect(() => {
    if (!open) {
      setPassphrase('');
      setShowPassphrase(false);
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passphrase.trim()) {
      // Pass passphrase to parent and immediately clear it
      onSubmit(passphrase);
      // Clear passphrase from local state immediately
      setPassphrase('');
    }
  };

  const handleClose = () => {
    // Clear passphrase before closing
    setPassphrase('');
    setShowPassphrase(false);
    onClose();
  };

  const handleToggleVisibility = () => {
    setShowPassphrase(!showPassphrase);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Lock color="warning" />
          {title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {message}
          </DialogContentText>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            autoFocus
            required
            fullWidth
            type={showPassphrase ? 'text' : 'password'}
            label="CA Passphrase"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            disabled={loading}
            placeholder="Enter CA passphrase"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle passphrase visibility"
                    onClick={handleToggleVisibility}
                    edge="end"
                    disabled={loading}
                  >
                    {showPassphrase ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            helperText="This passphrase will not be stored and must be provided for each operation"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !passphrase.trim()}
          >
            {loading ? 'Processing...' : 'Submit'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PassphraseDialog;
