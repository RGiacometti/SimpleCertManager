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
  Download,
  Block,
  Autorenew,
} from '@mui/icons-material';
import StatusChip from '../common/StatusChip';
import DateDisplay from '../common/DateDisplay';

const CertificateCard = ({ certificate, onView, onDownload, onRevoke, onRenew }) => {
  const isExpired = new Date(certificate.not_after) < new Date();
  const isExpiringSoon =
    !isExpired &&
    new Date(certificate.not_after) - new Date() < 30 * 24 * 60 * 60 * 1000;

  const getStatus = () => {
    if (certificate.status === 'revoked') return 'revoked';
    if (isExpired) return 'expired';
    if (isExpiringSoon) return 'expiring_soon';
    return 'active';
  };

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
            {certificate.common_name}
          </Typography>
          <StatusChip status={getStatus()} type="certificate" />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Serial Number
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {certificate.serial_number}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Valid Until
          </Typography>
          <DateDisplay date={certificate.not_after} format="PPP" />
        </Box>

        {certificate.subject?.organization && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Organization
            </Typography>
            <Typography variant="body2">{certificate.subject.organization}</Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => onView(certificate)}>
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton size="small" onClick={() => onDownload(certificate)}>
              <Download />
            </IconButton>
          </Tooltip>
          {certificate.status === 'active' && !isExpired && (
            <>
              <Tooltip title="Renew">
                <IconButton size="small" onClick={() => onRenew(certificate)}>
                  <Autorenew />
                </IconButton>
              </Tooltip>
              <Tooltip title="Revoke">
                <IconButton size="small" color="error" onClick={() => onRevoke(certificate)}>
                  <Block />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CertificateCard;
