import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const useCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/certificates');
      // API returns { success: true, data: { items: [], page, totalItems, ... } }
      const data = response.data?.data || response.data;
      setCertificates(Array.isArray(data) ? data : (data?.items || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch certificates');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCertificate = useCallback(async (id) => {
    try {
      const response = await api.get(`/certificates/${id}`);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to fetch certificate');
    }
  }, []);

  const getExpiringCertificates = useCallback(async () => {
    try {
      const response = await api.get('/certificates/expiring');
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to fetch expiring certificates');
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  return {
    certificates,
    loading,
    error,
    refetch: fetchCertificates,
    getCertificate,
    getExpiringCertificates,
  };
};

export default useCertificates;
