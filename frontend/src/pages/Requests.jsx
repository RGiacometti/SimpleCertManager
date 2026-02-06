import React, { useState } from 'react';
import { Box, Typography, Snackbar, Alert } from '@mui/material';
import Layout from '../components/layout/Layout';
import RequestList from '../components/requests/RequestList';
import RequestForm from '../components/requests/RequestForm';
import RequestApproval from '../components/requests/RequestApproval';
import useRequests from '../hooks/useRequests';
import api from '../services/api';

const Requests = () => {
  const { requests, loading, refetch } = useRequests();
  const [formOpen, setFormOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [caConfig, setCAConfig] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch CA config on mount
  React.useEffect(() => {
    const fetchCAConfig = async () => {
      try {
        const response = await api.get('/ca/config');
        // Extract the actual config from the response
        const config = response.data?.data || response.data;
        setCAConfig(config);
      } catch (error) {
        console.error('Failed to fetch CA config:', error);
      }
    };
    fetchCAConfig();
  }, []);

  const handleNewRequest = () => {
    setFormOpen(true);
  };

  const handleView = (request) => {
    setSelectedRequest(request);
    setApprovalOpen(true);
  };

  const handleApprove = async (request) => {
    setSelectedRequest(request);
    setApprovalOpen(true);
  };

  const handleReject = async (request) => {
    setSelectedRequest(request);
    setApprovalOpen(true);
  };

  const handleIssue = async (request) => {
    setSelectedRequest(request);
    setApprovalOpen(true);
  };

  const handleSuccess = (message) => {
    setSnackbar({ open: true, message, severity: 'success' });
    refetch();
  };

  const handleError = (message) => {
    setSnackbar({ open: true, message, severity: 'error' });
  };

  return (
    <Layout>
      <Box>
        <Typography variant="h4" gutterBottom>
          Certificate Requests
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Create and manage certificate requests
        </Typography>

        <RequestList
          requests={requests}
          loading={loading}
          onView={handleView}
          onApprove={handleApprove}
          onReject={handleReject}
          onIssue={handleIssue}
          onNewRequest={handleNewRequest}
        />

        <RequestForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSuccess={handleSuccess}
          caConfig={caConfig}
        />

        <RequestApproval
          request={selectedRequest}
          open={approvalOpen}
          onClose={() => {
            setApprovalOpen(false);
            setSelectedRequest(null);
          }}
          onUpdate={() => {
            refetch();
            setApprovalOpen(false);
            setSelectedRequest(null);
            setSnackbar({ open: true, message: 'Request updated', severity: 'success' });
          }}
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

export default Requests;
