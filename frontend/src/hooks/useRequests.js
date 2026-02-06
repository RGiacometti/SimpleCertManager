import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const useRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/requests');
      // API returns { success: true, data: { items: [], page, totalItems, ... } }
      const data = response.data?.data || response.data;
      setRequests(Array.isArray(data) ? data : (data?.items || []));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRequest = useCallback(async (id) => {
    try {
      const response = await api.get(`/requests/${id}`);
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to fetch request');
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
    getRequest,
  };
};

export default useRequests;
