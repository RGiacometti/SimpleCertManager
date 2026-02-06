import React, { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  InputAdornment,
  Typography,
  Paper,
  Button,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Search, Add } from '@mui/icons-material';
import RequestCard from './RequestCard';
import LoadingSpinner from '../common/LoadingSpinner';

const RequestList = ({
  requests,
  loading,
  onView,
  onApprove,
  onReject,
  onIssue,
  onNewRequest,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.common_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.organization?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner message="Loading requests..." />;
  }

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              placeholder="Search by common name or organization..."
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
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Requests</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="issued">Issued</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Add />}
              onClick={onNewRequest}
            >
              New Request
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {filteredRequests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No requests found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create a new certificate request to get started'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredRequests.map((request) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={request.id}>
              <RequestCard
                request={request}
                onView={onView}
                onApprove={onApprove}
                onReject={onReject}
                onIssue={onIssue}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default RequestList;
