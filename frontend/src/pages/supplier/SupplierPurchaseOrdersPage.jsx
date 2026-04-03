import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import useSupplierPurchaseOrders from '../../hooks/useSupplierPurchaseOrders';
import UpdatePurchaseOrderStatusModal from '../../components/supplier/UpdatePurchaseOrderStatusModal';
import toast from 'react-hot-toast';

/**
 * Presentation Layer - Displays all purchase orders mapped to a supplier's brands.
 */
export default function SupplierPurchaseOrdersPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { orders, loading, error, fetchOrders } = useSupplierPurchaseOrders();
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  const handleOpenModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex justify-center items-center">
        <p className="text-gray-500">Loading purchase orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-blue-50 flex flex-col justify-center items-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate('/supplier')}
          className="text-blue-600 underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 py-8 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Global Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold text-green-700">Urban Fresh - Purchase Orders</h1>
          <div className="flex space-x-4 items-center">
            <button
              onClick={() => navigate('/supplier')}
              className="text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Order Main Content */}
        <div className="bg-white rounded-xl shadow-sm p-6 overflow-x-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Your Brand Orders</h2>
            <p className="text-sm text-gray-500">Logged in as {user?.name}</p>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-gray-500">No purchase orders found for your assigned brands.</p>
            </div>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">PO #</th>
                  <th className="px-4 py-3 text-left">Brand</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-left">Estimate</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left border-l border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800 font-medium">#{order.id}</td>
                    <td className="px-4 py-3 text-gray-700">{order.brandName || "Unknown"}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                      {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {order.estimatedDeliveryTimeline || <span className="text-gray-400 italic">Unscheduled</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'DELIVERED'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-700'
                            : order.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-l border-gray-100">
                      <button
                        onClick={() => handleOpenModal(order)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3 transition-colors"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <UpdatePurchaseOrderStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onUpdateSuccess={() => fetchOrders()}
      />
    </div>
  );
}