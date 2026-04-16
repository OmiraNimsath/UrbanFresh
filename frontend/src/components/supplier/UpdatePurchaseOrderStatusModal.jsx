import React, { useState } from 'react';
import toast from 'react-hot-toast';
import useSupplierPurchaseOrders from '../../hooks/useSupplierPurchaseOrders';

/**
 * Component Layer - Modal for a supplier to update the status and estimated
 * delivery timeline of a specific purchase order.
 * When marking as DELIVERED, the supplier can also provide per-item batch metadata.
 */
export default function UpdatePurchaseOrderStatusModal({ isOpen, onClose, order, onUpdateSuccess }) {
  const { updateStatus } = useSupplierPurchaseOrders();
  const [status, setStatus] = useState(order?.status || 'PENDING');
  const [timeline, setTimeline] = useState(order?.estimatedDeliveryTimeline || '');
  const [batchData, setBatchData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if order changes
  React.useEffect(() => {
    if (order) {
      setStatus(order.status);
      setTimeline(order.estimatedDeliveryTimeline || '');
      // Pre-fill expiry date from existing PO item data
      const initial = {};
      (order.items || []).forEach((item) => {
        initial[item.id] = {
          supplierExpiryDate: item.supplierExpiryDate || '',
        };
      });
      setBatchData(initial);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleBatchField = (itemId, field, value) => {
    setBatchData((prev) => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      status,
      estimatedDeliveryTimeline: timeline || null,
    };

    // Attach expiry date when marking as DELIVERED
    if (status === 'DELIVERED' && order.items?.length > 0) {
      payload.items = order.items.map((item) => {
        const d = batchData[item.id] || {};
        return {
          itemId: item.id,
          batchNumber: null,
          manufacturingDate: null,
          supplierExpiryDate: d.supplierExpiryDate || null,
        };
      });
    }

    const result = await updateStatus(order.id, payload);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Update Order #{order.id}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
                required
              >
                <option value="ACCEPTED">Accepted</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>

            {/* Timeline — only when SHIPPED */}
            {status === 'SHIPPED' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery Timeline</label>
                <input
                  type="text"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  placeholder="e.g., Nov 12th, or 3 days"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">A general estimate to help admins plan restocking.</p>
              </div>
            )}

            {/* Batch fields — only when DELIVERED */}
            {status === 'DELIVERED' && order.items?.length > 0 && (
              <div className="space-y-4">
                <span className="text-sm font-medium text-gray-700">Batch Details per Item</span>
                {order.items.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{item.productName}</span>
                      <span className="text-xs text-gray-500 bg-white border border-gray-200 rounded px-2 py-0.5">Qty: {item.quantity}</span>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-amber-700 mb-1">Expiry Date *</label>
                      <input
                        type="date"
                        value={batchData[item.id]?.supplierExpiryDate || ''}
                        onChange={(e) => handleBatchField(item.id, 'supplierExpiryDate', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-amber-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}