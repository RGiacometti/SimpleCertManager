import React, { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  InputAdornment,
  Typography,
  Paper,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Search } from '@mui/icons-material';
import CertificateCard from './CertificateCard';
import LoadingSpinner from '../common/LoadingSpinner';

const CertificateList = ({
  certificates,
  loading,
  onView,
  onDownload,
  onRevoke,
  onRenew,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredCertificates = (certificates || []).filter((cert) => {
    const matchesSearch =
      cert.common_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.serial_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      cert.status === statusFilter ||
      (statusFilter === 'expiring_soon' &&
        cert.status === 'active' &&
        new Date(cert.not_after) - new Date() < 30 * 24 * 60 * 60 * 1000);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner message="Loading certificates..." />;
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              placeholder="Search by common name or serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Certificates</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="expiring_soon">Expiring Soon</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
              <MenuItem value="revoked">Revoked</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {filteredCertificates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No certificates found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create a certificate request to get started'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredCertificates.map((certificate) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={certificate.id}>
              <CertificateCard
                certificate={certificate}
                onView={onView}
                onDownload={onDownload}
                onRevoke={onRevoke}
                onRenew={onRenew}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default CertificateList;
