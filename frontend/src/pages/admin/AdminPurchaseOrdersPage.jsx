import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAllPurchaseOrders, confirmDeliveryAndStock, createPurchaseOrder } from '../../services/adminPurchaseOrderService';

/**
 * Controller Layer - Basic Admin Page to view and create purchase orders.
 */
export default function AdminPurchaseOrdersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simple state for creating a quick PO from URL state
  const [brandId, setBrandId] = useState(location.state?.brandId || '');
  const [productId, setProductId] = useState(location.state?.productId || '');
  const [quantity, setQuantity] = useState(50);
  const [creating, setCreating] = useState(false);
  const [confirmOrderId, setConfirmOrderId] = useState(null);
  const [confirmOrderItems, setConfirmOrderItems] = useState([]); // items of the order being confirmed
  const [batchFormData, setBatchFormData] = useState({}); // { [itemId]: { batchNumber, manufacturingDate, supplierExpiryDate } }
  const [viewReason, setViewReason] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllPurchaseOrders();
      setOrders(data);
    } catch {
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createPurchaseOrder({
        brandId: Number(brandId),
        items: [{ productId: Number(productId), quantity: Number(quantity) }]
      });
      toast.success('Purchase order created successfully!');
      loadOrders();
      setBrandId('');
      setProductId('');
      setQuantity(50);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create PO');
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmOrderId) return;
    try {
      // Build per-item batch overrides from the form
      const items = confirmOrderItems.map((item) => {
        const d = batchFormData[item.id] || {};
        return {
          itemId: item.id,
          batchNumber: null,
          manufacturingDate: null,
          supplierExpiryDate: d.supplierExpiryDate || null,
        };
      });
      await confirmDeliveryAndStock(confirmOrderId, { items });
      toast.success('Stock updated and batches created successfully!');
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm delivery');
    } finally {
      setConfirmOrderId(null);
      setConfirmOrderItems([]);
      setBatchFormData({});
    }
  };

  const handleConfirm = (order) => {
    setConfirmOrderId(order.id);
    setConfirmOrderItems(order.items || []);
    // Pre-fill with any existing batch data on the PO items
    const initial = {};
    (order.items || []).forEach((item) => {
      initial[item.id] = {
          supplierExpiryDate: item.supplierExpiryDate || '',
        };
    });
    setBatchFormData(initial);
  };

  const handleBatchFieldChange = (itemId, field, value) => {
    setBatchFormData((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const th = "px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs";
  const td = "px-4 py-3 text-gray-700 border-t border-gray-100";

  // Filter orders with notices
  const noticedOrders = orders.filter(
    (order) => order.status === "CANCELLED" && order.supplierNotice
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {confirmOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Delivery & Create Batches</h3>
              <button onClick={() => { setConfirmOrderId(null); setConfirmOrderItems([]); setBatchFormData({}); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
              <p className="text-sm text-gray-500">Enter batch details for each item. <span className="font-medium text-amber-600">Expiry date is required</span> to enable batch tracking. Leave blank to add stock without batch.</p>
              {confirmOrderItems.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800 text-sm">{item.productName}</span>
                    <span className="text-xs text-gray-500 bg-white border border-gray-200 rounded px-2 py-0.5">Qty: {item.quantity}</span>
                  </div>
                  <div>
                      <label className="block text-xs font-medium text-amber-700 mb-1">Expiry Date *</label>
                      <input
                        type="date"
                        value={batchFormData[item.id]?.supplierExpiryDate || ''}
                        onChange={(e) => handleBatchFieldChange(item.id, 'supplierExpiryDate', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-amber-300 rounded-lg focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                type="button"
                onClick={() => { setConfirmOrderId(null); setConfirmOrderItems([]); setBatchFormData({}); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Confirm & Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {viewReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-xl border border-gray-200 p-0 w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Rejection Rationale
              </h3>
              <button onClick={() => setViewReason(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 text-gray-700 border border-gray-200 rounded-lg p-4 text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                {viewReason}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all"
                  onClick={() => setViewReason(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between bg-white p-6 rounded-lg shadow items-center">
          <h1 className="text-2xl font-bold text-gray-800">Supplier Purchase Orders</h1>
          <div className="space-x-4">
            <button onClick={() => navigate('/admin')} className="text-blue-600 hover:underline text-sm font-medium">Dashboard</button>
            <button onClick={() => navigate('/admin/inventory')} className="text-blue-600 hover:underline text-sm font-medium">Inventory</button>
          </div>
        </div>

        {noticedOrders.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Supplier Notices Available</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {noticedOrders.map((order) => (
                      <li key={`notice-${order.id}`}>
                        <span className="font-semibold">Order #{order.id} ({order.brandName}):</span> {order.supplierNotice}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Listing */}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
             <p className="p-6 text-gray-500">Loading...</p>
          ) : orders.length === 0 ? (
            <p className="p-6 text-gray-500">No purchase orders found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className={th}>ID</th>
                  <th className={th}>Brand Name</th>
                  <th className={th}>Items</th>
                  <th className={th}>Status</th>
                  <th className={th}>Est Delivery</th>
                  <th className={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className={td}>#{order.id}</td>
                    <td className={td}>{order.brandName}</td>
                    <td className={td}>{order.items.map(i => `${i.quantity}x ${i.productName}`).join(", ")}</td>
                    <td className={td}>
                       <span className={`px-2 py-1 text-xs font-semibold rounded-full ${order.status==="DELIVERED"?"bg-blue-100 text-blue-800":order.status==="COMPLETED"?"bg-green-100 text-green-700":order.status==="PENDING"?"bg-yellow-100 text-yellow-700":order.status==="CANCELLED"?"bg-red-100 text-red-700":"bg-gray-100 text-gray-700"}`}>
                          {order.status}
                       </span>
                    </td>
                    <td className={td}>
                      {order.status === "COMPLETED" 
                        ? "Delivered" 
                        : (order.estimatedDeliveryTimeline || "—")}
                    </td>
                    <td className={td}>
                      {order.status === "DELIVERED" && (
                        <button onClick={() => handleConfirm(order)} className="text-xs bg-indigo-600 text-white rounded px-3 py-1 hover:bg-indigo-700 transition">
                          Confirm Delivery & Update Stock
                        </button>
                      )}
                      {order.status === "CANCELLED" && (
                        <div className="flex flex-col gap-2 relative group w-max">
                          <button onClick={() => setViewReason(order.rejectionReason || "No reason provided")} className="text-xs bg-gray-100 text-gray-700 border border-gray-300 rounded px-3 py-1 hover:bg-gray-200 transition">
                            Rationale
                          </button>
                          {order.supplierNotice && (
                            <button onClick={() => {
                               setViewReason(`Supplier Notice:\n${order.supplierNotice}`);
                             }} 
                             className="absolute top-0 right-[-10px] w-3 h-3 bg-blue-500 rounded-full animate-pulse blur"
                             title="New Notice from Supplier">
                            </button>
                          )}
                          {order.supplierNotice && (
                             <button onClick={() => {
                               setViewReason(`Supplier Notice:\n${order.supplierNotice}`);
                             }} 
                             className="absolute top-0 right-[-10px] w-3 h-3 bg-blue-500 rounded-full"
                             title="New Notice from Supplier">
                             </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}



