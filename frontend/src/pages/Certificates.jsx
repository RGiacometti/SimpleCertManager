import React, { useState } from 'react';
import { Box, Typography, Snackbar, Alert } from '@mui/material';
import Layout from '../components/layout/Layout';
import CertificateList from '../components/certificates/CertificateList';
import CertificateDetails from '../components/certificates/CertificateDetails';
import useCertificates from '../hooks/useCertificates';

const Certificates = () => {
  const { certificates, loading, refetch } = useCertificates();
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleView = (certificate) => {
    setSelectedCertificate(certificate);
    setDetailsOpen(true);
  };

  const handleDownload = async (certificate) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/certificates/${certificate.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${certificate.common_name}.crt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSnackbar({ open: true, message: 'Certificate downloaded', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Download failed', severity: 'error' });
    }
  };

  const handleRevoke = (certificate) => {
    setSelectedCertificate(certificate);
    // Revoke logic handled in CertificateActions component
  };

  const handleRenew = (certificate) => {
    setSelectedCertificate(certificate);
    // Renew logic handled in CertificateActions component
  };

  const handleUpdate = () => {
    refetch();
    setSnackbar({ open: true, message: 'Certificates updated', severity: 'success' });
  };

  return (
    <Layout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Certificates
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Manage and monitor your SSL/TLS certificates
        </Typography>

        <CertificateList
          certificates={certificates}
          loading={loading}
          onView={handleView}
          onDownload={handleDownload}
          onRevoke={handleRevoke}
          onRenew={handleRenew}
        />

        <CertificateDetails
          certificate={selectedCertificate}
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
        />

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

export default Certificates;
