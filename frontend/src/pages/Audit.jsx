import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, MenuItem } from '@mui/material';
import Grid from '@mui/material/Grid';
import Layout from '../components/layout/Layout';
import AuditLog from '../components/audit/AuditLog';
import api from '../services/api';

const Audit = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: 'all',
    entity_type: 'all',
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.action !== 'all') params.action = filters.action;
      if (filters.entity_type !== 'all') params.entity_type = filters.entity_type;

      const response = await api.get('/audit/logs', { params });
      const data = response.data?.data || response.data;
      setLogs(Array.isArray(data) ? data : (data?.items || []));
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Audit Log
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Track all system activities and changes
        </Typography>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Action"
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              >
                <MenuItem value="all">All Actions</MenuItem>
                <MenuItem value="create_request">Create Request</MenuItem>
                <MenuItem value="approve_request">Approve Request</MenuItem>
                <MenuItem value="reject_request">Reject Request</MenuItem>
                <MenuItem value="issue_certificate">Issue Certificate</MenuItem>
                <MenuItem value="revoke_certificate">Revoke Certificate</MenuItem>
                <MenuItem value="renew_certificate">Renew Certificate</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Entity Type"
                value={filters.entity_type}
                onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="certificate_request">Certificate Request</MenuItem>
                <MenuItem value="certificate">Certificate</MenuItem>
                <MenuItem value="ca_config">CA Configuration</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        <AuditLog logs={logs} loading={loading} />
      </Box>
    </Layout>
  );
};

export default Audit;
