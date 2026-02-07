import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  IconButton,
  TextField,
  Alert,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Close,
  ContentCopy,
  Download,
  Link as LinkIcon,
  Block,
  Edit,
  Save,
  Cancel,
} from '@mui/icons-material';
import StatusChip from '../common/StatusChip';
import DateDisplay from '../common/DateDisplay';

const IntermediateCADetails = ({
  ica,
  open,
  onClose,
  onDownloadCert,
  onDownloadChain,
  onRevoke,
  onUpdate,
}) => {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [updateError, setUpdateError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    if (ica) {
      setEditName(ica.name || '');
    }
    setEditing(false);
    setUpdateError(null);
  }, [ica]);

  if (!ica) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const isExpired = new Date(ica.not_after) < new Date();
  const isExpiringSoon =
    !isExpired &&
    (new Date(ica.not_after) - new Date()) < 90 * 24 * 60 * 60 * 1000;

  const getStatus = () => {
    if (ica.status === 'revoked') return 'revoked';
    if (isExpired) return 'expired';
    if (isExpiringSoon) return 'expiring_soon';
    return 'active';
  };

  const handleSaveName = async () => {
    setUpdateLoading(true);
    setUpdateError(null);
    try {
      await onUpdate(ica.id, { name: editName });
      setEditing(false);
    } catch (err) {
      setUpdateError(err.message || 'Failed to update name');
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Intermediate CA Details</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {updateError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {updateError}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Status */}
          <Grid size={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Status:
              </Typography>
              <StatusChip status={getStatus()} type="certificate" />
            </Box>
          </Grid>

          {/* Name (editable) */}
          <Grid size={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {editing ? (
                <>
                  <TextField
                    size="small"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    label="Display Name"
                    disabled={updateLoading}
                    sx={{ flexGrow: 1 }}
                  />
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={handleSaveName}
                    disabled={updateLoading}
                  >
                    <Save />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditing(false);
                      setEditName(ica.name || '');
                    }}
                    disabled={updateLoading}
                  >
                    <Cancel />
                  </IconButton>
                </>
              ) : (
                <>
                  <Typography variant="subtitle2" color="text.secondary">
                    Name:
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {ica.name || ica.common_name}
                  </Typography>
                  <IconButton size="small" onClick={() => setEditing(true)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </>
              )}
            </Box>
          </Grid>

          <Grid size={12}>
            <Divider />
          </Grid>

          {/* Subject Information */}
          <Grid size={12}>
            <Typography variant="h6" gutterBottom>
              Subject Information
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Common Name
            </Typography>
            <Typography variant="body1">{ica.common_name}</Typography>
          </Grid>

          {ica.organization && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Organization
              </Typography>
              <Typography variant="body1">{ica.organization}</Typography>
            </Grid>
          )}

          {ica.organizational_unit && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Organizational Unit
              </Typography>
              <Typography variant="body1">{ica.organizational_unit}</Typography>
            </Grid>
          )}

          {ica.country && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Country
              </Typography>
              <Typography variant="body1">{ica.country}</Typography>
            </Grid>
          )}

          {ica.state && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                State/Province
              </Typography>
              <Typography variant="body1">{ica.state}</Typography>
            </Grid>
          )}

          {ica.locality && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Locality
              </Typography>
              <Typography variant="body1">{ica.locality}</Typography>
            </Grid>
          )}

          <Grid size={12}>
            <Divider />
          </Grid>

          {/* Certificate Information */}
          <Grid size={12}>
            <Typography variant="h6" gutterBottom>
              Certificate Information
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Serial Number
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {ica.serial_number}
              </Typography>
              {ica.serial_number && (
                <IconButton
                  size="small"
                  onClick={() => copyToClipboard(ica.serial_number)}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Grid>

          {ica.fingerprint_sha256 && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Fingerprint (SHA-256)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                >
                  {ica.fingerprint_sha256?.substring(0, 32)}...
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => copyToClipboard(ica.fingerprint_sha256)}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Box>
            </Grid>
          )}

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Key Size
            </Typography>
            <Typography variant="body1">{ica.key_size || 4096} bits</Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Valid From
            </Typography>
            <DateDisplay date={ica.not_before} format="PPpp" />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Valid Until
            </Typography>
            <DateDisplay date={ica.not_after} format="PPpp" />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Created At
            </Typography>
            <DateDisplay date={ica.created_at} format="PPpp" showRelative />
          </Grid>

          {ica.status === 'revoked' && ica.revoked_at && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Revoked At
                </Typography>
                <DateDisplay date={ica.revoked_at} format="PPpp" showRelative />
              </Grid>
              {ica.revocation_reason && (
                <Grid size={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Revocation Reason
                  </Typography>
                  <Chip label={ica.revocation_reason} color="error" size="small" />
                </Grid>
              )}
            </>
          )}

          <Grid size={12}>
            <Divider />
          </Grid>

          {/* Statistics */}
          <Grid size={12}>
            <Typography variant="h6" gutterBottom>
              Statistics
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Certificates Issued
            </Typography>
            <Typography variant="body1">{ica.certificates_issued ?? 0}</Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<Download />}
              onClick={() => onDownloadCert(ica)}
              size="small"
            >
              Certificate
            </Button>
            <Button
              startIcon={<LinkIcon />}
              onClick={() => onDownloadChain(ica)}
              size="small"
            >
              Full Chain
            </Button>
            {getStatus() === 'active' && (
              <Button
                startIcon={<Block />}
                color="error"
                onClick={() => onRevoke(ica)}
                size="small"
              >
                Revoke
              </Button>
            )}
          </Box>
          <Button onClick={onClose}>Close</Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default IntermediateCADetails;
