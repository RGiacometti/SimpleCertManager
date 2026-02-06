import React from 'react';
import { Chip } from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
  Warning,
  Block,
  HourglassEmpty,
} from '@mui/icons-material';

const StatusChip = ({ status, type = 'certificate' }) => {
  const getStatusConfig = () => {
    if (type === 'certificate') {
      switch (status) {
        case 'active':
          return {
            label: 'Active',
            color: 'success',
            icon: <CheckCircle />,
          };
        case 'expired':
          return {
            label: 'Expired',
            color: 'error',
            icon: <Cancel />,
          };
        case 'revoked':
          return {
            label: 'Revoked',
            color: 'error',
            icon: <Block />,
          };
        case 'expiring_soon':
          return {
            label: 'Expiring Soon',
            color: 'warning',
            icon: <Warning />,
          };
        default:
          return {
            label: status,
            color: 'default',
            icon: null,
          };
      }
    }

    if (type === 'request') {
      switch (status) {
        case 'pending':
          return {
            label: 'Pending',
            color: 'warning',
            icon: <HourglassEmpty />,
          };
        case 'approved':
          return {
            label: 'Approved',
            color: 'info',
            icon: <CheckCircle />,
          };
        case 'rejected':
          return {
            label: 'Rejected',
            color: 'error',
            icon: <Cancel />,
          };
        case 'issued':
          return {
            label: 'Issued',
            color: 'success',
            icon: <CheckCircle />,
          };
        default:
          return {
            label: status,
            color: 'default',
            icon: null,
          };
      }
    }

    return {
      label: status,
      color: 'default',
      icon: null,
    };
  };

  const config = getStatusConfig();

  return (
    <Chip
      label={config.label}
      color={config.color}
      icon={config.icon}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );
};

export default StatusChip;
