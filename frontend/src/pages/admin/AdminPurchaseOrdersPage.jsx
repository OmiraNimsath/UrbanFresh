import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAllPurchaseOrders, confirmDeliveryAndStock } from '../../services/adminPurchaseOrderService';

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

  const handleConfirm = async (orderId) => {
    if (!window.confirm("Are you sure you want to mark this as completed and update stock?")) return;
    try {
      await confirmDeliveryAndStock(orderId);
      toast.success('Stock updated successfully!');
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm delivery');
    }
  };

  const th = "px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider text-xs";
  const td = "px-4 py-3 text-gray-700 border-t border-gray-100";

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between bg-white p-6 rounded-lg shadow items-center">
          <h1 className="text-2xl font-bold text-gray-800">Supplier Purchase Orders</h1>
          <div className="space-x-4">
            <button onClick={() => navigate('/admin')} className="text-blue-600 hover:underline text-sm font-medium">Dashboard</button>
            <button onClick={() => navigate('/admin/inventory')} className="text-blue-600 hover:underline text-sm font-medium">Inventory</button>
          </div>
        </div>

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
                       <span className={`px-2 py-1 text-xs font-semibold rounded-full ${order.status==="DELIVERED"?"bg-blue-100 text-blue-800":order.status==="COMPLETED"?"bg-green-100 text-green-700":order.status==="PENDING"?"bg-yellow-100 text-yellow-700":"bg-gray-100 text-gray-700"}`}>
                          {order.status}
                       </span>
                    </td>
                    <td className={td}>{order.estimatedDeliveryTimeline || "�"}</td>
                    <td className={td}>
                      {order.status === "DELIVERED" && (
                        <button onClick={() => handleConfirm(order.id)} className="text-xs bg-indigo-600 text-white rounded px-3 py-1 hover:bg-indigo-700 transition">
                          Confirm Delivery & Update Stock
                        </button>
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



