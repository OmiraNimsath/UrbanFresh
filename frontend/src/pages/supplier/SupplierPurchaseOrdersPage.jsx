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
  const { orders, loading, error, fetchOrders, updateStatus, sendNotice } = useSupplierPurchaseOrders();
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectOrderId, setRejectOrderId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [noticeOrderId, setNoticeOrderId] = useState(null);
  const [noticeText, setNoticeText] = useState("");

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

  const submitReject = async () => {
    if (!rejectOrderId) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    
    const result = await updateStatus(rejectOrderId, { 
      status: 'CANCELLED', 
      rejectionReason: rejectionReason 
    });
    
    if (result.success) {
      toast.success('Order Rejected!');
      fetchOrders();
    } else {
      toast.error(result.error || 'Failed to reject order');
    }
    
    setRejectOrderId(null);
    setRejectionReason("");
  };

  const submitNotice = async () => {
    if (!noticeOrderId) return;
    if (!noticeText.trim()) {
      toast.error('Please provide the notice text.');
      return;
    }
    
    const result = await sendNotice(noticeOrderId, noticeText);
    
    if (result.success) {
      toast.success('Notice sent to admin!');
      fetchOrders();
    } else {
      toast.error(result.error || 'Failed to send notice');
    }
    
    setNoticeOrderId(null);
    setNoticeText("");
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
          {rejectOrderId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm transition-opacity">
              <div className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100">
                <div className="mb-4">
                  <h3 className="mb-2 text-lg font-bold text-gray-800">Reject Order #{rejectOrderId}</h3>
                  <p className="text-gray-500 text-sm mb-4">Please provide a reason for rejecting this order. This will be visible to the admins.</p>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 min-h-[100px]"
                    placeholder="Enter reason..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    autoFocus
                  ></textarea>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-200"
                    onClick={() => { setRejectOrderId(null); setRejectionReason(""); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300"
                    onClick={submitReject}
                  >
                    Reject Order
                  </button>
                </div>
              </div>
            </div>
          )}

          {noticeOrderId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm transition-opacity">
              <div className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100">
                <div className="mb-4">
                  <h3 className="mb-2 text-lg font-bold text-gray-800">Send Notice</h3>
                  <p className="text-gray-500 text-sm mb-4">Inform the admin that the issue is resolved and the order can proceed.</p>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px]"
                    placeholder="Enter notice..."
                    value={noticeText}
                    onChange={(e) => setNoticeText(e.target.value)}
                    autoFocus
                  ></textarea>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-200"
                    onClick={() => { setNoticeOrderId(null); setNoticeText(""); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
                    onClick={submitNotice}
                  >
                    Send Notice
                  </button>
                </div>
              </div>
            </div>
          )}

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
                    <td className="px-4 py-3 text-gray-700 max-w-xs">
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-medium text-gray-800">{item.quantity}× {item.productName}</span>
                            {(item.batchNumber || item.supplierExpiryDate) && (
                              <div className="text-gray-400 mt-0.5 flex flex-wrap gap-x-2">
                                {item.batchNumber && <span>Batch: {item.batchNumber}</span>}
                                {item.supplierExpiryDate && <span>Exp: {item.supplierExpiryDate}</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {order.status === 'COMPLETED' 
                        ? "Delivered" 
                        : (order.estimatedDeliveryTimeline || <span className="text-gray-400 italic">Unscheduled</span>)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'DELIVERED' || order.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-700'
                            : order.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-700'
                            : order.status === 'ACCEPTED'
                            ? 'bg-teal-100 text-teal-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-l border-gray-100 flex items-center space-x-2">
                       {order.status === 'PENDING' ? (
                         <>
                           <button
                             onClick={async () => {
                               const result = await updateStatus(order.id, { status: 'ACCEPTED' });
                               if(result.success) {
                                 toast.success('Order Accepted!');
                                 fetchOrders();
                               } else {
                                 toast.error(result.error || 'Failed to accept order');
                               }
                             }}
                             className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 font-medium"
                           >
                             Accept
                           </button>
                           <button
                             onClick={() => setRejectOrderId(order.id)}
                             className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 font-medium"
                           >
                             Reject
                           </button>
                         </>
                       ) : order.status === 'CANCELLED' ? (
                         <button
                           onClick={() => setNoticeOrderId(order.id)}
                           className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                         >
                           Send Notice
                         </button>
                       ) : order.status !== 'COMPLETED' ? (
                         <button
                           onClick={() => handleOpenModal(order)}
                           className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3 transition-colors"
                         >
                           Update
                         </button>
                       ) : null}
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