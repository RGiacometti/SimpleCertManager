import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Close, ContentCopy, Download, Link as LinkIcon } from '@mui/icons-material';
import StatusChip from '../common/StatusChip';
import DateDisplay from '../common/DateDisplay';
import api from '../../services/api';

const CertificateDetails = ({ certificate, open, onClose }) => {
  if (!certificate) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const isExpired = new Date(certificate.not_after) < new Date();
  const isExpiringSoon =
    !isExpired &&
    new Date(certificate.not_after) - new Date() < 30 * 24 * 60 * 60 * 1000;

  const getStatus = () => {
    if (certificate.status === 'revoked') return 'revoked';
    if (isExpired) return 'expired';
    if (isExpiringSoon) return 'expiring_soon';
    return 'active';
  };

  const handleDownloadChain = async () => {
    try {
      const response = await api.get(`/certificates/${certificate.id}/download-chain`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/x-pem-file' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${certificate.common_name}-chain.pem`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download chain:', error);
    }
  };

  const getIssuingCALabel = () => {
    if (certificate.issuing_ca_id) {
      return certificate.issuing_ca_name || `Intermediate CA (${certificate.issuing_ca_id})`;
    }
    return 'Root CA';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Certificate Details</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
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
            <Typography variant="body1">{certificate.common_name}</Typography>
          </Grid>

          {certificate.subject?.organization && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Organization
              </Typography>
              <Typography variant="body1">{certificate.subject.organization}</Typography>
            </Grid>
          )}

          {certificate.subject?.organizational_unit && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Organizational Unit
              </Typography>
              <Typography variant="body1">
                {certificate.subject.organizational_unit}
              </Typography>
            </Grid>
          )}

          {certificate.subject?.country && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Country
              </Typography>
              <Typography variant="body1">{certificate.subject.country}</Typography>
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
                {certificate.serial_number}
              </Typography>
              <IconButton
                size="small"
                onClick={() => copyToClipboard(certificate.serial_number)}
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Fingerprint (SHA-256)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
              >
                {certificate.fingerprint_sha256?.substring(0, 32)}...
              </Typography>
              <IconButton
                size="small"
                onClick={() => copyToClipboard(certificate.fingerprint_sha256)}
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Valid From
            </Typography>
            <DateDisplay date={certificate.not_before} format="PPpp" />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Valid Until
            </Typography>
            <DateDisplay date={certificate.not_after} format="PPpp" />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Issued At
            </Typography>
            <DateDisplay date={certificate.issued_at} format="PPpp" showRelative />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Issued By
            </Typography>
            <Chip
              label={getIssuingCALabel()}
              size="small"
              color={certificate.issuing_ca_id ? 'info' : 'default'}
              variant="outlined"
            />
          </Grid>

          {certificate.revoked_at && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Revoked At
                </Typography>
                <DateDisplay date={certificate.revoked_at} format="PPpp" showRelative />
              </Grid>
              {certificate.revocation_reason && (
                <Grid size={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Revocation Reason
                  </Typography>
                  <Chip label={certificate.revocation_reason} color="error" size="small" />
                </Grid>
              )}
            </>
          )}

          {/* Issuer Information */}
          {certificate.issuer && (
            <>
              <Grid size={12}>
                <Divider />
              </Grid>
              <Grid size={12}>
                <Typography variant="h6" gutterBottom>
                  Issuer Information
                </Typography>
              </Grid>
              <Grid size={12}>
                <Typography variant="body2">
                  {certificate.issuer.common_name || 'Certificate Authority'}
                </Typography>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          startIcon={<LinkIcon />}
          onClick={handleDownloadChain}
          size="small"
        >
          Download Chain
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CertificateDetails;
