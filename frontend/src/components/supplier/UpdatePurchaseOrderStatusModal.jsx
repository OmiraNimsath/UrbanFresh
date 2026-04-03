import React, { useState } from 'react';
import toast from 'react-hot-toast';
import useSupplierPurchaseOrders from '../../hooks/useSupplierPurchaseOrders';

/**
 * Component Layer - Modal for a supplier to update the status and estimated
 * delivery timeline of a specific purchase order.
 */
export default function UpdatePurchaseOrderStatusModal({ isOpen, onClose, order, onUpdateSuccess }) {
  const { updateStatus } = useSupplierPurchaseOrders();
  const [status, setStatus] = useState(order?.status || 'PENDING');
  const [timeline, setTimeline] = useState(order?.estimatedDeliveryTimeline || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if order changes
  React.useEffect(() => {
    if (order) {
      setStatus(order.status);
      setTimeline(order.estimatedDeliveryTimeline || '');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await updateStatus(order.id, {
      status,
      estimatedDeliveryTimeline: timeline,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success('Purchase order updated successfully.');
      onUpdateSuccess();
      onClose();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 relative">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Update Order #{order.id}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shipment Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
              required
            >
              <option value="PENDING">Pending</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Delivery Timeline
            </label>
            <input
              type="text"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              placeholder="e.g., Nov 12th, or 3 days"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              A general estimate to help admins plan restocking.
            </p>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}