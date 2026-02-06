import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Visibility,
  CheckCircle,
  Cancel,
  Description,
} from '@mui/icons-material';
import StatusChip from '../common/StatusChip';
import DateDisplay from '../common/DateDisplay';

const RequestCard = ({ request, onView, onApprove, onReject, onIssue }) => {
  const canApprove = request.status === 'pending';
  const canIssue = request.status === 'approved';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
            {request.common_name}
          </Typography>
          <StatusChip status={request.status} type="request" />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Organization
          </Typography>
          <Typography variant="body2">{request.organization || '-'}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Requested
          </Typography>
          <DateDisplay date={request.requested_at} showRelative />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Validity
          </Typography>
          <Typography variant="body2">{request.validity_days} days</Typography>
        </Box>

        {request.notes && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Notes
            </Typography>
            <Typography variant="body2" noWrap>
              {request.notes}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => onView(request)}>
              <Visibility />
            </IconButton>
          </Tooltip>
          {canApprove && (
            <>
              <Tooltip title="Approve">
                <IconButton size="small" color="success" onClick={() => onApprove(request)}>
                  <CheckCircle />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton size="small" color="error" onClick={() => onReject(request)}>
                  <Cancel />
                </IconButton>
              </Tooltip>
            </>
          )}
          {canIssue && (
            <Tooltip title="Issue Certificate">
              <IconButton size="small" color="primary" onClick={() => onIssue(request)}>
                <Description />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default RequestCard;
