import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const useIntermediateCAs = () => {
  const [intermediateCAs, setIntermediateCAs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIntermediateCAs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/intermediate-cas');
      const data = response.data?.data || response.data;
      setIntermediateCAs(Array.isArray(data) ? data : (data?.items || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch intermediate CAs');
      setIntermediateCAs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getIntermediateCADetails = useCallback(async (id) => {
    try {
      const response = await api.get(`/intermediate-cas/${id}`);
      return response.data?.data || response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to fetch intermediate CA details');
    }
  }, []);

  const createIntermediateCA = useCallback(async (data) => {
    try {
      const response = await api.post('/intermediate-cas', data);
      await fetchIntermediateCAs();
      return response.data?.data || response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to create intermediate CA');
    }
  }, [fetchIntermediateCAs]);

  const updateIntermediateCA = useCallback(async (id, data) => {
    try {
      const response = await api.put(`/intermediate-cas/${id}`, data);
      await fetchIntermediateCAs();
      return response.data?.data || response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to update intermediate CA');
    }
  }, [fetchIntermediateCAs]);

  const revokeIntermediateCA = useCallback(async (id, data) => {
    try {
      const response = await api.post(`/intermediate-cas/${id}/revoke`, data);
      await fetchIntermediateCAs();
      return response.data?.data || response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to revoke intermediate CA');
    }
  }, [fetchIntermediateCAs]);

  const downloadCertificate = useCallback(async (id, filename) => {
    try {
      const response = await api.get(`/intermediate-cas/${id}/certificate`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/x-pem-file' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `ica-${id}.crt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to download certificate');
    }
  }, []);

  const downloadChain = useCallback(async (id, filename) => {
    try {
      const response = await api.get(`/intermediate-cas/${id}/chain`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/x-pem-file' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `ica-${id}-chain.pem`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to download chain');
    }
  }, []);

  const getStatus = useCallback(async (id) => {
    try {
      const response = await api.get(`/intermediate-cas/${id}/status`);
      return response.data?.data || response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to fetch ICA status');
    }
  }, []);

  useEffect(() => {
    fetchIntermediateCAs();
  }, [fetchIntermediateCAs]);

  return {
    intermediateCAs,
    loading,
    error,
    refetch: fetchIntermediateCAs,
    getIntermediateCADetails,
    createIntermediateCA,
    updateIntermediateCA,
    revokeIntermediateCA,
    downloadCertificate,
    downloadChain,
    getStatus,
  };
};

export default useIntermediateCAs;
