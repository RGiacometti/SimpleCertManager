import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Download,
  Block,
  Autorenew,
  MoreVert,
  GetApp,
  FolderZip,
} from '@mui/icons-material';
import ConfirmDialog from '../common/ConfirmDialog';
import PassphraseDialog from '../ca/PassphraseDialog';
import api from '../../services/api';

const CertificateActions = ({ certificate, onUpdate, onError, onSuccess }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [passphraseDialogOpen, setPassphraseDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passphraseError, setPassphraseError] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDownloadCert = async () => {
    handleMenuClose();
    try {
      const response = await api.get(`/certificates/${certificate.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${certificate.common_name}.crt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      onSuccess?.('Certificate downloaded successfully');
    } catch (error) {
      onError?.(error.response?.data?.message || 'Failed to download certificate');
    }
  };

  const handleDownloadKey = async () => {
    handleMenuClose();
    try {
      const response = await api.get(`/certificates/${certificate.id}/download-key`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${certificate.common_name}.key`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      onSuccess?.('Private key downloaded successfully');
    } catch (error) {
      onError?.(error.response?.data?.message || 'Failed to download private key');
    }
  };

  const handleDownloadBundle = async () => {
    handleMenuClose();
    try {
      const response = await api.get(`/certificates/${certificate.id}/download-bundle`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${certificate.common_name}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      onSuccess?.('Bundle downloaded successfully');
    } catch (error) {
      onError?.(error.response?.data?.message || 'Failed to download bundle');
    }
  };

  const handleRevokeClick = () => {
    handleMenuClose();
    setRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = () => {
    setRevokeDialogOpen(false);
    setCurrentAction('revoke');
    setPassphraseDialogOpen(true);
  };

  const handleRenewClick = () => {
    handleMenuClose();
    setRenewDialogOpen(true);
  };

  const handleRenewConfirm = () => {
    setRenewDialogOpen(false);
    setCurrentAction('renew');
    setPassphraseDialogOpen(true);
  };

  const handlePassphraseSubmit = async (passphrase) => {
    setLoading(true);
    setPassphraseError(null);

    try {
      if (currentAction === 'revoke') {
        await api.post(`/certificates/${certificate.id}/revoke`, {
          passphrase,
          reason: 'unspecified',
        });
        onSuccess?.('Certificate revoked successfully');
      } else if (currentAction === 'renew') {
        await api.post(`/certificates/${certificate.id}/renew`, { passphrase });
        onSuccess?.('Certificate renewed successfully');
      }
      setPassphraseDialogOpen(false);
      setCurrentAction(null);
      onUpdate?.();
    } catch (error) {
      setPassphraseError(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const isActive = certificate.status === 'active';
  const isExpired = new Date(certificate.not_after) < new Date();

  return (
    <Box>
      <Button
        variant="outlined"
        startIcon={<MoreVert />}
        onClick={handleMenuOpen}
        size="small"
      >
        Actions
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleDownloadCert}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download Certificate</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadKey}>
          <ListItemIcon>
            <GetApp fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download Private Key</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownloadBundle}>
          <ListItemIcon>
            <FolderZip fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download Bundle (ZIP)</ListItemText>
        </MenuItem>

        {isActive && !isExpired && (
          <>
            <Divider />
            <MenuItem onClick={handleRenewClick}>
              <ListItemIcon>
                <Autorenew fontSize="small" />
              </ListItemIcon>
              <ListItemText>Renew Certificate</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleRevokeClick}>
              <ListItemIcon>
                <Block fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Revoke Certificate</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      <ConfirmDialog
        open={revokeDialogOpen}
        onClose={() => setRevokeDialogOpen(false)}
        onConfirm={handleRevokeConfirm}
        title="Revoke Certificate"
        message={`Are you sure you want to revoke the certificate for "${certificate.common_name}"? This action cannot be undone.`}
        confirmText="Revoke"
        severity="error"
      />

      <ConfirmDialog
        open={renewDialogOpen}
        onClose={() => setRenewDialogOpen(false)}
        onConfirm={handleRenewConfirm}
        title="Renew Certificate"
        message={`This will create a new certificate for "${certificate.common_name}" with the same parameters. The current certificate will be marked as superseded.`}
        confirmText="Renew"
        severity="info"
      />

      <PassphraseDialog
        open={passphraseDialogOpen}
        onClose={() => {
          setPassphraseDialogOpen(false);
          setCurrentAction(null);
          setPassphraseError(null);
        }}
        onSubmit={handlePassphraseSubmit}
        loading={loading}
        error={passphraseError}
        title={`CA Passphrase Required - ${currentAction === 'revoke' ? 'Revoke' : 'Renew'}`}
        message={`Enter the CA passphrase to ${currentAction} this certificate.`}
      />
    </Box>
  );
};

export default CertificateActions;
