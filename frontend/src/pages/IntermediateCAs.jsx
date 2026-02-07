import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Add, Visibility, VisibilityOff } from '@mui/icons-material';
import Layout from '../components/layout/Layout';
import IntermediateCAList from '../components/ca/IntermediateCAList';
import IntermediateCACreate from '../components/ca/IntermediateCACreate';
import IntermediateCADetails from '../components/ca/IntermediateCADetails';
import useIntermediateCAs from '../hooks/useIntermediateCAs';

const IntermediateCAs = () => {
  const {
    intermediateCAs,
    loading,
    refetch,
    createIntermediateCA,
    updateIntermediateCA,
    revokeIntermediateCA,
    downloadCertificate,
    downloadChain,
  } = useIntermediateCAs();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedICA, setSelectedICA] = useState(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [revokeData, setRevokeData] = useState({ root_passphrase: '', reason: '' });
  const [showRevokePassphrase, setShowRevokePassphrase] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleView = (ica) => {
    setSelectedICA(ica);
    setDetailsOpen(true);
  };

  const handleDownloadCert = async (ica) => {
    try {
      await downloadCertificate(ica.id, `${ica.common_name}.crt`);
      setSnackbar({ open: true, message: 'Certificate downloaded', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Download failed', severity: 'error' });
    }
  };

  const handleDownloadChain = async (ica) => {
    try {
      await downloadChain(ica.id, `${ica.common_name}-chain.pem`);
      setSnackbar({ open: true, message: 'Chain downloaded', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Download failed', severity: 'error' });
    }
  };

  const handleRevokeClick = (ica) => {
    setSelectedICA(ica);
    setRevokeData({ root_passphrase: '', reason: '' });
    setShowRevokePassphrase(false);
    setRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = async () => {
    setRevokeLoading(true);
    try {
      await revokeIntermediateCA(selectedICA.id, revokeData);
      setRevokeDialogOpen(false);
      setDetailsOpen(false);
      setSnackbar({ open: true, message: 'Intermediate CA revoked successfully', severity: 'success' });
      refetch();
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Revocation failed', severity: 'error' });
    } finally {
      setRevokeLoading(false);
      setRevokeData({ root_passphrase: '', reason: '' });
    }
  };

  const handleCreate = async (data) => {
    await createIntermediateCA(data);
    setSnackbar({ open: true, message: 'Intermediate CA created successfully', severity: 'success' });
  };

  const handleUpdate = async (id, data) => {
    await updateIntermediateCA(id, data);
    setSnackbar({ open: true, message: 'Intermediate CA updated', severity: 'success' });
    // Refresh the selected ICA data
    const updated = intermediateCAs.find((ica) => ica.id === id);
    if (updated) {
      setSelectedICA({ ...updated, ...data });
    }
  };

  return (
    <Layout>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Intermediate CAs
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage intermediate certificate authorities for hierarchical PKI
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateOpen(true)}
          >
            Create ICA
          </Button>
        </Box>

        <IntermediateCAList
          intermediateCAs={intermediateCAs}
          loading={loading}
          onView={handleView}
          onDownloadCert={handleDownloadCert}
          onDownloadChain={handleDownloadChain}
          onRevoke={handleRevokeClick}
        />

        <IntermediateCACreate
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />

        <IntermediateCADetails
          ica={selectedICA}
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          onDownloadCert={handleDownloadCert}
          onDownloadChain={handleDownloadChain}
          onRevoke={handleRevokeClick}
          onUpdate={handleUpdate}
        />

        {/* Revoke Confirmation Dialog */}
        <Dialog
          open={revokeDialogOpen}
          onClose={() => !revokeLoading && setRevokeDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Revoke Intermediate CA</DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Revoking this intermediate CA will also revoke all certificates issued by it.
              This action cannot be undone.
            </Alert>
            {selectedICA && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                You are about to revoke: <strong>{selectedICA.name || selectedICA.common_name}</strong>
              </Typography>
            )}
            <TextField
              fullWidth
              label="Reason for Revocation"
              value={revokeData.reason}
              onChange={(e) => setRevokeData({ ...revokeData, reason: e.target.value })}
              disabled={revokeLoading}
              sx={{ mb: 2 }}
              placeholder="e.g., Key compromise, CA superseded"
            />
            <TextField
              required
              fullWidth
              type={showRevokePassphrase ? 'text' : 'password'}
              label="Root CA Passphrase"
              value={revokeData.root_passphrase}
              onChange={(e) => setRevokeData({ ...revokeData, root_passphrase: e.target.value })}
              disabled={revokeLoading}
              helperText="Root CA passphrase is required to revoke an intermediate CA"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowRevokePassphrase(!showRevokePassphrase)}
                      edge="end"
                      disabled={revokeLoading}
                    >
                      {showRevokePassphrase ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setRevokeDialogOpen(false)}
              disabled={revokeLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRevokeConfirm}
              color="error"
              variant="contained"
              disabled={revokeLoading || !revokeData.root_passphrase}
            >
              {revokeLoading ? 'Revoking...' : 'Revoke'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default IntermediateCAs;
