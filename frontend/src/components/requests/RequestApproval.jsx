import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { CheckCircle, Cancel } from '@mui/icons-material';
import StatusChip from '../common/StatusChip';
import DateDisplay from '../common/DateDisplay';
import PassphraseDialog from '../ca/PassphraseDialog';
import IntermediateCASelector from '../ca/IntermediateCASelector';
import api from '../../services/api';

const RequestApproval = ({ request, open, onClose, onUpdate }) => {
  const [action, setAction] = useState(null); // 'approve', 'reject', 'issue'
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passphraseDialogOpen, setPassphraseDialogOpen] = useState(false);
  const [passphraseError, setPassphraseError] = useState(null);
  const [issuingCaId, setIssuingCaId] = useState('root');
  const [icaPassphrase, setIcaPassphrase] = useState('');

  if (!request) return null;

  const handleApprove = async () => {
    setLoading(true);
    setError(null);

    try {
      const body = { notes };
      if (issuingCaId && issuingCaId !== 'root') {
        body.issuing_ca_id = issuingCaId;
      }
      await api.post(`/requests/${request.id}/approve`, body);
      onUpdate?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.post(`/requests/${request.id}/reject`, { notes });
      onUpdate?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueClick = () => {
    setAction('issue');
    setPassphraseDialogOpen(true);
  };

  const handlePassphraseSubmit = async (passphrase) => {
    setLoading(true);
    setPassphraseError(null);

    try {
      const body = { passphrase };
      if (issuingCaId && issuingCaId !== 'root') {
        body.issuing_ca_id = issuingCaId;
        body.ica_passphrase = icaPassphrase;
      }
      await api.post(`/certificates/issue/${request.id}`, body);
      setPassphraseDialogOpen(false);
      setIcaPassphrase('');
      onUpdate?.();
      onClose();
    } catch (err) {
      setPassphraseError(err.response?.data?.message || 'Failed to issue certificate');
    } finally {
      setLoading(false);
    }
  };

  const canApprove = request.status === 'pending';
  const canIssue = request.status === 'approved';

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Request Details</Typography>
            <StatusChip status={request.status} type="request" />
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
              <Typography variant="h6" gutterBottom>
                Subject Information
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Common Name
              </Typography>
              <Typography variant="body1">{request.common_name}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Organization
              </Typography>
              <Typography variant="body1">{request.organization || '-'}</Typography>
            </Grid>
            {request.organizational_unit && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Organizational Unit
                </Typography>
                <Typography variant="body1">{request.organizational_unit}</Typography>
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">{request.email}</Typography>
            </Grid>

            <Grid size={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            <Grid size={12}>
              <Typography variant="h6" gutterBottom>
                Certificate Settings
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Key Size
              </Typography>
              <Typography variant="body1">{request.key_size} bits</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Validity
              </Typography>
              <Typography variant="body1">{request.validity_days} days</Typography>
            </Grid>

            {(request.san_dns?.length > 0 || request.san_ip?.length > 0) && (
              <>
                <Grid size={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid size={12}>
                  <Typography variant="h6" gutterBottom>
                    Subject Alternative Names
                  </Typography>
                </Grid>
                {request.san_dns?.length > 0 && (
                  <Grid size={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      DNS Names
                    </Typography>
                    <Typography variant="body2">
                      {request.san_dns.join(', ')}
                    </Typography>
                  </Grid>
                )}
                {request.san_ip?.length > 0 && (
                  <Grid size={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      IP Addresses
                    </Typography>
                    <Typography variant="body2">
                      {request.san_ip.join(', ')}
                    </Typography>
                  </Grid>
                )}
              </>
            )}

            <Grid size={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Requested At
              </Typography>
              <DateDisplay date={request.requested_at} format="PPpp" />
            </Grid>

            {request.notes && (
              <Grid size={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body2">{request.notes}</Typography>
              </Grid>
            )}

            {/* Signing CA Selector */}
            {(canApprove || canIssue) && (
              <>
                <Grid size={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid size={12}>
                  <Typography variant="h6" gutterBottom>
                    Signing Authority
                  </Typography>
                </Grid>
                <Grid size={12}>
                  <IntermediateCASelector
                    value={issuingCaId}
                    onChange={setIssuingCaId}
                    showPassphrase={canIssue}
                    passphrase={icaPassphrase}
                    onPassphraseChange={setIcaPassphrase}
                    disabled={loading}
                    helperText="Select which CA should sign this certificate"
                  />
                </Grid>
              </>
            )}

            {(canApprove || canIssue) && (
              <Grid size={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Additional Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for this action..."
                  disabled={loading}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Close
          </Button>
          {canApprove && (
            <>
              <Button
                onClick={handleReject}
                color="error"
                startIcon={<Cancel />}
                disabled={loading}
              >
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                color="success"
                variant="contained"
                startIcon={<CheckCircle />}
                disabled={loading}
              >
                {loading ? 'Approving...' : 'Approve'}
              </Button>
            </>
          )}
          {canIssue && (
            <Button
              onClick={handleIssueClick}
              color="primary"
              variant="contained"
              disabled={loading}
            >
              Issue Certificate
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <PassphraseDialog
        open={passphraseDialogOpen}
        onClose={() => {
          setPassphraseDialogOpen(false);
          setPassphraseError(null);
        }}
        onSubmit={handlePassphraseSubmit}
        loading={loading}
        error={passphraseError}
        title="Issue Certificate"
        message={
          issuingCaId && issuingCaId !== 'root'
            ? 'Enter the Root CA passphrase to issue this certificate via the selected intermediate CA.'
            : 'Enter the CA passphrase to issue this certificate.'
        }
      />
    </>
  );
};

export default RequestApproval;
