import { useState, useCallback } from 'react';
import { getPurchaseOrders, updatePurchaseOrderStatus } from '../services/supplierPurchaseOrderService';

/**
 * Custom Hook - Manages the state, fetching, and updates for supplier purchase orders.
 */
const useSupplierPurchaseOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetches the purchase orders mapped to the authenticated supplier.
   */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPurchaseOrders();
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Modifies the status and estimated delivery time for a given purchase order.
   * Optimistically updates the local state if the API request resolves.
   * 
   * @param {number} orderId the purchase order identifier
   * @param {Object} updateData new status and timeline data
   */
  const updateStatus = async (orderId, updateData) => {
    try {
      const updatedOrder = await updatePurchaseOrderStatus(orderId, updateData);
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? updatedOrder : order))
      );
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to update order status',
      };
    }
  };

  return {
    orders,
    loading,
    error,
    fetchOrders,
    updateStatus,
  };
};

export default useSupplierPurchaseOrders;