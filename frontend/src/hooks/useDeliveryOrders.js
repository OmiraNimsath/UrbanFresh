import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAssignedDeliveryOrders, getAvailableDeliveryOrders } from '../services/orderService';

const DELIVERY_PAGE_SIZE = 50;
const HISTORY_STATUSES = new Set(['DELIVERED', 'RETURNED']);
const ACTIVE_STATUSES = new Set(['OUT_FOR_DELIVERY', 'READY']);

/**
 * Loads assigned delivery orders once and derives current/history subsets.
 */
export default function useDeliveryOrders() {
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [assignedPage, availablePage] = await Promise.all([
        getAssignedDeliveryOrders(0, DELIVERY_PAGE_SIZE),
        getAvailableDeliveryOrders(0, DELIVERY_PAGE_SIZE),
      ]);

      setAssignedOrders(Array.isArray(assignedPage?.content) ? assignedPage.content : []);
      setAvailableOrders(Array.isArray(availablePage?.content) ? availablePage.content : []);
    } catch (requestError) {
      const statusCode = requestError?.response?.status;
      setError(statusCode === 403 ? 'forbidden' : 'failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const sortedAssignedOrders = useMemo(() => {
    return [...assignedOrders].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
  }, [assignedOrders]);

  const sortedAvailableOrders = useMemo(() => {
    return [...availableOrders].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
  }, [availableOrders]);

  const currentOrders = useMemo(() => {
    return sortedAvailableOrders.filter((order) => order?.status === 'READY');
  }, [sortedAvailableOrders]);

  const activeOrders = useMemo(() => {
    return sortedAssignedOrders.filter((order) => ACTIVE_STATUSES.has(order?.status));
  }, [sortedAssignedOrders]);

  const historyOrders = useMemo(() => {
    return sortedAssignedOrders
      .filter((order) => HISTORY_STATUSES.has(order?.status))
      .sort((a, b) => new Date(b?.finalStatusAt || b?.createdAt || 0) - new Date(a?.finalStatusAt || a?.createdAt || 0));
  }, [sortedAssignedOrders]);

  const outForDeliveryOrders = useMemo(() => {
    return activeOrders.filter((order) => order?.status === 'OUT_FOR_DELIVERY');
  }, [activeOrders]);

  return {
    orders: sortedAssignedOrders,
    assignedOrders: sortedAssignedOrders,
    availableOrders: currentOrders,
    currentOrders,
    activeOrders,
    historyOrders,
    outForDeliveryOrders,
    loading,
    error,
    refreshOrders: loadOrders,
  };
}
