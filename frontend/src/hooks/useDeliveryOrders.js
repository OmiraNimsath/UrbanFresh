import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAssignedDeliveryOrders } from '../services/orderService';

const DELIVERY_PAGE_SIZE = 50;
const HISTORY_STATUSES = new Set(['DELIVERED', 'RETURNED']);

/**
 * Loads assigned delivery orders once and derives current/history subsets.
 */
export default function useDeliveryOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const page = await getAssignedDeliveryOrders(0, DELIVERY_PAGE_SIZE);
      setOrders(Array.isArray(page?.content) ? page.content : []);
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

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0));
  }, [orders]);

  const currentOrders = useMemo(() => {
    return sortedOrders.filter((order) => order?.status === 'OUT_FOR_DELIVERY');
  }, [sortedOrders]);

  const historyOrders = useMemo(() => {
    return sortedOrders
      .filter((order) => HISTORY_STATUSES.has(order?.status))
      .sort((a, b) => new Date(b?.finalStatusAt || b?.createdAt || 0) - new Date(a?.finalStatusAt || a?.createdAt || 0));
  }, [sortedOrders]);

  const outForDeliveryOrders = useMemo(() => {
    return currentOrders;
  }, [currentOrders]);

  return {
    orders: sortedOrders,
    currentOrders,
    historyOrders,
    outForDeliveryOrders,
    loading,
    error,
    refreshOrders: loadOrders,
  };
}
