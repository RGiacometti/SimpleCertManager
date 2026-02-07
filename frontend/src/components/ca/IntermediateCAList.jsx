import React, { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  InputAdornment,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Search,
  Visibility,
  Download,
  Link as LinkIcon,
  Block,
} from '@mui/icons-material';
import StatusChip from '../common/StatusChip';
import DateDisplay from '../common/DateDisplay';
import LoadingSpinner from '../common/LoadingSpinner';

const IntermediateCAList = ({
  intermediateCAs,
  loading,
  onView,
  onDownloadCert,
  onDownloadChain,
  onRevoke,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getICAStatus = (ica) => {
    if (ica.status === 'revoked') return 'revoked';
    if (new Date(ica.not_after) < new Date()) return 'expired';
    const daysLeft = (new Date(ica.not_after) - new Date()) / (1000 * 60 * 60 * 24);
    if (daysLeft < 90) return 'expiring_soon';
    return 'active';
  };

  const filteredCAs = (intermediateCAs || []).filter((ica) => {
    const matchesSearch =
      (ica.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ica.common_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const icaStatus = getICAStatus(ica);
    const matchesStatus =
      statusFilter === 'all' || icaStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner message="Loading intermediate CAs..." />;
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              placeholder="Search by name or common name..."
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
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="expiring_soon">Expiring Soon</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
              <MenuItem value="revoked">Revoked</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {filteredCAs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No intermediate CAs found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create an intermediate CA to get started'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Common Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Certificates</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCAs.map((ica) => {
                const status = getICAStatus(ica);
                return (
                  <TableRow
                    key={ica.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => onView(ica)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {ica.name || ica.common_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {ica.common_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={status} type="certificate" />
                    </TableCell>
                    <TableCell>
                      <DateDisplay date={ica.not_after} format="PPP" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ica.certificates_issued ?? 0}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => onView(ica)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Certificate">
                        <IconButton size="small" onClick={() => onDownloadCert(ica)}>
                          <Download />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Chain">
                        <IconButton size="small" onClick={() => onDownloadChain(ica)}>
                          <LinkIcon />
                        </IconButton>
                      </Tooltip>
                      {status === 'active' && (
                        <Tooltip title="Revoke">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => onRevoke(ica)}
                          >
                            <Block />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default IntermediateCAList;
