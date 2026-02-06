import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Box,
} from '@mui/material';
import DateDisplay from '../common/DateDisplay';
import LoadingSpinner from '../common/LoadingSpinner';

const AuditLog = ({ logs, loading }) => {
  if (loading) {
    return <LoadingSpinner message="Loading audit logs..." />;
  }

  if (!logs || logs.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          No audit logs found
        </Typography>
      </Paper>
    );
  }

  const getActionColor = (action) => {
    if (action.includes('create') || action.includes('issue')) return 'success';
    if (action.includes('revoke') || action.includes('reject')) return 'error';
    if (action.includes('approve')) return 'info';
    return 'default';
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Timestamp</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Entity Type</TableCell>
            <TableCell>User</TableCell>
            <TableCell>IP Address</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} hover>
              <TableCell>
                <DateDisplay date={log.timestamp} format="PPpp" showRelative />
              </TableCell>
              <TableCell>
                <Chip
                  label={log.action.replace(/_/g, ' ')}
                  color={getActionColor(log.action)}
                  size="small"
                />
              </TableCell>
              <TableCell>{log.entity_type}</TableCell>
              <TableCell>{log.user?.email || 'System'}</TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {log.ip_address || '-'}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AuditLog;
