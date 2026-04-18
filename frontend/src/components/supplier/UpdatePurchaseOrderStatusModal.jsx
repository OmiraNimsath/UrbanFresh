import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useSupplierPurchaseOrders from '../../hooks/useSupplierPurchaseOrders';

/**
 * Component Layer - Modal for a supplier to update the status and estimated
 * delivery timeline of a specific purchase order.
 * When marking as DELIVERED, the supplier can also provide per-item batch metadata.
 */
export default function UpdatePurchaseOrderStatusModal({ isOpen, onClose, order, onUpdateSuccess }) {
  const { updateStatus } = useSupplierPurchaseOrders();
  const initialBatchData = (order?.items || []).reduce((acc, item) => {
    acc[item.id] = {
      supplierExpiryDate: item.supplierExpiryDate || '',
    };
    return acc;
  }, {});

  const [status, setStatus] = useState(order?.status || 'PENDING');
  const [timeline, setTimeline] = useState(order?.estimatedDeliveryTimeline || '');
  const [batchData, setBatchData] = useState(initialBatchData);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#e4ebe8] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e8efec] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#163a2f]">Update Order PO-{order.id}</h2>
            <p className="text-xs text-[#6f817b]">Modify shipment status and delivery details</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#6f817b] transition hover:bg-[#f0f4f2] hover:text-[#163a2f]"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#26443a]">Shipment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 w-full rounded-lg border border-[#d8e2de] bg-[#f7f9f8] px-3 text-sm text-[#26443a] outline-none transition focus:border-[#0d4a38]"
                required
              >
                <option value="ACCEPTED">Accepted</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>

            {status === 'SHIPPED' && (
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#26443a]">Estimated Delivery Timeline</label>
                <input
                  type="text"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  placeholder="e.g., Nov 12th, or 3 days"
                  className="h-11 w-full rounded-lg border border-[#d8e2de] bg-[#f7f9f8] px-3 text-sm text-[#26443a] outline-none transition focus:border-[#0d4a38]"
                  required
                />
                <p className="mt-1 text-xs text-[#6f817b]">A general estimate to help admins plan restocking.</p>
              </div>
            )}

            {status === 'DELIVERED' && order.items?.length > 0 && (
              <div className="space-y-4">
                <span className="text-sm font-semibold text-[#26443a]">Batch Details Per Item</span>
                {order.items.map((item) => (
                  <div key={item.id} className="space-y-3 rounded-lg border border-[#dfe8e4] bg-[#f7f9f8] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#163a2f]">{item.productName}</span>
                      <span className="rounded border border-[#d8e2de] bg-white px-2 py-0.5 text-xs text-[#6f817b]">Qty: {item.quantity}</span>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#6f817b]">Expiry Date *</label>
                      <input
                        type="date"
                        value={batchData[item.id]?.supplierExpiryDate || ''}
                        onChange={(e) => handleBatchField(item.id, 'supplierExpiryDate', e.target.value)}
                        className="h-10 w-full rounded-lg border border-[#d8e2de] bg-white px-3 text-sm text-[#26443a] outline-none transition focus:border-[#0d4a38]"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-[#e8efec] bg-white px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 rounded-lg border border-[#dbe4e0] px-4 text-sm font-medium text-[#3d5951] transition hover:bg-[#f4f8f6] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-lg bg-[#0d4a38] px-5 text-sm font-semibold text-white transition hover:bg-[#083a2c] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}